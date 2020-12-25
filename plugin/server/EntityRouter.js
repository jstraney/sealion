const Router = require('express').Router;

const {
  pascalCase,
} = require('@owo/lib/string');

const {
  getIfSet,
} = require('@owo/lib/collection');


const {
  invokeReduce,
} = require('@owo/lib/hook');

const logger = require('@owo/lib/logger')('@owo/plugin/server/EntityRouter');

class EntityRouter {

  constructor(model, options = {}) {

    const actionNames = Object.keys(model.actions);

    const {
      routableActions = actionNames,
      routeWeights = {},
    } = options;

    // I was finding that there were conflicts in route uri patterns.
    // for example search might be entity-type/search
    // but if the route was registered after entity-type/:name
    // then entity-type/search would get treated as a direct read for
    // an entityType with name of 'search'.
    //
    // The default entityRouter action weight gives precedence to
    // search action but can be overwritten if you encounter similar conflicts
    // just be sure to weigh search over any paramaterized actions
    this.routableActions = routableActions.sort((a, b) => {

      const
      aWeight = getIfSet(routeWeights, a, 0),
      bWeight = getIfSet(routeWeights, b, 0);

      if (aWeight < bWeight) return -1;
      else if (bWeight < aWeight) return 1;
      return 0;

    });

    this.model = model;

    this.model

  }

  static entityRouteMethod(entityTypeInfo, action, model) {

    const {
      name: entityTypeName,
    } = entityTypeInfo;

    const reducerNames = [
      `entity${pascalCase(action)}RouteMethod`,
      `${entityTypeName}Entity${pascalCase(action)}RouteMethod`,
    ];

    return invokeReduce(reducerNames, 'get', entityTypeInfo, model)
      .then(([method1, method2]) => method2 !== 'get' ? method2 : method1);

  }

  static entityRouteUri(entityTypeInfo, action, model) {

    const {
      name: entityTypeName,
    } = entityTypeInfo;

    const reducerNames = [
      `entity${pascalCase(action)}RouteUri`,
      `${entityTypeName}Entity${pascalCase(action)}RouteUri`,
    ];

    return invokeReduce(reducerNames, '/', entityTypeInfo, model)
      .then(([uri1, uri2]) => uri2 !== '/' ? uri2: uri1);

  }

  static entityRouteMiddleware (entityTypeInfo, action, model) {

    const {
      name: entityTypeName,
    } = entityTypeInfo;

    const reducerNames = [
      `entity${pascalCase(action)}RouteMiddleware`,
      `${entityTypeName}Entity${pascalCase(action)}RouteMiddleware`,
    ];

    return invokeReduce(reducerNames, [], entityTypeInfo, model)
      .then(([ware1, ware2]) => ware2.length > 0 ? ware2: ware1);

  }

  async buildRouter () {

    const model = this.model;

    const {
      name: entityTypeName,
      entityTypeInfo
    } = model;

    // allow implementations to strap middleware to specific routers
    // (for example, loggers, caches, authorization, stats tracking)
    const [ router1, router2 ] = await invokeReduce([
      `entityRouter`,
      `${entityTypeName}EntityRouter`,
    ], Router());

    const router = router2.stack.length > 0 ? router2 : router1;

    logger.debug('buidling routes for %o', this.routableActions);

    const promisedRouteArgs = this.routableActions.map((action) => {

      return Promise.all([
        EntityRouter.entityRouteMethod(entityTypeInfo, action, model),
        EntityRouter.entityRouteUri(entityTypeInfo, action, model),
        EntityRouter.entityRouteMiddleware(entityTypeInfo, action, model),
      ])

    });

    const routeArgs = await Promise.all(promisedRouteArgs);

    routeArgs.forEach(([method, uri, middleware]) => {

      logger.debug('building a route like so %s, %s, %o', method, uri, middleware);

      router[method](uri, middleware);

    });

    return router;

  };


}

module.exports = EntityRouter;
