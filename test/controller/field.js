const fieldController = require('../../controller/field');

const db = require('../../lib/db');
const logger = require('../../lib/logger')('Test fieldController');

const {
  capitalCase,
} = require('../../lib/util');

const assert = require('assert');

module.exports = async () => {

  const
  testFieldName1 = 'test1',
  testFieldName2 = 'test2';

  try {

    const createdField = await fieldController.create({
      name: testFieldName1,
      isRequired: true,
      type : 'integer',
      maxInstances: 10,
    });

    assert(createdField.isRequired === 1);
    assert(createdField.maxInstances === 10);

    const tableExists = await db.schema.hasTable(`field${capitalCase(testFieldName1)}`);
    assert(tableExists);

    const readField = await fieldController.read({
      name: testFieldName1,
    });

    assert(readField.name === testFieldName1);

    const updatedField = await fieldController.update({
      name: testFieldName1,
      help: 'Adding help now'
    });

    assert(updatedField.help === 'Adding help now');

    const searchedFields = await fieldController.search({
      name: testFieldName1,
    });

    assert(searchedFields.length === 1);

    const {numRows: numDeletedFields } = await fieldController.del({
      name: testFieldName1,
    });

    assert(numDeletedFields === 1);

    // clean up. ordinarily deleting a field record will not drop
    // the database table.
    await db.schema.dropTableIfExists(`field${capitalCase(testFieldName1)}`);

    logger.info('completed tests for field controller');

  } catch (error) {

    logger.error('Error Running Field Controller Unit Tests: %o', error);

    db('field').del().where({ name: testFieldName1 });
    db.schema.dropTableIfExists(`field${capitalCase(testFieldName1)}`);

  }

};
