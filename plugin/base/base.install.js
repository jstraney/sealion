const {
  implementHook,
} = require('../../lib/hook');

const dbLib = require('../../lib/db');

const installSeeds = require('./seed');

implementHook('baseInstall', async () => {

  const db = await dbLib.loadDB();

  // sealion does support serialized options to be stored
  // in the database.
  await db.schema.createTable('sealionPlugin', (table) => {
    table.string('name').primary();
    table.string('label');
    table.string('version');
    table.text('description');
    table.integer('weight').defaultTo(0);
    table.boolean('isInstalled').defaultTo(false);
    table.boolean('isEnabled').defaultTo(false);
    table.timestamps(true, true);
  });

  // sealion does support serialized options to be stored
  // in the database.
  await db.schema.createTable('sealionOption', (table) => {
    table.string('name').primary();
    table.string('label');
    // TODO: support encrypted options
    table.boolean('isSecret');
    table.text('json');
    table.timestamps(true, true);
  });

  // we simply have to bootstrap the system to allow entities
  // and entity types to drive the system.
  await db.schema.createTable('entityType', (table) => {
    table.string('name').primary();
    table.string('label');
    table.text('help');
    table.boolean('canAuthenticate').defaultTo(false);
    table.timestamps(true, true);
  });

  await db.schema.createTable('entityTypeProperty', (table) => {
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

  await db.schema.createTable('bundle', (table) => {
    table.string('name').primary();
    table.string('label');
    table.timestamps(true, true);
  });

  await db.schema.createTable('entityTypeBundle', (table) => {
    table.string('entityTypeName')
    table.string('bundleName');
    table.timestamps(true, true);
  });

  await db.schema.createTable('bundleField', (table) => {
    table.string('bundleName');
    table.string('fieldName');
    table.string('label');
    table.timestamps(true, true);
    table.primary(['bundleName', 'fieldName']);
  });

  await db.schema.createTable('field', (table) => {
    table.string('name').primary();
    table.string('label');
    table.string('type');
    table.boolean('isIndexed').defaultTo(false);
    table.boolean('isUnique').defaultTo(false);
    table.boolean('isRequired').defaultTo(false);
    table.integer('maxInstances').defaultTo(1);
    table.text('help');
    table.timestamps(true, true);
  });

  await db.schema.createTable('permission', (table) => {
    table.string('name').primary();
    table.string('label');
    table.string('resourceName');
    table.string('action');
    table.timestamps(true, true);
  });

  await db.schema.createTable('role', (table) => {
    table.string('name').primary();
    table.string('label');
    table.timestamps(true, true);
  });

  await db.schema.createTable('rolePermission', (table) => {
    table.string('roleName');
    table.string('permissionName');
    table.timestamps(true, true);
    table.primary(['roleName', 'permissionName']);
  });

  await db.schema.createTable('entityRole', (table) => {
    table.string('entityTypeName');
    table.integer('entityId');
    table.string('roleName');
    table.timestamps(true, true);
    table.primary(['entityTypeName', 'entityId', 'roleName']);
  });

  await installSeeds(db);

});

implementHook('baseUninstall', async () => {

  const db = await dbLib.loadDB();

  const tableDrops = [
    db.schema.dropTableIfExists('sealionOption'),
    db.schema.dropTableIfExists('sealionPlugin'),
    db.schema.dropTableIfExists('entityType'),
    db.schema.dropTableIfExists('entityType'),
    db.schema.dropTableIfExists('entityTypeProperty'),
    db.schema.dropTableIfExists('bundle'),
    db.schema.dropTableIfExists('field'),
    db.schema.dropTableIfExists('bundleField'),
    db.schema.dropTableIfExists('entityTypeBundle'),
    db.schema.dropTableIfExists('permission'),
    db.schema.dropTableIfExists('role'),
    db.schema.dropTableIfExists('permissionRole'),
    db.schema.dropTableIfExists('entityRole'),
  ];

  await Promise.all(tableDrops);

});
