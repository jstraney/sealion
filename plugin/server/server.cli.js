const {
  implementReduce,
} = require('@owo/lib/hook');


const logger = require('@owo/lib/logger')('@owo/plugin/server/server.cli');

const {
  serverUp,
} = require('./lib/cli');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  server: {
    description: 'get sealion server status. alias for "sealion server status"',
    subCommands: ['up', 'down'],
    usage: 'sealion server',
  },
  serverUp: {
    description: 'brings up sealion server',
    usage: 'sealion server up',
  },
  serverDown: {
    description: 'brings down sealion server',
    usage: 'sealion server down',
  },
}));

implementReduce('serverDefineCliArgs', () => [
  { name: 'sub-command', type: String, defaultOption: true},
]);

implementReduce('serverUpDefineCliArgs', () => [
  { name: 'iface', type: Number, defaultValue: process.env.SEALION_SERVICE_IFACE},
  { name: 'port', type: String, defaultValue: process.env.SEALION_SERVICE_PORT},
]);

module.exports = async (owo, args) => {

  const {
    subCommands = ['status'],
  } = args;

  const [ subCommand ] = subCommands;

  // TODO: once sealion server up is detachable, write a command
  // to get server status
  if (subCommand === 'status') {

  // TODO: allow service to be daemonized (detached) by default
  } else if (subCommand === 'up') {

    logger.debug('starting sealion server');

    return await serverUp(owo, args);

  // TODO: once sealion server up is detachable, write a command
  // to take server down.
  } else if (subCommand === 'down') {

  }

};
