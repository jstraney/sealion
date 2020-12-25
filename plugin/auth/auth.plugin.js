const {
  implementReduce,
  implementHook,
} = require('@owo/lib/hook');

const {
  camelCase,
  capitalCase,
} = require('@owo/lib/string');

const {
  getEntityModel,
  getEntityModels,
  getEntityTypeActions,
} = require('@owo/plugin/entity/entity.plugin')();

const dbLib = require('@owo/lib/db');

const logger = require('@owo/lib/logger')('@owo/plugin/auth/auth.plugin');

const AuthModel = require('./model/AuthModel');

// define new actions to entityTypes so long as they have the
// canAuthenticate property
implementReduce('entityModelActions', async (actions = {}, entityTypeName) => {

  // db lib was used here because using the entityType model triggered
  // a cycle.
  const db = await dbLib.loadDB();

  const [ entityType ] = await db('entityType')
    .where({name: entityTypeName});

  if (entityType.canAuthenticate) {
    actions.authenticate = AuthModel.authenticate;
  }

  return actions;

});

// implementReduce('')

implementHook('entityTypeEntityCreate', async (rawArgs = {}) => {

  const {
    entityTypePropertyModel,
    permissionModel,
  } = await getEntityModels([
    'entityTypeProperty',
    'permission',
  ]);

  const {
    name: entityTypeName,
    canAuthenticate = false,
  } = rawArgs;

  // add a property for secret if entityType can
  // authenticate
  if (canAuthenticate) {
    await entityTypePropertyModel.create({
      entityTypeName,
      propertyName: 'secret',
      label: 'Password',
      type: 'secret',
      isRequired: true,
    });
  }

  const scopes = ['any', 'own'];

  const permissionInserts = [];

  const actions = await getEntityTypeActions(entityTypeName);

  const actionNames = Object.keys(actions);

  for (let action of actionNames) {
    for (let scope of scopes) {
      const
      label = capitalCase(`${action} ${scope} ${entityTypeName}`),
      name = camelCase(label);
      permissionInserts.push(permissionModel.create({
        name,
        label,
        action,
        resourceName: entityTypeName,
      }));
    }
  }

  await Promise.all(permissionInserts).catch((error) => {

    logger.error(`error creating permissions for %s: %o`, entityTypeName, error);

    db('permission').del().where({resourceName: entityTypeName});

  });

});

implementHook('entityTypeEntityRemove', async (rawArgs = {}, _, numRemoved = 0) => {

  if (numRemoved < 1) {
    return;
  }

  const permissionModel = await getEntityModel('permission');

  const {
    name: entityTypeName,
  } = rawArgs;

  await permissionModel.remove({
    resourceName: entityTypeName,
  });

});


module.exports = () => ({});
