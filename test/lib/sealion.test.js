const {
  isHookImplemented,
  isReducerImplemented,
} = require('../../lib/hook');

const {
  sealionRequireCoreClis,
  sealionRequirePluginClis,
  sealionRequirePlugins,
  sealionInstallPlugin,
  sealionRequirePluginInstalls,
  sealionPluginInfo,
  sealionRequireInfos,
  sealionUninstallPlugin,
  sealionSortDependencies,
  SEALION_REQUIRE_CORE_ONLY,
} = require('../../lib/sealion');

const {
  test,
} = require('../../lib/test');

module.exports = test('lib/sealion', async (owo, args, ensure) => {

  const coreClis = sealionRequireCoreClis();

  await ensure('sealionRequireCoreCLIs', async () => {
    await ensure('Returns object of CLIs', coreClis.hasOwnProperty('init'));
    await ensure('Core CLI is a function', typeof coreClis.init === 'function');
  });

  await ensure('sealionRequirePlugins()', async () => {

    // testing for load by name
    const pluginClis = sealionRequirePluginClis(['helloSealion'], SEALION_REQUIRE_CORE_ONLY);

    await ensure('Returned plugin', pluginClis.hasOwnProperty('helloSealion'));
    await ensure('And is a function', typeof pluginClis.helloSealion === 'function');

  });


  await ensure('sealionRequirePlugins(plugins);', async (logger) => {

    const corePlugins = sealionRequirePlugins(['entity'], SEALION_REQUIRE_CORE_ONLY);

    logger.info('Only loads entity plugin');
    await ensure('has entity plugin', corePlugins.hasOwnProperty('entity'));
    await ensure('has no entityType plugin', !corePlugins.hasOwnProperty('entityType'));

    const corePlugins2 = sealionRequirePlugins(['entityType'], SEALION_REQUIRE_CORE_ONLY);

    logger.info('Only loads entityType plugin');
    await ensure('has entityType plugin', corePlugins2.hasOwnProperty('entityType'));
    await ensure('has no entity plugin', !corePlugins2.hasOwnProperty('entity'));

    logger.info('Loads two plugins');
    const corePlugins3 = sealionRequirePlugins(['entity', 'entityType'], SEALION_REQUIRE_CORE_ONLY);
    await ensure('has entityType plugin', corePlugins3.hasOwnProperty('entityType'));
    await ensure('has entity plugin', corePlugins3.hasOwnProperty('entity'));

  })


  await ensure('sealionRequireInstalls', async () => {

    // testing the ability to pass in already loaded modules
    const coreInstalls = sealionRequirePluginInstalls([
      'helloSealion',
    ], SEALION_REQUIRE_CORE_ONLY);

    await ensure('hook1 registered', isHookImplemented('helloSealionInstall'));
    await ensure('hook2 registered', isHookImplemented('helloSealionUninstall'));

  });

  await ensure('sealionSortDependencies', async () => {

    const infos = sealionRequireInfos(['sealion', 'helloSealion']);

    const sortedDependencies = sealionSortDependencies(infos);

    await ensure('There are sorted dependencies', sortedDependencies.length > 0);

  });

  await ensure('sealionPluginInfo', async (logger) => {

    const infos = sealionRequireInfos(['entity', 'entityType']);

    const entityPluginInfo = sealionPluginInfo('entity');
    await ensure('Entity plugin info loads', entityPluginInfo.name === 'entity');

  });


});
