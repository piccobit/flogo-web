import { App, FlogoAppModel, ContributionSchema, Handler } from '@flogo-web/core';
import {
  Resource,
  ResourceImportContext,
  Schemas,
  ValidationError,
  ResourceImporter,
  ValidationErrorDetail,
} from '@flogo-web/server/core';

import { constructApp } from '../../../core/models/app';
import { actionValueTypesNormalizer } from '../common/action-value-type-normalizer';
import { tryAndAccumulateValidationErrors } from '../common/try-validation-errors';
import { validatorFactory } from './validator';
import { importTriggers } from './import-triggers';

interface DefaultAppModelResource extends FlogoAppModel.Resource {
  data: {
    name?: string;
    description?: string;
    metadata?: any;
  };
}

export interface ImportersResolver {
  byType(resourceType: string): ResourceImporter;
  byRef(ref: string): ResourceImporter;
}

export function importApp(
  rawApp: FlogoAppModel.App,
  resolveImporter: ImportersResolver,
  generateId: () => string,
  contributions: Map<string, ContributionSchema>
): App {
  const now = new Date().toISOString();
  const newApp = cleanAndValidateApp(
    rawApp as FlogoAppModel.App,
    Array.from(contributions.values()),
    generateId,
    now
  );
  const { resources, normalizedResourceIds } = normalizeResources(
    (rawApp.resources || []) as DefaultAppModelResource[],
    generateId,
    now
  );
  const { triggers, normalizedTriggerIds, errors: handlerErrors } = importTriggers(
    rawApp.triggers || [],
    normalizedResourceIds,
    createHandlerImportResolver(resolveImporter, contributions),
    generateId,
    now
  );
  newApp.triggers = triggers;

  const context: ResourceImportContext = {
    contributions,
    normalizedResourceIds: normalizedResourceIds,
    normalizedTriggerIds: normalizedTriggerIds,
  };
  const resolveImportHook = createResourceImportResolver(resolveImporter, context);
  const { resources: importedResources, errors: resourceErrors } = applyImportHooks(
    resources,
    resolveImportHook
  );
  newApp.resources = importedResources;
  normalizedResourceIds.clear();
  normalizedTriggerIds.clear();

  const allErrors = (handlerErrors || []).concat(resourceErrors || []);
  if (allErrors.length > 0) {
    throw new ValidationError(
      'There were one or more validation errors while importing the app',
      allErrors
    );
  }

  return newApp;
}

function applyImportHooks(
  resources: Resource[],
  applyImportHook: (resource: Resource) => Resource
): { errors: null | ValidationErrorDetail[]; resources: Resource[] } {
  const { result: importedResources, errors } = tryAndAccumulateValidationErrors(
    resources,
    resource => applyImportHook(resource),
    resourceIndex => `.resources[${resourceIndex}]`
  );
  return { resources: importedResources, errors };
}

function cleanAndValidateApp(
  rawApp: FlogoAppModel.App,
  contributions: ContributionSchema[],
  getNextId: () => string,
  now = null
): App {
  const validator = createValidator(contributions);
  validator.validate(rawApp);
  rawApp = rawApp as FlogoAppModel.App;
  return constructApp({
    _id: getNextId(),
    name: rawApp.name,
    type: rawApp.type,
    description: rawApp.description,
    version: rawApp.version,
    properties: rawApp.properties || [],
  });
}

function normalizeResources(
  resources: DefaultAppModelResource[],
  generateId: () => string,
  now: string
): { resources: Resource[]; normalizedResourceIds: Map<string, string> } {
  const normalizedResourceIds = new Map<string, string>();
  const normalizedResources: Resource[] = [];
  (resources || []).forEach(resource => {
    const [resourceType] = resource.id.split(':');
    let normalizedResource: Resource = {
      id: generateId(),
      name: resource.data.name,
      description: resource.data.description,
      type: resourceType,
      metadata: resource.data.metadata,
      createdAt: now,
      updatedAt: null,
      data: resource.data,
    };
    normalizedResource = actionValueTypesNormalizer(normalizedResource);
    normalizedResources.push(normalizedResource);
    normalizedResourceIds.set(resource.id, normalizedResource.id);
  });

  return {
    resources: normalizedResources,
    normalizedResourceIds,
  };
}

function createValidator(contributions: ContributionSchema[]) {
  const contribRefs = contributions.map(c => c.ref);
  return validatorFactory(Schemas.v1.app, contribRefs, {
    schemas: [Schemas.v1.common, Schemas.v1.trigger],
  });
}

function createResourceImportResolver(
  resolveResourceImporter: ImportersResolver,
  context: ResourceImportContext
) {
  return (resource: Resource): Resource => {
    const forType = resource.type;
    const resourceImporter = resolveResourceImporter.byType(forType);
    if (resourceImporter) {
      return resourceImporter.resource(resource, context);
    }
    throw new ValidationError(
      `Cannot process resource of type "${forType}", no plugin registered for such type.`,
      [
        {
          data: forType,
          dataPath: '.type',
          keyword: 'supported-resource-type',
          params: {
            type: forType,
          },
        },
      ]
    );
  };
}

function createHandlerImportResolver(
  resolveResourceImporter: ImportersResolver,
  contributions: Map<string, ContributionSchema>
) {
  return (
    triggerRef: string,
    handler: FlogoAppModel.Handler,
    rawHandler: FlogoAppModel.Handler
  ): Handler => {
    const ref = handler.action && handler.action.ref;
    const resourceImporter = resolveResourceImporter.byRef(ref);
    if (resourceImporter) {
      return resourceImporter.handler(handler, {
        rawHandler,
        triggerSchema: contributions.get(triggerRef),
        contributions,
      });
    }
    throw new ValidationError(
      `Cannot process handler with ref "${ref}", no plugin registered for such type.`,
      [
        {
          data: ref,
          dataPath: '.action.ref',
          keyword: 'supported-handler-ref',
          params: {
            ref,
          },
        },
      ]
    );
  };
}