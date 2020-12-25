const {
  implementHook,
} = require('@owo/lib/hook');

const logger = require('@owo/lib/logger')('<<<PLUGIN-NAME>>>.install');

implementHook('<<<PLUGIN-NAME>>>Install', (owo) => {

  logger.info('installing <<<PLUGIN-NAME>>>');

});

implementHook('<<<PLUGIN-NAME>>>Uninstall', (owo) => {

  logger.info('uninstalling <<<PLUGIN-NAME>>>');

});
