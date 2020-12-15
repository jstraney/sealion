const express = require('express');

const {
  useArgs,
  consumeArgs,
  viewJSON,
} = require('../lib/middleware');

const {
  invokeReduce,
} = require('../lib/hook');

const ResourceRouter = async (controller, options = {}) => {

  const {
    idKey = 'id',
    propKeys = [idKey],
    name,
  } = controller;

  const router = express.Router();

  const {
    routableActions = ['create', 'read', 'update', 'delete', 'search'],
  } = options;

  let propsSansId;

  if (typeof idKey === 'string') {
    const
    idIndex = propKeys.indexOf(idKey),
    propsFst = propKeys.slice(0, idIndex),
    propsSnd = propKeys.slice(idIndex + 1),
    propsSansId = propsFst.concat(propsSnd);
  } else if (Array.isArray(idKey)) {
    const propsSansId = propKeys.filter((k) => !idKey.includes(k));
  } else {
    throw new Error('expected string or array for idKey in ResourceRouter');
  }

  if (routableActions.includes('create')) {

    router.post(`/${name}`, (await invokeReduce(`${name}CreateRouter`, [
      useArgs({
        body: propKeys,
      }),
      consumeArgs(controller.create),
      viewJSON(),
    ])));

  }

  if (routableActions.includes('read')) {
    router.get(`/${name}/:${idKey}`, (await invokeReduce(`${name}ReadRouter`, [
      useArgs({
        params: [idKey],
      }),
      consumeArgs(controller.read),
      viewJSON(),
    ])));
  }

  if (routableActions.includes('update')) {
    router.put(`/${name}/:${idKey}`, (await invokeReduce(`${name}UpdateRouter`, [
      useArgs({
        params: [idKey],
        body: propsSansId,
      }),
      consumeArgs(controller.update),
      viewJSON(),
    ])));
  }

  if (routableActions.includes('delete')) {
    router.delete(`/${name}/:${idKey}`, (await invokeReduce(`${name}DeleteRouter`, [
      useArgs({
        params: [idKey],
      }),
      consumeArgs(controller.del),
      viewJSON(),
    ])));
  }

  if (routableActions.includes('search')) {
    router.get(`/${name}`, (await invokeReduce(`${name}SearchRouter`, [
      useArgs({
        query: propKeys.concat(['limit', 'offset']),
      }),
      consumeArgs(controller.search),
      viewJSON(),
    ])));
  }

  return router;

}

module.exports = ResourceRouter;
