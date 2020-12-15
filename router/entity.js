const {
  implementReduce,
} = require('../lib/hook');

const {
  BadRequestError,
} = require('../lib/error');

const {
  useArgs,
  consumeArgs,
  viewJSON,
} = require('../lib/middleware');

const Router = require('express').Router;

const consumeWithEntityController = (action) => {

  if (!action) {
    throw new Error(`action is required for entity router`);
  }

  return async ( args = {} ) => {

    const {
      entityTypeName,
      ...nextArgs
    } = args;

    if (!entityControllers.hasOwnProperty(entityTypeName)) {
      throw new BadRequestError(`unrecognized entityTypeName, "${entityTypeName}"`);
    }

    const controller = entityControllers[entityTypeName];

    return controller[action](args);

  }

};

implementReduce('resourceRouter', (routers) => {

  const router = Router();

  router.post('/entity', [
    useArgs({all: true}),
    consumeArgs(consumeWithEntityController('create')),
    viewJSON(),
  ]);

  router.get('/entity', [
    useArgs({all: true}),
    consumeArgs(consumeWithEntityController('read')),
    viewJSON(),
  ]);

  router.put('/entity', [
    useArgs({all: true}),
    consumeArgs(consumeWithEntityController('update')),
    viewJSON(),
  ]);

  router.delete('/entity', [
    useArgs({all: true}),
    consumeArgs(consumeWithEntityController('del')),
    viewJSON(),
  ]);

  router.get('/entity', [
    useArgs({all: true}),
    consumeArgs(consumeWithEntityController('search')),
    viewJSON(),
  ]);

  return [...routers, router];

});

module.exports = {};
