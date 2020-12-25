const {
  pascalCase,
  sentenceCase,
} = require('@owo/lib/string');

const {
  invokeReduce,
  implementReduce,
  isReducerImplemented,
} = require('@owo/lib/hook');

const logger = require('@owo/lib/logger')('owo://entity:plugin/entity.cli');

// nasty nasty nasty;
const entityApiCli = {};

implementReduce('cliHelp', async (allHelp, owo) => {

  const {
    lib: { dbLib },
    plugin: { entity: entityApi },
  } = owo;

  if (!dbLib.canLoadDB()) {
    return allHelp;
  }

  const db = await dbLib.loadDB();

  const entityTypes = await db('entityType');

  const entityTypeHelp = {
    entity: {
      description: [
        'Any entityType created using the entityTypeModel.create method',
        'will have a CLI with its own help populated here.',
      ].join(' '),
      examples: [
        'sealion entityTypeProperty remove <action> [...options]',
        'sealion bundle remove <action> [...options]',
        'sealion permission create <action> [...options]',
        'sealion <any-entityType-name> <action> [...options]',
        'sealion help <any-entityType-name>',
      ],
    }
  };

  for (const row of entityTypes) {

    const {
      name,
      label,
    } = row;

    const properties = await db('entityTypeProperty')
      .where({entityTypeName: name});

    const actions = await entityApi.getEntityTypeActions(name);

    const actionNames = Object.keys(actions);

    entityTypeHelp[name] = {
      description: `manage ${label.toLowerCase()} records. alias for 'help ${name}'`,
      usage: `sealion ${name} <op> [--options,...]`,
      subCommands: actionNames,
    };

    for (action of actionNames) {

      const cliOptionHookName = `${name}${pascalCase(action)}DefineCliArgs`;

      // this reducer should only be implemented once! something
      // about this doesnt sit right with me, but it works.
      if (!isReducerImplemented(cliOptionHookName)) {

        implementReduce(cliOptionHookName, () => {

          return properties.map((property) => {

            const {
              propertyName,
              help = '',
            } = property;

            // TODO: reverse lookup of knex type to c-l-a type

            // TODO: infer actual CLI options based on action
            // (for example, remove should really only accept
            // unique keys for the entity. It may be fine and I could be wrong!)

            return { name: propertyName, type: String, description: help };

          });

        });

      }

      // add default help
      entityTypeHelp[`${name}${pascalCase(action)}`] = {
        description: `${sentenceCase(action)} ${label.toLowerCase()} records`,
        usage: `sealion ${name} ${action} [--options,...]`,
      };

    }

  }

  return {
    ...allHelp,
    ...entityTypeHelp
  };

});

module.exports = (owo, args) => {

  logger.info('%o', args);

};
