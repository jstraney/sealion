
const logger = require('../../lib/logger')('Test entityTypePropertyController');

const db = require('../../lib/db');

const
entityTypeController = require('../../controller/entityType'),
entityTypePropertyController = require('../../controller/entityTypeProperty');

const assert = require('assert');

module.exports = async () => {


  // we have to make at least one entity to test properties
  const testEntityTypeName = 'testEntityType';

  try {

    const testEntityType = await entityTypeController.create({
      name: testEntityTypeName,
      label: 'Test Entity Type Label',
      help: 'No one can help me.',
      canAuthenticate: true,
    });

    assert(testEntityType instanceof Object);
    assert(testEntityType.name === testEntityTypeName);

    const testProp1 = await entityTypePropertyController.create({
      entityTypeName: testEntityTypeName,
      propertyName: 'testProp1',
      label: 'Test Property 1',
      type: 'string',
      isIndexed: true,
      isRequired: true,
    });

    assert(testProp1 instanceof Object);
    assert(testProp1.propertyName === 'testProp1');
    assert(testProp1.label === 'Test Property 1');
    assert(testProp1.type === 'string');
    assert(testProp1.isIndexed === 1);
    assert(testProp1.isRequired === 1);

    const nextProp1 = await entityTypePropertyController.update({
      entityTypeName: testEntityTypeName,
      propertyName: 'testProp1',
      label: 'Test Property 1 Has Been Changed',
    });

    assert(nextProp1 instanceof Object);
    assert(nextProp1.label === 'Test Property 1 Has Been Changed');

    const propSearch = await entityTypePropertyController.search({
      entityTypeName: testEntityTypeName,
    });

    assert(propSearch.length === 2);

    const {numRows: numRowsDeletedProperties} = await entityTypePropertyController.del({
      entityTypeName: testEntityTypeName,
    });

    assert(numRowsDeletedProperties === 2);

    const { numRows: numRowsDeletedEntityTypes} = await entityTypeController.del({
      name: testEntityTypeName,
    });

    assert(numRowsDeletedEntityTypes === 1);

    logger.info('passed all entityTypePropertyController tests');

  } catch (error) {

    logger.error('Error running entityTypePropertyController tests: %o', error);

    await db.schema.dropTableIfExists(testEntityTypeName);
    await db('entityType').del().where({ name: testEntityTypeName });
    await db('entityTypeProperty').del().where({ entityTypeName: testEntityTypeName });
    await db('permission').del().where({ resourceName: testEntityTypeName });

  }

};
