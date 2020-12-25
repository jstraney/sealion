const {
  BadRequestError
} = require('@owo/lib/error');

const {
  test,
} = require('@owo/lib/test');

module.exports = test('@owo/plugin/entityType', async (owo, args, ensure, logger) => {

  const {
    plugin : { entity: { getEntityModels, getEntityModel } },
    lib: { dbLib },
  } = owo;

  const testName = 'testType';

  try {

    const db = await dbLib.loadDB();

    const {
      entityTypeModel,
      entityTypePropertyModel,
      permissionModel,
    } = await getEntityModels([
      'entityType',
      'entityTypeProperty',
      'permission',
    ]);

    const result = await entityTypeModel.create({
      name: testName,
      label: 'Test Type',
      properties: [
        { name: 'test1', label: 'Test 1', type: 'string'},
        { name: 'test2', label: 'Test 2', type: 'integer', isRequired: true},
      ],
    });

    await ensure('entityType record inserted', result.name === testName);

    const permissions = await permissionModel.search({ resourceName: testName, limit: null });

    await ensure('CRUDS permissions were made', permissions.length === 10);

    const tableExists = await db.schema.hasTable(testName);

    await ensure('table was created', tableExists === true);

    const properties = await entityTypePropertyModel.search({entityTypeName: testName});

    await ensure('entityTypeProperties were inserted', properties.length === 3);

    const { testTypeModel } = await getEntityModels(['testType']);

    const testRecord = await testTypeModel.create({
      test1: 'test test test',
      test2: 5
    });

    await ensure('test record for new entityType created', testRecord.test2 === 5);

    // property "test2" is required
    try {
      const testRecord = await testTypeModel.create({
        test1: 'test test test',
      });
    } catch (error) {
      await ensure('missing required property throws BadRequestError', error instanceof BadRequestError);
    }

    const { numRows: numTestTypesRemoved } = await testTypeModel.remove({
      test1: 'test test test',
    });

    await ensure('testType record removed', numTestTypesRemoved === 1);

    const insertValues = Array.from(Array(50), (_, i) => {
      return { test1: ''+i, test2: i};
    });

    const inserts = [];

    for (values of insertValues) {

      inserts.push(testTypeModel.create(values));

    }

    await Promise.all(inserts);

    const searchResults = await testTypeModel.search({});
    await ensure('search actions returns 10 records by default', searchResults.length === 10);

    const searchResults2 = await testTypeModel.search({limit: null});
    await ensure('search actions returns all when limit === null', searchResults2.length === 50);

    const {numRows} = await entityTypeModel.remove({
      name: testName,
    });

    await ensure('entityType was removed', numRows === 1);

    const tableGone = !(await db.schema.hasTable(testName))

    await ensure('table was removed', tableGone === true);

  } catch (error) {

    await db.schema.dropTableIfExists(testName);
    await db('entityType').del().where({name: testName});
    await db('entityTypeProperty').del().where({entityTypeName: testName});
    await db('permission').del().where({resourceName: testName});

    throw error;

  }

});
