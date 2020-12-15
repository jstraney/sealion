const
bundleFieldController = require('../controller/bundleField'),
entityTypeController = require('../controller/entityType'),
entityPropertyController = require('../controller/entityProperty');

exports.up = async (knex) => {

  return knex.schema
    .createTable('entityType', (table) => {
      table.string('name').primary();
      table.string('label');
      table.boolean('canAuthorize').defaultTo(false);
      table.boolean('canBeAuthorized').defaultTo(false);
      table.boolean('isFieldable').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('entityTypeProperty', (table) => {
      table.string('entityTypeName');
      table.string('propertyName');
      table.string('label');
      table.string('type');
      table.boolean('required').defaultTo(false);
      table.timestamps(true, true);
      table.primary(['entityTypeName', 'propertyName']);
    })
    .createTable('bundle', (table) => {
      table.string('name').primary();
      table.string('label');
      table.timestamps(true, true);
    })
    .createTable('entityTypeBundle', (table) => {
      table.string('entityTypeName');
      table.string('bundleName');
      table.timestamps(true, true);
      table.primary(['entityTypeName', 'bundleName']);
    })
    .createTable('bundleField', (table) => {
      table.string('bundleName');
      table.string('fieldName');
      table.string('label');
      table.string('type');
      table.boolean('required').defaultTo(false);
      table.integer('limit').defaultsTo(null);
      table.timestamps(true, true);
      table.primary(['bundleName', 'fieldName']);
    })
    .createTable('entityRole', (table) => {
      table.integer('entityId');
      table.string('entityTypeName');
      table.string('roleName');
      table.timestamps(true, true);
      table.primary(['entityId', 'entityTypeName', 'roleName']);
    })
    .createTable('role', (table) => {
      table.string('name').primary();
      table.string('label');
      table.timestamps(true, true);
    })
    .createTable('permission', (table) => {
      table.string('name').primary();
      table.string('label');
      table.timestamps(true, true);
    })
    .createTable('rolePermission', (table) => {
      table.string('roleName');
      table.string('permissionName');
      table.timestamps(true, true);
      table.primary(['roleName', 'permissionName']);
    // TODO: plans to implement true database logging and
    // and true batch support. currently unsupported!
    })
    .createTable('logEvent', (table) => {
      table.increments('id');
      table.string('event');
      table.text('description');
      table.timestamps(true, true);
    })
    .createTable('batch', (table) => {
      table.increments('id');
      table.string('batchName');
      table.string('status').defaultsTo('done');
      table.decimal('finished');
      table.timestamps(true, true);
    });


    // a person is a person is a person. synonymous with User
    // but makes more sense. it is highly recommended to use a profile
    // for fields instead of a person.
    entityTypeController.create({
      name: 'person',
      label: 'Person',
      canAuthorize: true,
      canBeAuthorized: true,
      properties: [
        { name: 'username', type: 'string', required: true },
      ]
    });


    entityTypeController.create({
      name: 'profile',
      label: 'Profile',
      isFieldable: true,
      // profiles are not authorized to do anything, the people who
      // own them are
      properties: [
        { name: 'personId', type: 'entityReference', required: true },
      ],
      bundles: [
        { name: 'main' },
      ],
    });

};

exports.down = (knex) => {

  return knex.schema
    .dropTable('entityType')
    .dropTable('entityProperty')
    .dropTable('entityRole')
    .dropTable('role')
    .dropTable('permission')
    .dropTable('rolePermission')
    .dropTable('batch')
    .dropTable('entityTypeBundle')
    .dropTable('bundle')
    .dropTable('bundleField')
    .dropTable('logEvent')

};
