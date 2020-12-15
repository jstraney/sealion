const {
  implementReduce,
} = require('../lib/hook');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  up: [
  ],
}));

module.exports = () => {
};
