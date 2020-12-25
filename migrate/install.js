const
bundleFieldController = require('../controller/bundleField'),
entityTypeController = require('../controller/entityType'),
entityTypePropertyController = require('../controller/entityTypeProperty');

exports.up = async (knex) => {

  await knex.schema.createTable('entityType', (table) => {
    table.string('name').primary();
    table.string('label');
    table.text('help');
    table.boolean('canAuthenticate').defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('entityTypeProperty', (table) => {
    table.string('entityTypeName');
    table.string('propertyName');
    table.text('help');
    table.string('label');
    table.string('type');
    table.boolean('isIdKey').defaultTo(false);
    table.boolean('isRequired').defaultTo(false);
    table.boolean('isIndexed').defaultTo(false);
    table.boolean('isUnique').defaultTo(false);
    table.timestamps(true, true);
    table.primary(['entityTypeName', 'propertyName']);
  });

};

exports.down = (knex) => {

  return knex.schema
    .dropTableIfExists('sealionSetting')
    .dropTableIfExists('entityType')
    .dropTableIfExists('entityTypeProperty')
    .dropTableIfExists('entityRole')
    .dropTableIfExists('role')
    .dropTableIfExists('permission')
    .dropTableIfExists('rolePermission')
    .dropTableIfExists('batch')
    .dropTableIfExists('entityTypeBundle')
    .dropTableIfExists('bundle')
    .dropTableIfExists('field')
    .dropTableIfExists('bundleField')
    .dropTableIfExists('tokenGrant')
    .dropTableIfExists('logEvent')

};
