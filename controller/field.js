const {
  knexTypeMap,
} = require('../lib/validate');

const {
  implementHook,
} = require('../lib/hook');

const {
  pascalCase,
  camelCase,
} = require('../lib/util');

const db = require('../lib/db');

const ResourceController = require('./ResourceController');

implementHook('fieldDeleteTableArgs', async ({ name }) => ({ name }));

implementHook('fieldCreate', async ( rawArgs = {}) => {

  const {
    name: fieldName,
    type,
    isIndexed = false,
    isUnique = false,
  } = rawArgs;

  const fieldTableName = camelCase('field'.concat(pascalCase(fieldName)));

  const exists = await db.schema.hasTable(fieldTableName);

  if (exists) {
    return;
  }

  const typeMap = await knexTypeMap();

  await db.schema.createTable(fieldTableName, (table) => {

    table.integer('entityId');
    table.string('entityTypeName');
    table.string('bundleName');
    table.integer('instance');

    const mappedType = typeMap.hasOwnProperty(type)
      ? typeMap[type]
      : type;

    // TODO somehow get args to pass to knex method
    const valueColumn = table[mappedType]('value');

    table.timestamps(true, true);

    const indices = [];

    // you can have something unique or indexed. unique takes priority.
    // we assume here the desired result is that the value is unique per
    // entity, so we add it here
    if (isUnique) {
      table.unique([
        'entityId', 'entityTypeName', 'bundleName', 'value'
      ], 'entityUniqueFieldIndex');
    } else if (isIndexed) {
      // simply index the value column for enhanced search time
      table.index('value', 'entityFieldValueIndex');
    }


    table.primary(['entityId', 'entityTypeName', 'bundleName', 'instance']);

  });

});

// to delete an INSTANCE of a field, it should be removed from
// bundleField, not field! this hook cleans up the field for good, droping
// the table and removing ALL references in bundleFieldTable
implementHook('fieldDelete', async (_, rawArgs = {}) => {

  const {
    name: fieldName,
  } = rawArgs;

  const fieldTableName = camelCase('field'.concat(pascalCase(fieldName)));

  await db.schema.dropTableIfExists(fieldTableName);

  // delete all records relating bundles to that field
  // TODO: determine benefit/harm of calling bundleFieldController.del
  await db('bundleField').del().where({fieldName});

})


module.exports = new ResourceController('field', {
  idKey: 'name',
  propKeys: [
    'name',
    'type',
    'isIndexed',
    'isUnique',
    'isRequired',
    'maxInstances',
    'help',
  ],
});
