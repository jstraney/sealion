const Router = require('express').Router;

const {
  invokeReduce,
  implementReduce,
} = require('@owo/lib/hook')

const {
  paramCase,
} = require('@owo/lib/string');

const {
  useAuthorization,
  useArgs,
  consumeArgs,
  viewJSON,
} = require('./lib/middleware');

const logger = require('@owo/lib/logger')('@owo/plugin/server/server.plugin');

const {
  getEntityModels,
} = require('@owo/plugin/entity/entity.plugin')();

const EntityRouter = require('./EntityRouter');

// default is get, so search and read actions are set
implementReduce('entityCreateRouteMethod', async () => 'post');
implementReduce('entityUpdateRouteMethod', async () => 'put');
implementReduce('entityRemoveRouteMethod', async () => 'delete');

// default path is / so create is set
implementReduce('entitySearchRouteUri', async () => '/search');

// these actions all use the entity key identifier in the uri params
// (e.g.) /:id or /:name. When multiple keys exist, they default to
// using the querystring for args (so just / for uri)
implementReduce([
  'entityReadRouteUri',
  'entityUpdateRouteUri',
  'entityRemoveRouteUri',
], async (_, entityTypeInfo) => {

  logger.info('%o', entityTypeInfo);
  const {
    idProperties: keys,
  } = entityTypeInfo;

  if (keys.length === 1) {
    const [key] = keys;
    const keyName = key.propertyName;
    return `/:${keyName}`;
  }

  return '/';

});

implementReduce('entityCreateRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    propsNoIds = [],
  } = entityTypeInfo;

  return [
    useAuthorization('create', entityTypeName),
    useArgs({
      body: propsNoIds.map((prop) => prop.propertyName).concat(['fields']),
    }),
    consumeArgs(entityModel.create),
    viewJSON(),
  ];

});

implementReduce('entityReadRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    idProperties = [],
  } = entityTypeInfo;

  const idNames = idProperties.map((prop) => prop.propertyName);

  return [
    useAuthorization('read', entityTypeName),
    useArgs({
      params: idProperties.length === 1 ? idNames: [],
      query: idProperties.length === 1 ? []: idNames,
    }),
    consumeArgs(entityModel.read),
    viewJSON(),
  ];

});


implementReduce('entityUpdateRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    propsNoIds = [],
    idProperties = [],
  } = entityTypeInfo;

  const idNames = idProperties.map((prop) => prop.propertyName);

  return [
    useAuthorization('update', entityTypeName),
    useArgs({
      params: idProperties.length === 1 ? idNames: [],
      query: idProperties.length === 1 ? []: idNames,
      body: propsNoIds.concat(['fields']),
    }),
    consumeArgs(entityModel.update),
    viewJSON(),
  ];

});

implementReduce('entityRemoveRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    idProperties = [],
  } = entityTypeInfo;

  const idNames = idProperties.map((prop) => prop.propertyName);

  return [
    useAuthorization('remove', entityTypeName),
    useArgs({
      params: idProperties.length === 1 ? idNames: [],
      query: idProperties.length === 1 ? []: idNames,
    }),
    consumeArgs(entityModel.remove),
    viewJSON(),
  ];

});



implementReduce('entitySearchRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    properties = [],
  } = entityTypeInfo;

  const propertyNames = properties.map((prop) => prop.propertyName);

  return [
    useAuthorization('search', entityTypeName),
    useArgs({
      query: propertyNames.concat(['limit', 'offset']),
    }),
    consumeArgs(entityModel.search),
    viewJSON(),
  ];

});

implementReduce('entitySearchRouteMiddleware', async (router = [], entityTypeInfo, entityModel) => {

  const {
    name: entityTypeName,
    properties = [],
  } = entityTypeInfo;

  const propertyNames = properties.map((prop) => prop.propertyName);

  return [
    useAuthorization('search', entityTypeName),
    useArgs({
      query: propertyNames.concat(['limit', 'offset']),
    }),
    consumeArgs(entityModel.search),
    viewJSON(),
  ];

});


// TODO: implement (again) caching such that when a hook is
// invoked, the cache has certain entityRouters invalidate
// so when a rebuild is issued, only the affected routers
// rebuild.
implementReduce('resourceRouter', async (router) => {

  // get all entity models
  const models = await getEntityModels();

  // maybe order does not matter precisely for entities
  for (name in models) {

    const routerBaseUri = paramCase(name);

    const model = models[name];

    logger.debug('building the router for %s', name);

    const routableActions = await invokeReduce('entityRouterRoutableActions', model.actionNames);

    const routeWeights = await invokeReduce('entityRouterRouteWeights', {
      search: -1,
    });

    const entityRouter = new EntityRouter(model, {
      routableActions,
      routeWeights,
    });

    // build entityRoutes
    router.use(`/${routerBaseUri}`, await entityRouter.buildRouter());

  }

  // you can add your own routes
  return router;

});

const buildResourceRouter = async () => {

  logger.debug('building the resource router');

  return invokeReduce('resourceRouter', Router());

};


module.exports = async () => {

  return {
    buildResourceRouter,
  };

};
