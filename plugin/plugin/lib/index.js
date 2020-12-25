const
path = require('path'),
fs = require('@owo/lib/fs');

const replaceInFile = require('replace-in-file');

const logger = require('@owo/lib/logger')('@owo/plugin/plugin/lib');

const createPluginScaffold = async (projectPath, pluginName, includeInstall = false) => {

  const pluginPath = path.join(projectPath, 'plugin/custom', pluginName);

  await fs.mkdirAsync(pluginPath, { recursive: true }).catch((error) => {
    if (error.code !== 'EEXISTS') {
      throw error;
    }
  });

  await fs.copyFileAsync(path.join(__dirname, './info.tpl.js'), path.join(pluginPath, `${pluginName}.info.js`));
  await fs.copyFileAsync(path.join(__dirname, './plugin.tpl.js'), path.join(pluginPath, `${pluginName}.plugin.js`));

  if (includeInstall) {
    await fs.copyFileAsync(path.join(__dirname, './install.tpl.js'), path.join(pluginPath, `${pluginName}.install.js`));
  }

  // TODO: replace boiler plate language in infos using sed or something similar
  const results = await replaceInFile({
    files: path.join(pluginPath, `${pluginName}.*.js`),
    from: /<<<PLUGIN-NAME>>>/g,
    to: pluginName,
    countMatches: true,
  });

  logger.info('%o', results);

};

const pluginStatusLabel = (record = {}) => {

  const {
    isInstalled = 0,
    isEnabled = 0,
  } = record;

  if (isInstalled) {
    if (isEnabled) {
      return 'installed';
    } else {
      return 'uninstalled';
    }
  } else if (isEnabled) {
    return 'disabled';
  } else {
    return 'not installed';
  }

};

module.exports = {
  createPluginScaffold,
  pluginStatusLabel,
}
