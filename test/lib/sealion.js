const {
  sealionRequireCoreClis,
  sealionRequirePluginClis,
  sealionRequirePlugins,
  sealionInstallPlugin,
  sealionUninstallPlugin,
} = require('../../lib/sealion');

const logger = require('../../lib/logger')('Test libSealion');

const assert = require('assert');

module.exports = async () => {

  const coreClis = sealionRequireCoreClis();

  assert(coreClis.hasOwnProperty('init'));
  assert(typeof coreClis.init === 'function');

  const pluginClis = sealionRequirePluginClis();

  assert(pluginClis.hasOwnProperty('helloSealion'));
  assert(typeof pluginClis.helloSealion === 'function');
  assert(await pluginClis.helloSealion() === 'hello sealion');

  logger.info('passed all sealion lib tests');

}
