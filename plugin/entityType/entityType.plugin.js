const dbLib = require('@owo/lib/db');

const {
  camelCase,
  capitalCase,
} = require('@owo/lib/string')

const {
  BadRequestError,
} = require('@owo/lib/error');

const {
  implementHook,
  implementReduce,
  invokeHook,
  invokeReduce,
} = require('@owo/lib/hook');

const {
  getEntityModel,
  getEntityModels,
} = require('@owo/plugin/entity/entity.plugin')();

const logger = require('@owo/lib/logger')('owo://entityType:plugin/hook');

implementReduce('entityTypeEntityCreateTableArgs', async (nextArgs = {}, rawArgs = {}) => {

  // properties, and bundles are in arrays. will throw a
  // 'column not found' error. We still need these values to create
  // relations in entityTypeProperty,
  const {
    properties,
    bundles,
    ...tableArgs
  } = rawArgs;

  return {
    ...nextArgs,
    ...tableArgs,
  };

});

implementHook('entityTypeEntityCreate', async (rawArgs) => {

  const db = await dbLib.loadDB();

  const {
    entityTypePropertyModel,
    entityTypeBundleModel,
    bundleModel,
  } = await getEntityModels([
    'entityTypeProperty',
    'entityTypeBundle',
    'bundle',
  ]);

  const {
    name: entityTypeName,
    label: entityTypeLabel,
    properties = [],
  } = rawArgs;

  const idKeys = properties.filter((prop) => prop.isIdKey);

  if (!idKeys.length) {
    properties.push({
      name: 'id',
      label: 'Identifier',
      isIdKey: true,
      isRequired: true,
      type: 'increments',
    });
  }

  const stubColumnName = '__stubToBeRemoved__';

  // create entity table with just a simple ID
  await db.schema.createTable(entityTypeName, async (table) => {

    table.boolean(stubColumnName);

  });

  const propertyInserts = [];

  for (const propertyAttributes of properties) {

    // rename name to propertyName for entityTypeProperty table
    const {
      name: propertyName,
      ...nextConfig
    } = propertyAttributes;

    propertyInserts.push(entityTypePropertyModel.create({
      entityTypeName,
      propertyName,
      ...nextConfig
    }));

  }

  await Promise.all(propertyInserts).catch((error) => {

    logger.error('error creating entityType properties: %o', error);

    // remove entityType
    entityTypeModel.remove({name: entityTypeName});

    // still throw error
    throw error;

  });

  // remove the stub
  await db.schema.table(entityTypeName, async (table) => {

    table.dropColumn(stubColumnName);

  });

});


implementHook('entityTypeEntityRemove', async (numRemoved, rawArgs) => {

  if (!numRemoved) return;

  const {
    name: entityTypeName,
  } = rawArgs;

  const entityTypePropertyModel = await getEntityModel('entityTypeProperty');

  await db.schema.dropTable(entityTypeName);

  await entityTypePropertyModel.remove({
    entityTypeName,
  });

});

implementReduce('entityReadResult', async (result = {}, entityTypeInfo = {} ) => {

  const {
    name: entityTypeModelName,
  } = entityTypeInfo;

  if (entityTypeModelName !== 'entityType') {
    return result;
  }

  const {
    name: entityTypeName,
  } = result;

  const {
    entityTypePropertyModel,
    entityTypeBundleModel,
  } = await getEntityModels([
    'entityTypeProperty',
    'entityTypeBundle',
  ]);

  // fetch associated properties an bundles
  const properties = await entityTypePropertyModel.search({
    entityTypeName,
    limit: null,
  });

  // this gets used a lot, so I think its a good idea
  // to just do it here
  const
  idProperties = properties.filter((prop) => prop.isIdKey),
  propsNoIds = properties.filter((prop) => !prop.isIdKey);

  const bundles = await entityTypeBundleModel.search({
    entityTypeName,
    limit: null,
  });

  return {
    ...result,
    properties,
    bundles,
    propsNoIds,
    idProperties,
  };

});

module.exports = () => ({});
