
const chalk = require('chalk')

const commandLineUsage = require('command-line-usage');

const {
  implementReduce,
  invokeReduce,
} = require('@owo/lib/hook');

const {
  camelCase,
} = require('@owo/lib/string');

implementReduce('cliHelp', (allHelp, owo, commandNames) => ({
  ...allHelp,
  help: {
    description: 'Sealion CLI help',
    usage: 'sealion help <sub-command>',
    subCommands: commandNames,
  }
}));

// converts an option (as defined in command-line-args module) to
// help text
const optionToHelp = (optionDef) => {

  const {
    name = 'undefined',
    type = String,
    multiple = false,
    defaultOption = false,
    defaultValue,
    description = null,
  } = optionDef;

  return {
    name,
    typeLabel: `{underline ${type.name.toLowerCase()}}`,
    description: [
      description,
      defaultOption ? 'default-option': null,
      defaultValue !== undefined ? `default-value="${defaultValue}"` : null,
      multiple ? 'multiple values': null,
    ].filter((a) => a !== null).join(' ')
  };

}

module.exports = async (owo, __, rawArgs = [], commandNames = []) => {

  const allHelp = await invokeReduce('cliHelp', {}, owo, commandNames);

  // slice out token 'help'. so 'help entity create' or 'entity create help'
  // just returns 'entity create' and gets help on that topic
  const
  topic = rawArgs.length ? rawArgs.join(' '): 'help',
  camelTopic = camelCase(topic);

  const helpFound = allHelp.hasOwnProperty(camelTopic);

  const helpDef = helpFound
    ? allHelp[camelTopic]
    : allHelp.help;

  if (topic !== 'help' && !helpFound) {
    helpDef.description = `No help for "${topic}". Showing default help`;
  }

  // build default header. allow description to be passed
  const relevantHelp = [
    {
      header: `Sealion CLI ºωº < ${topic}`,
      content: helpDef.description || 'no description',
    }
  ];

  // allow usage, examples
  if (helpDef.usage) {
    relevantHelp.push({
      header: 'Usage',
      content: helpDef.usage,
    })
  }

  if (helpDef.examples) {
    relevantHelp.push({ 
      header: 'Examples',
      content: helpDef.examples,
    })
  }

  if (helpDef.subCommands) {
    relevantHelp.push({
      header: 'Sub Commands',
      content: helpDef.subCommands,
    })
  }

  // get args for command and build out an option list
  const definedOptions = await invokeReduce(`${camelTopic}DefineCliArgs`, []);

  if (definedOptions.length) {
    relevantHelp.push({
      header: 'Options',
      content: definedOptions.map(optionToHelp),
    })
  }

  const coreArgs = await invokeReduce('sealionDefineCliArgs');

  // define global options which should be passed to all commands
  relevantHelp.push({
    header: 'Global Options',
    content: coreArgs.map(optionToHelp),
  });

  relevantHelp.push({
    header: 'Community',
    content: [
      {name: 'contribute', description: 'https://github.com/jstraney/sealion/.github/CONTRIBUTING.md'},
      // develop an org first with rules, core contributers, a board of
      // trustees. We could have a registry for core contributers and
      // split donations to the org.
      // {name: 'Donate': 'Donate to sealion'},
      {name: 'documentation', description:'https://github.com/jstraney/sealion/doc/README.md'},
    ],
  });

  return commandLineUsage(relevantHelp);

};
