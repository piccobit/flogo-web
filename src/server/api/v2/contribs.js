import { config } from '../../config/app-config';
import { inspectObj } from '../../common/utils';
import { ContribsManager  } from '../../modules/contribs/'
import { ErrorManager } from '../../common/errors';
import path from 'path';

let basePath = config.app.basePath;

export function contribs(router, basePath){
  router.post(`${basePath}/contributions/devices`, installContribs);
  router.get(`${basePath}/contributions/devices`, listContribs);
  router.get(`${basePath}/contributions/devices/:name`, getContribution);
}

function *listContribs() {
  const types = {
    'trigger': 'flogo:device:trigger',
    'activity': 'flogo:device:activity',
  };

  const search = {};
  const type = this.request.query['filter[type]'];
  if(type) {
    search.type = (types[type]? types[type] : type);
  }

  const foundContribs = yield ContribsManager.find(search);
  this.body = {
    data: foundContribs || [],
  };
}

function *getContribution()  {
  const name = this.params.name;

  const contribution = yield ContribsManager.findOne(name);
  this.body = { data: contribution };
}

function* installContribs( next ) {
  const urls = preProcessURLs(this.request.body.urls);

  let results = {};
    try {
      results = yield ContribsManager.install( urls );
    } catch ( err ) {
      throw new Error( '[error] Encounter error to add contributions to test engine.' );
    }

  if(results.fail.length) {
    throw ErrorManager.createRestError('Installation error in /contributions installContribs', {
      status: 400,
      title: 'Installation error',
      detail: 'There were one or more installation contrib problems',
      meta: results,
    });
  }

  this.body =  {
    data: results
  };

  yield next;
}


function preProcessURLs( urls ) {
  'use strict';
  return urls;
}
