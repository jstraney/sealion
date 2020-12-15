
const Router = require('express').Router;

const {
  invokeReduce,
} = require('../lib/hook');

const ResourceRouter = require('./ResourceRouter');

const getResourceControllers = require('../controller');

const entityRouter = require('./entity');

module.exports = async () => {

  const router = Router();

  const controllers = await getResourceControllers();

  // these are plain old resources
  const coreResourceRouters = await Promise.all([
    'entityType',
    'role',
    'permission',
    'entityRole',
    'entityTypeProperty',
    'entityTypeBundle',
    'bundle',
    'bundleField',
    'logEvent',
    'rolePermission',
  ].map((name) => {

    if (!controllers.hasOwnProperty(name)) {
      throw new Error(`No controller for ${name}`);
    }

    return ResourceRouter(controllers[name]);

  }));

  // allow extending the router with new paths. entityType controller does this!
  const nextResourceRouters = await invokeReduce('resourceRouter', coreResourceRouters);

  // you can specify your own routers, but generally the provided ones
  // are okay. for vanity urls (e.g. /users/:id) you will want that to
  // be in your client implementation and use the sealion routes by proxy.
  // e.g.
  // user types in /users/:id in browser which gets used by a react app
  // or php driven website which then converts that to
  // https://sealionhost/entity
  router.use(nextResourceRouters);

  // the entity router is like a meta-router that accepts parameters
  // for the entityTypeName and bundleName which in turn affects which
  // controller is used.

  return router;

};
