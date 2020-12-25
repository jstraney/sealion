const {
  test,
} = require('@owo/lib/test');

module.exports = test('@owo/plugin/bundle', async (owo, args, ensure, logger) => {

  const {
    plugin: { entity: { getEntityModels } },
    lib: { dbLib },
  } = owo;

  const db = await dbLib.loadDB();

  const {
    entityTypeModel,
    fieldModel,
    bundleFieldModel,
    bundleModel,
  } = await getEntityModels([
    'entityType',
    'field',
    'bundleField',
    'bundle',
  ]);

  const testName = 'fieldableTestType';

  const testBundleName = 'testBundle';

  try {

    // first define the entity type as a fieldable entity
    await entityTypeModel.create({
      name: testName,
      label: 'Test Type',
      help: 'Testing. Do not be afraid.',
      properties: [
        { name: 'foo', label: 'Foo', type: 'integer', help: 'its foo' },
      ],
      // here! this creates a new bundle if it does not exist and will
      // create a relation between the entityType and bundle in entityTypeBundle
      bundles: [testBundleName],
    });

    // we need to defin a field. Fields can be re-used by multiple bundles which
    // is why the field is created separately
    await fieldModel.create({
      name: 'test1',
      label: 'Test1',
      type: 'string',
    });

    const field1TableName = 'fieldTest1';

    const test1TableExists = await db.schema.hasTable(field1TableName);

    await ensure('field table created', test1TableExists);

    const test1Info = await db(field1TableName).columnInfo();

    logger.info('%o', test1Info);

    // separate field to test isUnique property
    await fieldModel.create({
      name: 'test2',
      label: 'Test2',
      type: 'integer',
      isUnique: true,
    });

    const field2TableName = 'fieldTest2';

    const test2TableExists = await db.schema.hasTable(field2TableName);

    await ensure('field table created', test2TableExists);

    await bundleFieldModel.create({
      bundleName: testBundleName,
      fieldName: 'test1',
      label: 'Test Bundle Test 1',
    });

    await bundleFieldModel.create({
      bundleName: testBundleName,
      fieldName: 'test2',
      label: 'Test Bundle Test 2',
    });

    const newRecord = await bundleModel.create({
      name: 'foo',
      label: 'Foo',
    });

    await ensure('Bundle record created', newRecord.name === 'foo');

    const result = await bundleModel.read({
      name: 'foo',
    });

    await ensure('Bundle record read from database', result.name === 'foo');

    const updatedRow = await bundleModel.update({
      name: 'foo',
      label: 'Woohoo!',
    });

    await ensure('Bundle record changed', updatedRow.label === 'Woohoo!');

    const { numRows } = await bundleModel.remove({
      name: 'foo',
    });

    await ensure('Bundle record removed', numRows === 1);

    await entityTypeModel.remove({
      name: testName,
    });

    await fieldModel.remove({
      name: 'test1',
    });

    await fieldModel.remove({
      name: 'test2',
    });

    await bundleFieldModel.remove({
      bundleName: testBundleName,
    });

  } catch (error) {

    // do a full clean
    logger.error('%o', error)

    await db.schema.dropTableIfExists(testName);
    await db.schema.dropTableIfExists('fieldTest1');
    await db.schema.dropTableIfExists('fieldTest2');

    await db('entityType').del().where({name: testName});
    await db('entityTypeProperty').del().where({entityTypeName: testName});
    await db('entityTypeBundle').del().where({entityTypeName: testName});
    await db('bundle').del().where({name: testBundleName });
    await db('bundle').del().where({name: 'foo'});
    await db('bundleField').del().where({bundleName: testBundleName });
    await db('permission').del().where({resourceName: testName});
    await db('field').del().where({name: 'test1'});
    await db('field').del().where({name: 'test2'});

    throw error;

  }

});
