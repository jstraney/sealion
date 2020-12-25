const {
  invokeReduce,
  invokeHook,
} = require('@owo/lib/hook');

const logger = require('@owo/lib/logger')('@owo/plugin/auth/model/AuthModel');

// in sealion, we can bind actions to a model
// by implementing the reducer entityTypeAction
//
// see auth.plugin for an example.
async function authenticate (args = {}) {

  logger.debug(`authenticating ${this.name} entity`);

  const
  db = this.db,
  entityTypeInfo = this.entityTypeInfo;

  const tableArgs = await this.getTableArgs('authenticate', rawArgs);

  // authentication is an odd one because we don't really
  // return an elaborate response
  await invokeHook([
    `entityInvalidateAuthenticate`,
    `${this.name}EntityInvalidateAuthenticate`,
  ], rawArgs, tableArgs, entityTypeInfo, 'authenticate');

  await invokeHook([
    `entityAuthenticate`,
    `${this.name}EntityAuthenticate`,
  ], rawArgs, tableArgs);

  return result;

}

module.exports = {
  authenticate,
}
