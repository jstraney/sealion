const {
  implementHook,
  implementReduce,
} = require('@owo/lib/hook');

const {
  capitalCase,
} = require('@owo/lib/string');

const dbLib = require('@owo/lib/db');

const logger = require('@owo/lib/logger')('owo://plugin/entityTypeProperty/entityTypeProperty.plugin');

const {
  BadRequestError,
} = require('@owo/lib/error');

const {
  knexTypeMap,
  validate,
} = require('@owo/lib/validate');

// when unknown table properties are passed to an EntityModel, we
// invalidate any unrecognized properties in the query, otherwise we would
// get an SQL unknown column error rather than a clean error
const invalidateUnknownProperties = (rawArgs = {}, tableArgs = {}, entityTypeInfo = {}) => {

  const {
    properties: authorizedProperties = [],
  } = entityTypeInfo;

  const authorizedPropNames = {};

  for (let propertyAttributes of authorizedProperties) {

    const { propertyName } = propertyAttributes;

    authorizedPropNames[propertyName] = propertyAttributes;

  }

  for (let propertyName in tableArgs) {

    if (!authorizedPropNames.hasOwnProperty(propertyName)) {
      throw new BadRequestError(`unrecognized entity property ${propertyName}`);
    }

  }

};

// invalidates missing properties (marked isRequired) but only for certain actions
// (create and update). this should be used only when values are going into the
// table (performing search action should validate required properties)
const invalidateMissingProperties = (rawArgs = {}, tableArgs = {}, entityTypeInfo = {}) => {

  const {
    properties: authorizedProperties = [],
  } = entityTypeInfo;

  const entityProperties = tableArgs;

  const authorizedPropNames = {};

  for (let propertyAttributes of authorizedProperties) {

    const {
      propertyName,
      type,
      isRequired = false,
    } = propertyAttributes;

    authorizedPropNames[propertyName] = propertyAttributes;

    // TODO: see if an 'action' can be passed to this hook, we may
    // want to require auto ids for update/delete, just not create
    // everything else in this hook applies to all 3
    if (type === 'increments') {
      continue;
    }

    if (isRequired && !entityProperties.hasOwnProperty(propertyName)) {
      throw new BadRequestError(`${propertyName} is required`);
    }

  }

  for (let propertyName in entityProperties) {

    const propertyAttributes = authorizedPropNames[propertyName];

    const {
      isRequired = false,
      type,
    } = propertyAttributes;

    // put name in lookup table for fast lookup later
    authorizedPropNames[propertyName] = true;

    const value = entityProperties[propertyName];
    validate(propertyName, value, type);

  }

};

implementHook('entityInvalidateCreate', [
  invalidateUnknownProperties,
  invalidateMissingProperties,
]);
implementHook('entityInvalidateRead', invalidateUnknownProperties);
implementHook('entityInvalidateUpdate', [
  invalidateUnknownProperties,
  invalidateMissingProperties
]);
implementHook('entityInvalidateRemove', invalidateUnknownProperties);
implementHook('entityInvalidateSearch', invalidateUnknownProperties);

implementReduce('entityTypePropertyEntityCreateTableArgs', async (nextArgs = {}, rawArgs = {}) => {

  // because the default value can be any type, it does not go into the
  // entityTypeProperty table directly. instead, it is handed back off
  // to hook entityTypePropertyEntityCreate and is used in the
  // alter table statement
  const {
    defaultValue = null,
    name,
    ...tableArgs
  } = rawArgs;

  return {
    ...nextArgs,
    ...tableArgs
  };

});

// alters entity table to include new property column
implementHook('entityTypePropertyEntityCreate', async ( rawArgs = {} ) => {

  const db = await dbLib.loadDB();

  const {
    entityTypeName,
    propertyName,
    label = capitalCase(propertyName),
    type,
    isRequired = false,
    isUnique = false,
    isIndexed = false,
    defaultValue = null,
  } = rawArgs;

  logger.debug(`altering ${entityTypeName} table to include property ${propertyName}`);

  // extra types that just map to primitive types.
  const typeMap = await knexTypeMap();

  // modify the entity table to include the column for the
  // entity property.
  await db.schema.table(entityTypeName, (table) => {

    const mappedType = typeMap.hasOwnProperty(type)
      ? typeMap[type]
      : type;

    const column = table[mappedType](propertyName);

    if (defaultValue) {
      column.defaultTo(defaultValue);
    }

    if (isRequired) {
      column.notNullable();
    } else {
      column.nullable();
    }

    // adding unique will add an index. just do unique
    // if passed, else if indexed, else no index
    if (isUnique) {
      column.unique();
    } else if (isIndexed) {
      table.index(propertyName);
    }

  }).catch((error) => {

    logger.error(`Error adding %s property to %s table: %o`, propertyName, entityTypeName, error);

    db('entityTypeProperty').del().where({
      propertyName,
      entityTypeName,
    });

  });

});

module.exports = () => ({});
