const {
  implementReduce,
} = require('@owo/lib/hook');

const {
  pluginInstallPlugins,
} = require('@owo/lib/plugin');

const logger = require('../lib/logger')('@owo/bin/install');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  install: {
    description: 'install sealion database and core plugins',
  }
}));

// TODO: support installation profiles
implementReduce('installDefineCliArgs', () => [
  { name : 'basic', type: Boolean, defaultValue: false },
]);

module.exports = async (owo, args = {}) => {

  const {
    basic = false,
  } = args;

  await pluginInstallPlugins(owo, ['sealion'], true);

  return 'installation finished!';

};
