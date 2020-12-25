const
commandLineUsage = require('command-line-usage'),
DepGraph = require('dependency-graph').DepGraph;

const {
  invokeHook,
} = require('@owo/lib/hook');

const prompts = require('prompts');

const {
  getIfSet,
  getTrueIfSet,
  toposort,
  uniqueElements,
} = require('@owo/lib/collection');

const {
  capitalCase,
  list,
} = require('@owo/lib/string');

const {
  isOwoInstalled,
} = require('@owo/lib/install');

const {
  owoAssertAssetLoaded,
  owoRequireInfos,
  owoRequirePluginInstalls,
  owoRequirePluginClis,
  owoRequireProjectClis,
  owoRequirePlugins,
} = require('@owo/lib/loader');

const dbLib = require('@owo/lib/db');

const logger = require('@owo/lib/logger')('@owo/lib/plugin');

const pluginGetFileInfo = (name = null, installInfos = null) => {

  if (!name) {
    throw new Error('name required to gather plugin info');
  }

  const nextInfos = installInfos || owoRequireInfos([name]);

  return nextInfos.hasOwnProperty(name)
    ? nextInfos[name]()
    : null;

}

const buildDependencyGraph = (pluginInfos = {}) => {

  const graph = new DepGraph();

  for (const pluginName in pluginInfos) {

    const pluginInfo = pluginGetFileInfo(pluginName, pluginInfos);

    graph.addNode(pluginName, pluginInfo);

    const dependencies = pluginInfo.dependencies || [];

    if (!dependencies.length) {
      continue;
    }

    for (const dependencyName of dependencies) {
      if (!graph.hasNode(dependencyName)) {
        const dependencyData = pluginGetFileInfo(dependencyName, pluginInfos);
        graph.addNode(dependencyName, dependencyData);
      }
      graph.addDependency(pluginName, dependencyName);
    }

  }

  return graph;

};

// this accepts an array of plugin .info exports which
// should include the plugins name and optionally an
// array of dependencies. If a plugin has no 'dependencies'
// property, it is assumed to be loaded first. therefore,
// if you find yourself banging your head getting your hooks
// or reducers to play nice with an invoked hook/reducer
// consider listing that plugin as a dependency!
const pluginSortDependencies = (dependencyGraph = null, reverse = false) => {

  if (!dependencyGraph) {
    throw Error('pluginSortDependencies requires a dependency graph');
  }

  return dependencyGraph.overallOrder();

};

// TODO: implement
const pluginUninstallPlugins = async (owo = {}, pluginNames = [], force = false) => {

  // get all infos from file system (this is where dependencies
  // are declared for each plugin)
  const infos = owoRequireInfos();

  const graph = buildDependencyGraph(infos);

  const pluginDependants = {};

  logger.debug('getting dependants for uninstall');

  for (pluginName of pluginNames) {
    const dependants = graph.dependantsOf(pluginName);
    pluginDependants[pluginName] = dependants;
    pluginDependants[pluginName].push(pluginName);
  }

  if (!force) {

    const uninstallPrompts = pluginNames.map((name) => {

      const dependants = getIfSet(pluginDependants, name, []);

      if (dependants.length <= 1) {
        return `${name} has no dependants and will be uninstalled\n`;
      }

      const numDependants = dependants.length;

      return [
        `${name} plugin has ${numDependants - 1} dependant plugins.\n`,
        `Plugins will be uninstalled in this order:\n\t`,
        `${list(dependants)}\n`,
      ].join(' ');

    });

    const response = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: commandLineUsage([
        {
          content: uninstallPrompts.join(' '),
        },
      ]),
    });

    if (!response.proceed) {
      return false;
    }

  }

  for (pluginName in pluginDependants) {

    const dependants = getIfSet(pluginDependants, pluginName, []);

    // require the .install.js files. should
    const pluginInstalls = owoRequirePluginInstalls(dependants);

    for (dependantName of dependants) {

      logger.info('uninstalling %s', dependantName);

      const [ plugin ] = await db('sealionPlugin').where({ name: dependantName });

      // skip if it was already uninstalled (dont run hooks twice!)
      if (!plugin || !plugin.isInstalled) {
        continue;
      }

      // check if dependant has a .install file
      if (getTrueIfSet(pluginInstalls, dependantName)) {

        logger.debug('running hookUninstall for %s', dependantName);
        await invokeHook(`${dependantName}Uninstall`, owo);

      }

      // update plugin to show uninstalled and disabled.
      await db('sealionPlugin')
        .update({isInstalled: false, isEnabled: false})
        .where({ name: dependantName });

    }

  }

  return true;

};

// we have two methods of checking plugin statuses, the .info.js file
// and the database record. The reason we use both is to perform
// updates and to know what the 'actual' plugin version is
const pluginGetStatusCounts = async (plugins = []) => {

  const installingSealion = !(await isOwoInstalled());

  const aggregates = {
    totalEnabled: 0,
    totalInstalled: 0,
    totalDisabled: 0,
    totalNotInstalled: 0,
    totalUninstalled: 0,
  };

  const lookups = {
    name: {},
    status: {
      installed: {},
      uninstalled: {},
      notInstalled: {},
      needsInstall: {},
      disabled: {},
      enabled: {},
    },
  };

  // return a spoofed status to placate plugin installer
  // when the only plugin supplied is 'sealion',
  // sealion is not installed (no core tables present)
  if (installingSealion) {

    for (pluginName of plugins) {
      lookups.status.needsInstall[pluginName] = true;
      lookups.status.notInstalled[pluginName] = true;
    }

    aggregates.NotInstalled = plugins.length;

    return {
      aggregates,
      lookups,
    }

  }

  logger.debug('scratch install? %s', installingSealion);

  const db = await dbLib.loadDB();

  const rows = await Promise.all(plugins.map((name) => {
    return db('sealionPlugin').where({name});
  }));


  const result = plugins.reduce((obj, name, i) => {

    const [ record ] = rows[i].length
      ? rows[i]
      : [{isInstalled: 0, isEnabled: 0}];

    const {
      isInstalled = 0,
      isEnabled = 0,
    } = record;

    if (isInstalled && isEnabled) {
      aggregates.totalInstalled += 1;
      aggregates.totalEnabled += 1;
      lookups.status.installed[name] = true;
      lookups.status.enabled[name] = true;
    } else if (isInstalled && !isEnabled) {
      aggregates.totalDisabled += 1;
      lookups.status.disabled[name] = true;
    } else if (!rows[i].length) {
      aggregates.totalNotInstalled += 1;
      lookups.status.notInstalled[name] = true;
      lookups.status.needsInstall[name] = true;
    } else if (!isInstalled && !isEnabled) {
      aggregates.totalUninstalled += 1;
      lookups.status.uninstalled[name] = true;
      lookups.status.needsInstall[name] = true;
    }

    return {
      ...obj,
      [name]: record,
    };

  }, {});

  return {
    result,
    aggregates,
    lookups
  };

}

// TODO: move the following into the plugin module
// pluginGetAllInfos
// pluginGetDbInfos
// pluginGetEnabledPluginNames

// this fetches plugins from database and merges
// them with ones found on the file system that are
// not in the db (never installed)
const pluginGetAllInfos = async () => {
  const dbInfos = await pluginGetDbInfos();
  const fileInfosObj = owoRequireInfos();
  // get distinct name. prioritize infos found in db
  // by removing infos from filesystem
  dbInfos.forEach((row) => {
    if (getIfSet(fileInfosObj, row.name)) {
      delete fileInfosObj[row.name];
    }
  });
  const fileInfosFnArr = Object.values(fileInfosObj);
  const fileInfos = fileInfosFnArr.map((fn) => {
    const row = fn();
    row.isInstalled = 0;
    row.isEnabled = 0;
    return row;
  });
  return dbInfos.concat(fileInfos);
}

const pluginGetDbInfos = async (where = {}) => {

  db = await dbLib.loadDB();

  return db('sealionPlugin')
    .where(where);

}

const pluginGetEnabledPluginNames = async () => {

  const db = await dbLib.loadDB();

  // enabled plugins only live in the database
  return pluginGetDbInfos({isInstalled: true, isEnabled: true})
    .then((result = []) => result.map(({name}) => name));

};

// TODO: break this up. simplify it. its so big!!!
const pluginInstallPlugins = async (owo = {}, plugins = [], force = false) => {

  const db = await dbLib.loadDB();

  // grab initial infos
  const pluginInfos = owoRequireInfos(plugins);

  logger.debug('installing these plugins %o', pluginInfos);

  owoAssertAssetLoaded('info', pluginInfos, plugins);

  const graph = buildDependencyGraph(pluginInfos);

  // get in order they are required.
  const sortedPlugins = pluginSortDependencies(graph);

  logger.debug('after applying a topological sort %o', sortedPlugins);

  // Grab more information if we are not doing a scratch
  // install. otherwise, treat it as if the plugin table
  // doesn't even exist because it probably doesn't
  const pluginStatusResults = await pluginGetStatusCounts(sortedPlugins);

  const {
    aggregates: aggregateStatuses = {},
    lookups: pluginStatusLookup = {},
  } = pluginStatusResults;

  const {
    totalEnabled,
    totalDisabled,
    totalInstalled,
    totalUninstalled,
    totalNotInstalled,
  } = aggregateStatuses;

  const totalToInstall = totalNotInstalled + totalUninstalled;

  const toInstall = Object
    .keys(pluginStatusLookup.status.needsInstall);

  const toEnable = Object
    .keys(pluginStatusLookup.status.disabled);

  const goodToGo = Object
    .keys(pluginStatusLookup.status.enabled);

  if (!toInstall.length) {
    logger.info(`${list(goodToGo)} already installed`);
    return false;
  }

  if (!force) {

    const response = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: commandLineUsage([
        // TODO: make nicer! maybe a table
        {
          content: [
            `${totalToInstall} plugins will install`,
            list(toInstall),'\n',
            `${totalDisabled} plugins will be enabled:\n\t`,
            list(toEnable),'\n',
            `${totalEnabled} plugins good to go!\n\t`,
            list(goodToGo),'\n',
            `Continue?`,
          ].join(' '),
        },
      ]),
    });

    if (!response.proceed) {
      return false;
    }

  }

  logger.debug(`loading .install files for %s`, list(toInstall));

  // require the .install.js files. should
  const pluginInstalls = owoRequirePluginInstalls(toInstall);

  // refetch .info files because we may have more plugins to
  // install than originally thought!
  const installInfos = owoRequireInfos(toInstall);

  const {
    enabled: isEnabledLookup,
    disabled: isDisabledLookup,
    needsInstall: needsInstallLookup,
    uninstalled: isUninstalledLookup,
  } = pluginStatusLookup.status;

  // go through all dependencies (installed, disabled, or enabled)
  for (const pluginName of sortedPlugins) {
    // case1: plugin already installed and enabled. if it is in owo
    // it is already installed.

    if (getTrueIfSet(isEnabledLookup, pluginName)) {

      logger.debug(`%s looks to be loaded and bootstrapped. skipping`, pluginName);
      continue;

    // case2: plugin is disabled, but has been installed
    } else if (getTrueIfSet(isDisabledLookup, pluginName)) {

      logger.debug(`%s seems to be disabled. enabling!`, pluginName);
      // load .plugin.js files
      Object.assign(owo, owoRequirePlugins([pluginName]));

      // update the database to show it is enabled.
      await db('sealionPlugin')
        .update({isEnabled: true})
        .where({name: pluginName})

      continue;

    }


    // case3: assumed uninstalled
    const
    hasInstall = getTrueIfSet(pluginInstalls, pluginName),
    needsInstall = getTrueIfSet(needsInstallLookup, pluginName),
    inDB = getTrueIfSet(isUninstalledLookup, pluginName);

    const pluginInfo = installInfos[pluginName]();

    const {
      version: pluginVersion,
      label: pluginLabel,
      description: pluginDescription = '',
    } = pluginInfo;

    logger.debug(`%s not installed. checking install for hooks`, pluginName);

    // only run .install hooks if the plugin is not installed (on file system
    // and not in DB), or is uninstalled (was installed into DB but uninstalled)

    // install file is not strictly necessary to enable or install a module!
    if (needsInstall && hasInstall) {

      logger.debug(`invoking ${pluginName}Install`);
      await invokeHook(`${pluginName}Install`, owo);

      // TODO: check sealion core version (just 1.x supported for now)

      // if minor and major version are not zero
      if (!/-0\.0$/.test(pluginVersion)) {

        logger.debug(`%s has updates as it is on version %s`, pluginName, pluginVersion);
        // grab the release
        const [_, release = ''] = /-(\d\.\d)$/.exec(pluginVersion);

        const [maj = '', min = ''] = release.split('.');

        // support for 999 major releases and 999 minor releases enough?
        if (/^\d{1,3}$/.test(maj) && /^\d{1,3}$/.test(min)) {

          // run all updates up to and including current version
          for (let i = 0; i <= maj; i++) {
            for (let j = 1; j <= min; j++) {
              const updateHookName = `update${pascalCase(pluginName)}Plugin-${maj}.${min}`;
              logger.debug(`invoking %s`, hookName);
              await invokeHook(updateHookName, owo);
            }
          }

        }

      }
    }

    // run update or insert
    if (inDB) {
      logger.debug(`%s was already in database. Running update`, pluginName);
      await db('sealionPlugin')
        .update({
          isInstalled: true,
          isEnabled: true,
          version: pluginVersion,
          label: pluginLabel || capitalCase(pluginName),
          description: pluginDescription,
        })
        .where({
          name: pluginName
        });
    } else {
      logger.debug(`%s not in database. Running insert`, pluginName);
      await db('sealionPlugin')
        .insert({
          isInstalled: true,
          isEnabled: true,
          label: pluginLabel || capitalCase(pluginName),
          name: pluginName,
          description: pluginDescription,
          version: pluginVersion,
        });
    }

    // TODO: see about reducing calls to owoRequirePlugins or optimizing with
    // a cache of some kind
    logger.debug(`%s finished installing`, pluginName);

    owo.plugin[pluginName] = {};

    // create a namespace for module.
    owo.plugin[pluginName] = {};

    // a plugin returns an object of functions; a collective interface
    const loadedPlugins = owoRequirePlugins([pluginName]);
    const pluginFn = getIfSet(loadedPlugins, pluginName);

    if (pluginFn) {
      Object.assign(owo.plugin[pluginName], pluginFn(owo));
    }

    // a cli is always exposed as a function
    const loadedCli = owoRequirePluginClis([pluginName]);

    if (loadedCli) {
      Object.assign(owo.cli, loadedCli);
    }

  }

  // reload the sealion controllers, routers... everything
  // somehow. somthing kind of like this
  // await invokeHook(`bootstrap`);

  return true;

}

const pluginBootstrap = async (owo = {}) => {

  if (! await isOwoInstalled()) {

    logger.info('Sealion does not appear to be installed');
    return;

  }

  // these are ALL enabled plugins. note that each plugin
  // is only required to carry an info and plugin file
  // they may not have install or cli files
  const enabledPlugins = await pluginGetEnabledPluginNames();

  const pluginInfos = await owoRequireInfos(enabledPlugins);

  if (pluginInfos) {
    Object.assign(owo.info, pluginInfos);
  }

  const pluginClis = owoRequirePluginClis(enabledPlugins);

  if (pluginClis) {
    Object.assign(owo.cli, pluginClis);
  }

  const plugins = owoRequirePlugins(enabledPlugins);

  const graph = buildDependencyGraph(pluginInfos)

  const sortedPlugins = pluginSortDependencies(graph);

  for (pluginName of sortedPlugins) {

    const pluginFn = getIfSet(plugins, pluginName);

    if (!pluginFn) {
      continue;
    }

    owo.plugin[pluginName] = await pluginFn(owo);

  }

};

module.exports = {
  pluginBootstrap,
  pluginGetStatusCounts,
  pluginGetAllInfos,
  pluginGetDbInfos,
  pluginGetEnabledPluginNames,
  pluginInstallPlugins,
  pluginSortDependencies,
  pluginUninstallPlugins,
  pluginGetFileInfo,
};

