const {
  implementReduce,
} = require('../../lib/hook');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  helloSealion: {
    description: 'example CLI',
    usage: 'sealion hello-sealion',
    examples: [
      'sealion hello-sealion 10',
    ]
  },
}));

implementReduce('helloSealionDefineCliArgs', () => [
  { name: 'hello', type: String, defaultOption: true },
]);

module.exports = (owo, args = {}) => {

  const {
    hello,
  } = args;

  return hello
    ? `sealion says "${hello}"`
    : 'hello sealion';

};
