const {
  invokeReduce,
  suggestHook,
} = require('@owo/lib/hook');

const {
  camelCase,
  pascalCase,
} = require('@owo/lib/string');

// example, you want to get defined parser options for
// sealion plugin list and not for sealion plugin, but you
// may want infinitely many sub-commands, this will look up
// a suggested hook
const suggestCliReducer = async (command = [], options = {}, owo) => {

  // firstly get ALL help defined by clis, keyed by cli file name
  // (so for instance, help.cli.js is keyed under help
  const allHelp = await invokeReduce('cliHelp', {}, owo);

  return suggestHook(command, {
    ...options,
    lookupObj: allHelp,
    nextKey: 'subCommands',
    mode: 'reducer',
  });

}

const getSubCommand = (command, suggestedHook, suffix) => {

  // example:
  //   suggested hook is <
  const middle = suggestedHook
    .replace(new RegExp(`^${command}`, ''))
    .replace(new RegExp(`${suffix}$`, ''));

}

const getSubCommandSubArgs = (suggestedHook, fullArgs = []) => {

  let i = 0, buffer = '';

  for (token of fullArgs) {

    const nextBuffer = camelCase(buffer.concat(pascalCase(token)));

    if (suggestedHook.indexOf(nextBuffer) !== 0) {

      return fullArgs.slice(i);

    }

    buffer = nextBuffer;

    i++;

  }

  return fullArgs.slice(i);

}

module.exports = {
  suggestCliReducer,
  getSubCommandSubArgs,
};
