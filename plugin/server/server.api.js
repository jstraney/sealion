/*
 * Reducer entity${action}RouteMethod
 * Reducer ${entityTypeName}Entity${action}RouteMethod
 *
 * define the HTTP method the router of the entity model
 * should accept for the specific action
 */
implementReduce('entityMyCustomActionRouteMethod'), () => {
  // sure!
  return 'options';
});

implementReduce('customEntityTypeRemoveRouteMethod', (defaultMethod, entityTypeInfo) => {
  // maybe it makes sense to use this
  return 'purge';
});

/*
 * Reducer entity${action}RouteUri
 * Reducer ${entityTypeName}Entity${action}RouteUri
 *
 * return the Route Uri for the action (or specific entityType action)
 * this is always a relative uri following the entityTypeName in kebab-case
 */
implementReduce('entitySearchRouteUri'), (defaultUri, entityTypeInfo) => {

  // change relative uri to all search actions from '/search' to '/index'
  return '/index';

});

implementReduce('personEntityRemoveRouteUri'), (defaultUri, entityTypeInfo) => {

  // again, whatever your needs are
  return '/terminate';

});

/*
 * Reducer entity${action}RouteMiddleware
 * Reducer ${entityTypeName}Entity${action}RouteMiddleware
 * Change the middleware used on the requested entity action
 */
implementReduce('entityCreateRouteMiddleware', (defaultMiddleware = [], entityTypeInfo = {}) => {

  [(req, res, next) => {

    if (req.session.hasBadgeOfHonor) {

      res.locals.response = { message: 'You fight with honor'};

    } else {

      res.locals.error = new Error('You dont fight with honor');

    }

    return next();

  }].concat(defaultMiddleware);

});
