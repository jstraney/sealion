const db = require('../lib/db');

const {
  camelCase,
  capitalCase,
} = require('../lib/util')

const {
  BadRequestError,
} = require('../lib/error');

const {
  implementHook,
  implementReduce,
  invokeHook,
} = require('../lib/hook');

const logger = require('../lib/logger')('entityTypeController');

const
ResourceController = require('./ResourceController'),
bundleController = require('./bundle'),
entityTypePropertyController = require('./entityTypeProperty'),
entityTypeBundleController = require('./entityTypeBundle'),
permissionController = require('./permission');

const entityTypeController = new ResourceController('entityType', {
  idKey: 'name',
  propKeys: [
    'name',
    'label',
    'canAuthenticate',
    'created_at',
    'updated_at',
  ],
});

// because ResourceControllers insert args into table columns,
// nested properties (like arrays) will throw an error.
// to that end, we implement a reducer for tableArgs.
// raw args get passed to other hooks (like entityTypeCreate)
// which could be used for more complex processing
implementReduce('entityTypeCreateTableArgs', async (rawArgs = {}) => {

  // properties, bundles, and fields are arrays. will throw a
  // 'column not found' error. We still need these values to create
  // relations in entityTypeProperty, entityTypeBundle and so on
  const {
    properties,
    bundles,
    ...tableArgs
  } = rawArgs;

  return tableArgs;

});

implementHook('entityTypeCreate', async (rawArgs) => {

  const {
    name: entityTypeName,
    label: entityTypeLabel,
    canAuthenticate = false,
    properties = [],
    bundles = [],
    actions = ['create', 'read', 'update', 'delete', 'search'],
  } = rawArgs;

  // create entity table
  await db.schema.createTable(entityTypeName, async (table) => {

    table.increments('id');

  });

  if (bundles.length) {
    await entityTypePropertyController.create({
      entityTypeName,
      propertyName: 'bundleName',
      label: 'Bundle Name',
      type: 'string',
    });
  }

  // most common example is users who both authorize
  // themselves and other apps to their own resources
  if (canAuthenticate) {
    await entityTypePropertyController.create({
      entityTypeName,
      propertyName: 'secret',
      label: 'Password',
      type: 'secret',
      isRequired: true,
    });
  }

  const entityTypeProperties = properties.map((config = {}) => {

      // rename name to propertyName for entityTypeProperty table
      const {
        name: propertyName,
        ...nextConfig
      } = config;

      return {
        entityTypeName,
        propertyName,
        ...nextConfig
      };

  }).map(entityTypePropertyController.create);

  await Promise.all(entityTypeProperties).catch((error) => {

    logger.error('error creating entityType properties: %o', error);

    // remove entityType
    entityTypeController.del({name: entityTypeName});

    // still throw error
    throw error;

  });

  const bundleInserts = [];

  // now create necessary bundles
  for (let i = 0; i < bundles.length; i++) {

    const bundleName = bundles[i];

    // TODO: offset a lot of this into bundleController, catch a
    // 409 Conflict Error if bundle exists.
    const bundleLabel = capitalCase(bundleName);

    const existingBundles = await bundleController.read({name: bundleName})

    // create bundle if it does not exist
    if (!existingBundles) {
      await bundleController.create({
        name: bundleName,
        label: bundleLabel,
      });
    }

    bundleInserts.push(entityTypeBundleController.create({
      entityTypeName,
      bundleName,
    }));

  };

  await Promise.all(bundleInserts);

  // create default permissions for entityType
  const scopes = ['any', 'own'];

  const permissionInserts = [];

  for (let action of actions) {
    for (let scope of scopes) {
      const
      label = capitalCase(`${action} ${scope} ${entityTypeName}`),
      name = camelCase(label);
      permissionInserts.push(permissionController.create({
        name,
        label,
        resourceName: entityTypeName,
      }));
    }
  }

  await Promise.all(permissionInserts).catch((error) => {

    logger.error(`error creating CRUDS permission for %s: %o`, entityTypeName, error);

    db('permission').del().where({resourceName: entityTypeName});

  });

});

implementHook('entityTypeDelete', async (numDeleted, rawArgs) => {

  if (!numDeleted) return;

  const {
    name: entityTypeName,
  } = rawArgs;

  await db.schema.dropTable(entityTypeName);

  const deletions = [];

  deletions.push(entityTypePropertyController.del({
    entityTypeName,
  }));

  // delete all permissions associated with entityType
  // TODO: consider if resource name should affix 'Entity'
  // suffix (so, 'userEntity' and not 'user'). leaning towards no
  deletions.push(permissionController.del({
    resourceName: entityTypeName,
  }));


  deletions.push(entityTypeBundleController.del({
    entityTypeName,
  }));

  // bundles are responsible for grouping fields, so we
  // leave bundles alone even if there are no more entityTypes
  // using the bundles

  await Promise.all(deletions);

});

implementReduce('entityTypeReadResult', async ( entityType = {} ) => {

  const {
    name: entityTypeName,
  } = entityType;

  const properties = await entityTypePropertyController.search({
    entityTypeName,
    limit: null,
  });

  const bundles = await entityTypeBundleController.search({
    entityTypeName,
    limit: null,
  });

  return {
    ...entityType,
    properties,
    bundles,
  };

})

module.exports = entityTypeController;
