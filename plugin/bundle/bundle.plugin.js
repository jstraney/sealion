const {
  BadRequestError,
} = require('@owo/lib/error');

const {
  knexTypeMap,
  validate,
} = require('@owo/lib/validate');

const {
  implementHook,
} = require('@owo/lib/hook');

const {
  pascalCase,
  camelCase,
  capitalCase,
} = require('@owo/lib/string');

const {
  getEntityModel,
  getEntityModels,
} = require('@owo/plugin/entity/entity.plugin')();

const dbLib = require('@owo/lib/db');

// this will invalidate a payload when an entity is being
// created with a bundleName that is not implementable by its entityType
// (indicated by the existing relation of entityTypeBundle)
const invalidateUnknownEntityBundle = async (_, entityProperties = {}, entityTypeInfo = {}) => {

  const {
    bundles: authorizedBundles = [],
  } = entityTypeInfo;

  const {
    bundleName: entityBundleName = null,
  } = entityProperties;

  const { name: entityTypeName } = entityTypeInfo;

  // there are core entityTypes with a property of bundleName
  // which is not used in the same way
  if (entityTypeName === 'entityTypeBundle' || entityTypeName === 'bundleField') {
    return;
  }

  // filter authorized bundles down to a match
  const [ entityBundle ] = authorizedBundles
    .filter((bundle) => bundle.bundleName === entityBundleName);

  if (entityBundleName && !entityBundle) {
    throw new BadRequestError(`${entityBundleName} is not an authorized bundle for ${entityTypeName}`);
  }

};

const invalidateFields = async (rawArgs = {}, tableArgs = {}, entityTypeInfo = {}) => {

  const db = await dbLib.loadDB();

  const {
    name: entityTypeName,
    bundles: authorizedBundles,
  } = entityTypeInfo;

  const {
    fields: entityFields = {},
  } = rawArgs;

  const {
    bundleName: entityBundleName,
  } = tableArgs;

  // these tables have a bundleName property that is not used for bundling fields.
  if (entityTypeName === 'bundleField' || entityTypeName === 'entityTypeBundle') {
    return;
  }

  // no bundle no fields
  if (!entityBundleName && !Object.keys(entityFields).length) {
    return;
  }

  // throw error if no bundleName was provided, but fields were
  if (!entityBundleName && Object.keys(entityFields).length) {
    throw new BadRequestError(`no bundleName provided but fields were provided`);
  }

  const bundleFields = await db.select([
      'bf.bundleName AS bundleName',
      'bf.fieldName AS fieldName',
      'f.isRequired',
      'f.type',
      'f.maxInstances',
    ])
    .from({bf: 'bundleField'})
    .innerJoin({f: 'field'}, 'bf.fieldName', '=', 'f.name')
    .where({
      'bf.bundleName': entityBundleName,
    });

  const authorizedFieldNames = {};

  // do similar treatment for fields. Here, however, each field
  // has values in an array because entities to fields are one to many.
  for (let fieldAttributes of bundleFields) {

    const {
      fieldName,
      label,
      type,
      isRequired = false,
      maxInstances = 1,
    } = fieldAttributes;

    authorizedFieldNames[fieldName] = fieldAttributes;

    if (isRequired && !getIfSet(entityFields, fieldName, []).length) {
      throw new BadRequestError(`field ${fieldName} is required`);
    } else {
      continue;
    }

  }

  for (fieldName in entityFields) {

    // field values are always delievered in an array, and the
    // indicies indicate the field instance identifier
    const fieldValues = entityFields[fieldName];

    if (!Array.isArray(fieldValues)) {
      throw new BadRequestError(`${fieldName} are not in an array`);
    }

    if (fieldValues.length > maxInstances) {
      throw new BadRequestError(`${label} allows a max of ${maxInstances} values`);
    }

    // run validation on the field type
    for (fieldValue of fieldValues) {
      validate(fieldName, fieldValue, type);
    }

  }

};

implementHook('entityInvalidateCreate', [
  invalidateUnknownEntityBundle,
  invalidateFields
]);

implementHook('entityInvalidateUpdate', [
  invalidateUnknownEntityBundle,
  invalidateFields
]);

// TODO: depending on how EntityModel search action fleshes out, we may
// invalidate fields (for example when field query is supported)

implementHook('fieldEntityRemoveTableArgs', async (nextArgs = {}, rawArgs = {}) => {

  const {
    name
  } = rawArgs;

  return {
    ...nextArgs,
    name,
  }

});


implementHook('fieldEntityCreate', async ( rawArgs = {}) => {

  const db = await dbLib.loadDB();

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
implementHook('fieldEntityRemove', async (rawArgs = {}, _, numRows) => {

  if (numRows < 1) {
    return;
  }

  const {
    name: fieldName,
  } = rawArgs;

  const fieldTableName = camelCase('field'.concat(pascalCase(fieldName)));

  const db = await dbLib.loadDB();

  await db.schema.dropTableIfExists(fieldTableName);

  // delete all records relating bundles to that field
  // TODO: determine benefit/harm of calling bundleFieldModel.remove
  await db('bundleField').del().where({fieldName});

});

// create an entity types bundles
implementHook('entityTypeEntityCreate', async (rawArgs = {}) => {

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
    bundles = [],
  } = rawArgs;

  // TODO: Put into a reducer for extended args
  if (bundles.length) {
    await entityTypePropertyModel.create({
      entityTypeName,
      propertyName: 'bundleName',
      label: 'Bundle Name',
      type: 'string',
    });
  }

  const bundleInserts = [];

  // now create necessary bundles
  for (let i = 0; i < bundles.length; i++) {

    const bundleName = bundles[i];

    // TODO: offset a lot of this into bundleModel, catch a
    // 409 Conflict Error if bundle exists.
    const bundleLabel = capitalCase(bundleName);

    const existingBundles = await bundleModel.read({name: bundleName})

    // create bundle if it does not exist
    if (!existingBundles) {
      await bundleModel.create({
        name: bundleName,
        label: bundleLabel,
      });
    }

    bundleInserts.push(entityTypeBundleModel.create({
      entityTypeName,
      bundleName,
    }));

  };

  await Promise.all(bundleInserts);

});

// removes an entity type's bundles
implementHook('entityTypeEntityRemove', async (rawArgs = {}, _, numRemoved = 0 ) => {

  if (numRemoved < 1) {
    return;
  }

  const entityTypeBundleModel = await getEntityModel('entityTypeBundle')

  const {
    name: entityTypeName,
  } = rawArgs;

  await entityTypeBundleModel.remove({
    entityTypeName,
  });

});

module.exports = () => ({});
