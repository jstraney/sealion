const ResourceController = require('./ResourceController');

const {
  implementHook,
  implementReduce,
} = require('../lib/hook');

const {
  capitalCase,
} = require('../lib/util');

const db = require('../lib/db');

const logger = require('../lib/logger')('entityTypePropertyController');

const {
  knexTypeMap,
} = require('../lib/validate');

implementReduce('entityTypePropertyCreateTableArgs', async (rawArgs = {}) => {

  const {
    defaultValue = null,
    name,
    ...tableArgs
  } = rawArgs;

  return tableArgs;

});

implementHook('entityTypePropertyCreate', async ( rawArgs = {} ) => {

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

  logger.info(`altering ${entityTypeName} table to include property ${propertyName}`);

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

  logger.info(`altering ${entityTypeName} table to include property ${propertyName}`);

});

module.exports = new ResourceController('entityTypeProperty', {
  idKey: ['entityTypeName', 'propertyName'],
  propKeys: [
    'entityTypeName',
    'propertyName',
    'label',
    'type',
    'isRequired',
    'isIndexed',
    'isUnique',
    'created_at',
    'updated_at',
  ],
});
