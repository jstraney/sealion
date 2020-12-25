const path = require('path');

const commandLineUsage = require('command-line-usage');

const {
  implementReduce,
} = require('@owo/lib/hook');

const {
  pluginGetAllInfos,
  pluginInstallPlugins,
  pluginUninstallPlugins,
} = require('@owo/lib/plugin');

const {
  arrayToLookup,
  getIfSet,
  sortOnObjKey,
} = require('@owo/lib/collection');

const {
  list,
} = require('@owo/lib/string');

const {
  pluginCliView,
} = require('./view');

const {
  createPluginScaffold,
} = require('./lib');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  plugin: {
    description: 'List all plugins. alias for sealion plugin list. there are subcommands below.',
    subCommands: ['list', 'install', 'uninstall', 'create'],
    usage: 'sealion plugin',
  },
  pluginList: {
    description: 'List all plugins. Long form of sealion plugin.',
    usage: 'sealion plugin list',
  },
  pluginInstall: {
    description: 'Install one or more plugins',
    usage: 'sealion plugin install <plugins...>',
  },
  pluginUninstall: {
    description: 'Uninstall one or more plugins',
    usage: 'sealion plugin uninstall <plugins...>',
  },
  pluginCreate: {
    description: 'Scaffold plugin directories under <project-path>/plugin/custom/<plugin-name>',
    usage: 'sealion plugin create <plugins...>',
  },
}));

implementReduce('pluginDefineCliArgs', () => [
  { name: 'sub-command', type: String, defaultOption: true, defaultValue: 'list'},
  { name: 'plugins', alias: 'p', type: String, multiple : true },
]);

implementReduce('pluginInstallDefineCliArgs', () => [
  { name: 'plugins', type: String, defaultOption: true, multiple : true },
]);

implementReduce('pluginUninstallDefineCliArgs', () => [
  { name: 'plugins', type: String, defaultOption: true, multiple : true },
]);

implementReduce('pluginListDefineCliArgs', () => [
  { name: 'plugins', type: String, defaultOption: true, multiple : true },
]);

implementReduce('pluginCreateDefineCliArgs', () => [
  { name: 'plugins', type: String, defaultOption: true, multiple : true },
  { name: 'include-install', type: Boolean, defaultValue: false },
]);

const logger = require('@owo/lib/logger')('owo://plugin:plugin/plugin.cli');

module.exports = async (owo, args ={}) => {

  const {
    subCommands = ['list'],
    plugins = [],
  } = args;

  const [ subCommand ] = subCommands;

  logger.info('%o', args)

  if (subCommand === 'list') {

    const infos = await pluginGetAllInfos();
    const sortedOnName = sortOnObjKey(infos, 'name');

    // TODO: implement more sophisticated lookup
    if (plugins.length) {

      const lookupObj = arrayToLookup(plugins);

      const nextInfos = sortedOnName
        .filter(({name}) => getIfSet(lookupObj, name))

      return commandLineUsage(nextInfos.map(pluginCliView));

    };

    return commandLineUsage(sortedOnName.map(pluginCliView));

  } else if (subCommand === 'install') {

    if (!plugins.length) {
      throw new Error('specify at least one plugin to install');
    }

    const didInstall = await pluginInstallPlugins(owo, plugins);

    return didInstall
      ? `plugins ${list(plugins)} installed`
      : `plugins ${list(plugins)} not installed`;

  } else if (subCommand === 'uninstall') {

    if (!plugins.length) {
      throw new Error('specify at least one plugin to uninstall');
    }

    const didUninstall = await pluginUninstallPlugins(owo, plugins);

    return didUninstall
      ? `plugins ${list(plugins)} were uninstalled`
      : `plugins ${list(plugins)} were not uninstalled`;

  } else if (subCommand === 'create') {

    const {
      includeInstall = false,
    } = args;

    const { lib: { loader: {
      owoProjectPath
    } } } = owo;

    if (!plugins.length) {
      throw new Error('you must specify a name for the new plugin');
    }

    const projectPath = owoProjectPath();

    for (plugin of plugins) {
      await createPluginScaffold(projectPath, plugin, includeInstall);
    }

    const pluginPath = path.join(projectPath, 'plugin/custom');

    return `created plugins for ${list(plugins)} under ${pluginPath}`;

  } else {

    throw new Error('unrecognized plugin sub command');

  }

};
