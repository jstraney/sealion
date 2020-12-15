
const entityTypeController = require('../../controller/entityType');

const db = require('../../lib/db');

const assert = require('assert');

const logger = require('../../lib/logger')('Test entityTypeController');

module.exports = async () => {

  const testName = 'testEntityType';

  try {

    const createResponse = await entityTypeController.create({
      name: testName,
      label: 'Test',
      canAuthenticate:false,
    });

    assert(createResponse.name === testName);

    const readResponse = await entityTypeController.read({
      name: testName,
    });

    assert(readResponse.name === testName);

    const updResponse = await entityTypeController.update({
      name: testName,
      label: 'Test CHANGED',
    });

    assert(updResponse.label === 'Test CHANGED');

    const searchResponse = await entityTypeController.search({
      name: testName,
    });

    assert(searchResponse.length);

    const delResponse = await entityTypeController.del({
      name: testName,
    });

    assert(delResponse.numRows > 0);

    logger.info('passed all entityType controller tests');

  } catch (error) {

    console.error(error);

    await db.raw(`DELETE FROM entityType WHERE name = '${testName}'`);
    await db.raw(`DELETE FROM entityTypeProperty WHERE entityTypeName = '${testName}'`);
    await db.raw(`DROP TABLE ${testName}`);

  }

}
