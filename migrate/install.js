const
bundleFieldController = require('../controller/bundleField'),
entityTypeController = require('../controller/entityType'),
entityTypePropertyController = require('../controller/entityTypeProperty');

exports.up = async (knex) => {

  return knex.schema
    .createTable('sealionSetting', (table) => {
      table.string('name');
      table.string('type');
      table.string('label');
      table.text('json');
      table.primary(['name', 'type'])
      table.timestamps(true, true);
    })
    .createTable('entityType', (table) => {
      table.string('name').primary();
      table.string('label');
      table.text('help');
      table.boolean('canAuthenticate').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('entityTypeProperty', (table) => {
      table.string('entityTypeName');
      table.string('propertyName');
      table.text('help');
      table.string('label');
      table.string('type');
      table.boolean('isRequired').defaultTo(false);
      table.boolean('isIndexed').defaultTo(false);
      table.boolean('isUnique').defaultTo(false);
      table.timestamps(true, true);
      table.primary(['entityTypeName', 'propertyName']);
    })
    .createTable('bundle', (table) => {
      table.string('name').primary();
      table.string('label');
      table.text('help');
      table.timestamps(true, true);
    })
    .createTable('entityTypeBundle', (table) => {
      table.string('entityTypeName');
      table.string('bundleName');
      table.timestamps(true, true);
      table.primary(['entityTypeName', 'bundleName']);
    })
    .createTable('field', (table) => {
      table.string('name').primary();
      table.string('type');
      table.boolean('isIndexed').defaultTo(false);
      table.boolean('isUnique').defaultTo(false);
      table.boolean('isRequired').defaultTo(false);
      table.integer('maxInstances').defaultsTo(null);
      table.text('help');
      table.timestamps(true, true);
    })
    .createTable('bundleField', (table) => {
      table.string('bundleName');
      table.string('fieldName');
      table.string('label');
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
      table.text('help');
      table.timestamps(true, true);
    })
    .createTable('permission', (table) => {
      table.string('name').primary();
      table.string('label');
      table.string('resourceName');
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
    })
    // one table includes tokens and grant types
    .createTable('tokenGrant', (table) => {
      table.string('token').primary();
      // future support for oauth2 flows
      table.string('scopes');
      table.string('clientId');
      table.string('grantType');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.integer('expires_in').defaultTo(3600);
    });

    // now controllers are used to create default entities
    // on a full install. basic will skip

    // a person is a person is a person. synonymous with User
    // but makes more sense. it is highly recommended to use a profile
    // for fields instead of a person.
    entityTypeController.create({
      name: 'person',
      label: 'Person',
      help: [
        'A person is a person is a person. Any customer, staff, or human',
        'agent of any kind is a person. Different people do, however',
        'have different roles, and profile types',
      ].join(' '),
      canAuthorize: true,
      canBeAuthorized: true,
      properties: [
        { name: 'username', type: 'string', required: true },
        { name: 'status', type: 'boolean', required: true },
      ]
    });

    entityTypeController.create({
      name: 'profile',
      label: 'Profile',
      help: [
        'A personProfile contains fieldable information relating to a person.',
        'A different profile entityType could be made for business profiles',
      ].join(' '),
      isFieldable: true,
      // profiles are not authorized to do anything, the people who
      // own them are
      properties: [
        { name: 'personId', type: 'entityReference', required: true },
        { name: 'status', type: 'boolean', required: true },
      ],
      bundles: [
        {
          name: 'personalInformation',
          help: 'A collection of personal information fields',
        },
      ],
    });

    entityTypeController.create({
      name: 'client',
      label: 'Client Application',
      help: [
        'A client is an application such as a website, webapplication, mobile app',
        'and more. These are usually attached to a person who owns and maintains',
        'the client application.',
      ].join(' '),
      canAuthenticate: true,
      canBeAuthenticated: true,
      properties: [
        { name: 'personId', type: 'entityReference', required: true },
        { name: 'public', type: 'boolean', required: true },
        { name: 'status', type: 'boolean', required: true },
      ],
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
