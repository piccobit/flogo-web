import sinon from 'sinon';
import { expect } from 'chai';

import { AppImporter } from './app-importer';

describe('importer.AppImporter', function () {
  const { dependencies, importer } = makeContext();

  describe('#import', function () {
    it('should throw an error if the app is invalid', async function () {
      const sandbox = sinon.createSandbox();
      const validateStub = sandbox.stub(importer, 'validateAndCleanAdditionalProperties');
      validateStub.returns({});
      let error = null;
      try {
        await importer.import({});
      } catch (e) {
        error = e;
      }
      expect(error).to.be.ok;
      sandbox.restore();
    });

    describe('when importing a valid app ', function () {
      let sandbox;
      const testDoubles = {
        validatorStub: null,
        appCreationStub: null,
        actionsImporterStub: null,
        triggerImporterMock: null,
      };
      let importResult;

      before(async function () {
        sandbox = sinon.createSandbox();
        testDoubles.validatorStub = sandbox.stub(importer, 'validateAndCleanAdditionalProperties')
          .callsFake(app => {
            app.id = 'myValidCleanAppId';
          });
        testDoubles.appCreationStub = sandbox.stub(dependencies.appStorage, 'create')
          .returns({ id: 'createdAppId' });

        const actionsMap = new Map();
        testDoubles.actionsImporterStub = sandbox.stub(dependencies.actionsImporter, 'importAll')
          .returns(actionsMap);
        testDoubles.triggerImporterMock = sandbox.mock(dependencies.triggerHandlersImporter);
        testDoubles.triggerImporterMock.expects('setAppId').once().withArgs('createdAppId');
        testDoubles.triggerImporterMock.expects('setActionsByOriginalId').once().withArgs(actionsMap);
        testDoubles.triggerImporterMock.expects('importAll').once();

        importResult = await importer.import({ id: 'myValidRawAppId' });
      });
      after(function () {
        sandbox.restore();
      });
      it('should validate the app structure', function () {
        const validatorStub = testDoubles.validatorStub;
        expect(validatorStub.calledOnce).to.equal(true);
      });
      it('should store the app', function () {
        const appCreationStub = testDoubles.appCreationStub;
        expect(appCreationStub.calledOnce).to.equal(true);
        expect(appCreationStub.calledWith({ id: 'myValidCleanAppId' })).to.equal(true);
      });
      it('should import the actions into the created app', function () {
        const actionsImporterStub = testDoubles.actionsImporterStub;
        expect(actionsImporterStub.calledOnce).to.equal(true);
        expect(actionsImporterStub.calledWith('createdAppId', { id: 'myValidRawAppId' })).to.equal(true);
      });
      it('should configure the trigger handlers importer and import the triggers and handlers', function () {
        testDoubles.triggerImporterMock.verify();
      });
      it('should return the imported app', function () {
        expect(importResult.id).to.equal('createdAppId');
      });
    });
  });

  /**
   * @return {{
   *      importer: AppImporter,
   *      dependencies: {fullAppValidator: {}, appStorage: {}, actionsImporter: {}, triggerHandlersImporter: {}}
   * }}
   */
  function makeContext() {
    const noOp = () => {
    };
    const fullAppValidator = {};
    const appStorage = { create: noOp };
    const actionsImporter = { importAll: noOp };
    const triggerHandlersImporter = { setAppId: noOp, setActionsByOriginalId: noOp, importAll: noOp };
    const importerInstance = new AppImporter(
      fullAppValidator,
      appStorage,
      actionsImporter,
      triggerHandlersImporter,
    );
    return {
      importer: importerInstance,
      dependencies: {
        fullAppValidator,
        appStorage,
        actionsImporter,
        triggerHandlersImporter,
      },
    };
  }
});