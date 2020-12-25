const {
  implementReduce,
} = require('../lib/hook');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  repl: {
    description: 'Run a REPL with bootstrapped sealion context',
    usage: 'sealion repl'
  },
}));

const repl = require('repl');

module.exports = (owo, args) => {

  process.env.NODE_OPTIONS = '--experimental-repl-await';

  // Help improve the sealion REPL!
  // https://nodejs.org/api/repl.html
  repl.start('ºωº < ').context.owo = owo;

  return 'Starting sealion REPL. Try typing "owo". CTRL-C twice exits';

};
