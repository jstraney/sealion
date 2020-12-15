const bundleController = require('../../controller/bundle');

const db = require('../../lib/db');
const logger = require('../../lib/logger')('Test bundleController');

const assert = require('assert');

module.exports = async () => {

  const testBundleName = 'test1';

  try {

    const createdBundle = await bundleController.create({
      name: testBundleName,
      label: 'Test Bundle'
    });

    assert(createdBundle.label === 'Test Bundle');

    const readBundle = await bundleController.read({
      name: testBundleName,
    });

    assert(readBundle.name === testBundleName);

    const updatedBundle = await bundleController.update({
      name: testBundleName,
      help: 'Adding help now'
    });

    assert(updatedBundle.help === 'Adding help now');

    const searchedBundles = await bundleController.search({
      name: testBundleName,
    });

    assert(searchedBundles.length === 1);

    const {numRows: numDeletedBundles } = await bundleController.del({
      name: testBundleName,
    });

    assert(numDeletedBundles === 1);

    logger.info('completed tests for bundleController');

  } catch (error) {

    logger.error('Error Running bundleController Unit Tests: %o', error);

  }

};
