const {
  implementHook,
  implementReduce,
  invokeReduce,
} = require('@owo/lib/hook');

const dbLib = require('@owo/lib/db');

const {
  Cache,
} = require('@owo/lib/cache');

const {
  collapseObjects,
  getIfSet,
} = require('@owo/lib/collection');

const logger = require('@owo/lib/logger')('@owo/plugin/entity/entity.plugin');

const EntityModel = require('./model/EntityModel');

const entityTypeActionCache = new Cache('entityTypeAction', ['memoryCache']);

const getEntityTypeActions = async (name) => {

  // TODO: make implementation correct. the cache invalidation
  // hooks below are running before the entityTypes are completely made
  // causing false empty spots in the cache
  /*
  const cachedResult = await entityTypeActionCache.getValue(name);

  if (cachedResult !== undefined) {
    return cachedResult;
  }
  */

  const reducers = [`entityModelActions`];

  if (name) {
    reducers.push(`${name}EntityModelActions`);
  }

  // here if someone wants to implement additional actions, they
  // can do so for all entities or just for their own entity
  // types by implementing <name>EntityModelActions reducer.
  // e.g. userEntityModelActions
  const result = collapseObjects(await invokeReduce(reducers, {
    create: EntityModel.create,
    read: EntityModel.read,
    update: EntityModel.update,
    remove: EntityModel.remove,
    search: EntityModel.search
  }, name));

  await entityTypeActionCache.setValue(name, result);

  return result;

};

const entityTypeInfoCache = new Cache('entityTypeInfo', ['memoryCache']);

implementReduce([`models`, `entityModels`], async (models = {}) => {

  const db = await dbLib.loadDB();

  // TODO: somehow use caching in entityTypeInfoCache to skip DB reads
  const entityTypeInfos = await EntityModel.getEntityTypeInfos(db);

  const entityModels = {};

  for (const entityTypeName in entityTypeInfos) {

    // if just one entityType is changed, the cache is invalidated
    // for just that type and the 'allEntityModels' key. this way,
    // other models can reuse their valid, cached values
    /*
    const cached = await entityTypeInfoCache.getValue(entityTypeName);

    if (cached !== undefined) {
      logger.silly('cached model for %s', entityTypeName);
      entityModels[`${entityTypeName}`] = cached;
      continue;
    }
    */

    const entityType = entityTypeInfos[entityTypeName];

    if (!entityType) {
      continue;
    }

    const actions = await getEntityTypeActions(entityTypeName);

    const defaultCache = new Cache(`${entityTypeName}Model`, [
      'memoryCache',
    ]);

    const cache = await invokeReduce(`${entityTypeName}Cache`, defaultCache);

    const model = new EntityModel(entityTypeName, {
      entityTypeInfo:entityType,
      actions,
      db,
      cache,
    });

    entityModels[`${entityTypeName}`] = model;

    // set the entityModel in a cache for performance
    await entityTypeInfoCache.setValue(entityTypeName, model);

  }

  const result = {...models, ...entityModels};

  // store all models in cache under special key
  await entityTypeInfoCache.setValue('allEntityModels', result);

  return result;

});

// TODO: figure out caching
const getEntityModels = async (names = []) => {

  // try getting all models
  /*
  const cachedModels = await entityTypeInfoCache.getValue('allEntityModels');

  const models = cachedModels !== undefined
    ? cachedModels
    : await invokeReduce('entityModels', {});
  */

  const models = await invokeReduce('entityModels');

  if (!names.length) {
    return models;
  }

  const result = {};

  for (const name of names) {

    // logger.info('wee %s', name)

    result[`${name}Model`] = models[name];

  }

  return result;

};

// TODO: move into different hooks. right now it is not executing at
// the correct time causing false results. may require a new hook to ensure
// all expected hooks are done and the entityType is completely created
// when a new entityType is create/updated/removed, invalidate
// the cache so that a fresh result is pulled.
const invalidateEntityTypeCache = async (rawArgs = {}) => {

  const {
    name: entityTypeName,
  } = rawArgs;

  logger.debug('entityType cache being invalidated for %s', entityTypeName);

  await Promise.all([
    entityTypeInfoCache.invalidate(entityTypeName),
    entityTypeInfoCache.invalidate('allEntityModels'),
  ]);

};

implementHook('entityTypeEntityCreate', invalidateEntityTypeCache);
implementHook('entityTypeEntityUpdate', invalidateEntityTypeCache);
implementHook('entityTypeEntityRemove', invalidateEntityTypeCache);


// helper to return a single model
const getEntityModel = (name) => {
  return getEntityModels([name]).then((controllers) => {
    return getIfSet(controllers, `${name}Model`);
  });
};

module.exports = () => ({
  getEntityTypeActions,
  getEntityModels,
  getEntityModel,
});
