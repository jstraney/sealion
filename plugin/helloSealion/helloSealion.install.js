const {
  implementHook,
} = require('../../lib/hook');

const logger = require('../../lib/logger')('owo://helloSealion:plugin/helloSealion.install');

implementHook('helloSealionInstall', async (owo) => {

  logger.info('install hook invoked from helloSealion.install!');

});

implementHook('helloSealionUninstall', async (owo) => {

  logger.info('uninstall hook invoked from helloSealion.install!');

});

// further reading: how to do plugin updates
