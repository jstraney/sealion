const {
  invokeHook,
} = require('./hook');

const {
  reduceAnd,
} = require('./collection');

const dbLib = require('./db');

const logger = require('./logger')('@owo/lib/install');

const {
  owoGetEnabledPluginNames,
} = require('./plugin');

const {
  owoRequireInfos,
  owoRequirePluginClis,
} = require('./loader');

// checks for a correct install
const isOwoInstalled = async () => {

  logger.debug('checking if sealion is installed');

  if (!(await dbLib.canLoadDB())) {
    logger.debug('cant load database. sealion not installed');
    return false;
  }

  const db = await dbLib.loadDB();

  const tablesExtant = await Promise.all([
    db.schema.hasTable('sealionOption'),
    db.schema.hasTable('sealionPlugin'),
  ]);

  if (!reduceAnd(tablesExtant)) {
    logger.debug('sealion core tables missing. sealion not installed');
    return false;
  }

  // TODO: other checks?

  logger.debug('sealion appears to be installed');
  return true;

};

module.exports = {
  isOwoInstalled,
};
