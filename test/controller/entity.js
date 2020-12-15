const assert = require('assert');

const {
  BadRequestError,
} = require('../../lib/error')

const {
  pascalCase,
} = require('../../lib/util');

const
entityTypeController = require('../../controller/entityType'),
bundleController = require('../../controller/bundle'),
fieldController = require('../../controller/field'),
bundleFieldController = require('../../controller/bundleField');

const EntityController = require('../../controller/entity');

const db = require('../../lib/db');

const logger = require('../../lib/logger')('Test Entity Controller');

module.exports = async () => {

  const
  entityTypeName = 'testType',
  bundleName = 'testBundle';

  const fields = [
    { name: 'testBlurb', type: 'string', maxInstances: 20, isRequired: true},
    { name: 'testNickname', type: 'string', maxInstances: 1, help: 'what should I call you?', isUnique: true},
    { name: 'testHasHonda', type: 'boolean', help: 'do you drive a honda?' },
  ];

  try {

    const entityType = await entityTypeController.create({
      name: entityTypeName,
      label: 'Test Type',
      canAuthenticate: true,
      bundles: [
        bundleName,
      ],
      properties: [
        {name: 'username', type: 'string', isRequired: true },
        {name: 'hasUnicorn', type: 'boolean'},
      ],
    });

    assert(entityType.name === entityTypeName);

    const testEntityController = new EntityController(entityTypeName, entityType);

    const createdFields = fields.map(fieldController.create);

    const newFields = await Promise.all(createdFields);

    const bundleFields = [
      {
        bundleName,
        fieldName: 'testBlurb',
      },
      {
        bundleName,
        fieldName: 'testNickname',
      },
      {
        bundleName,
        fieldName: 'testHasHonda',
      },
    ];

    const createdBundleFields = bundleFields.map(bundleFieldController.create);

    await Promise.all(createdBundleFields);

    try {

      // username, a required property is missing!
      await testEntityController.create({
        bundleName,
        // secret is required for entities that canAuthenticate
        secret: 'secret password',
        hasUnicorn: false,
      });

      // this should not run.
      assert(false);

    } catch (error) {

      if (!(error instanceof BadRequestError)) {
        logger.error('%o', error);
      } else {
        logger.info('expected error thrown? %s', error.message);
      }

      assert(error instanceof BadRequestError);
      assert(error.message === 'username is required');

    }

    try {

      // foo not a bundlename!
      await testEntityController.create({
        bundleName: 'foo',
        hasUnicorn: false,
      });

      assert(false);

    } catch (error) {

      if (!(error instanceof BadRequestError)) {
        logger.error('%o', error);
      } else {
        logger.info('expected error thrown? %s', error.message);
      }

      assert(error instanceof BadRequestError);

    }

    const entity = await testEntityController.create({
      bundleName: 'testBundle',
      username: 'jstraney',
      hasUnicorn: true,
      secret: '1234',
    });

    const sndEntity = await testEntityController.create({
      bundleName: 'testBundle',
      username: 'basil',
      hasUnicorn: false,
      secret: '4321',
    });

    logger.info('FRUIT OF MY LABOR? %o', entity);
    logger.info('WHUT? %o', sndEntity);

    logger.info('completed all tests for entityController');
    logger.info('cleaning up tests');

    await entityTypeController.del({
      name: entityTypeName,
    });

    await bundleController.del({
      name: bundleName,
    });

    const fieldDeletes = fields.map(({name}) => fieldController.del({name}));

    await Promise.all(fieldDeletes);


  } catch (error) {

    logger.error('error occurred during entityController tests: %o', error);

    await Promise.all(fields.map(({ name }) => db('field').del().where({name})));

    await db('bundleField').del().where({bundleName});
    await db('bundle').del().where({name: bundleName});
    await db('entityTypeProperty').del().where({entityTypeName});
    await db('entityTypeBundle').del().where({entityTypeName, bundleName});
    await db('entityType').del().where({name: entityTypeName});
    await db('permission').del().where({resourceName: entityTypeName});
    await db.schema.dropTableIfExists(entityTypeName);

    const fieldDrops = fields
      .map(({name}) => db.schema.dropTableIfExists(`field${pascalCase(name)}`));

    await Promise.all(fieldDrops);

  }
}
