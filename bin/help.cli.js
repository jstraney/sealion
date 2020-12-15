const commandLineUsage = require('command-line-usage');

const {
  implementReduce,
  invokeReduce,
} = require('../lib/hook');

const {
  camelCase,
} = require('../lib/util');

implementReduce('cliHelp', (allHelp, commandNames) => ({
  ...allHelp,
  help: {
    description: 'Sealion CLI help',
    usage: 'sealion help <sub-command>',
    subCommands: commandNames,
  }
}));

module.exports = async (_, rawArgs = [], commandNames = []) => {

  const allHelp = await invokeReduce('cliHelp', {}, commandNames);

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
      header: `SEALION CLI - ${topic}`,
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
      content: definedOptions.map((optionDef) => {

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

      })
    })
  }

  return commandLineUsage(relevantHelp);

};
