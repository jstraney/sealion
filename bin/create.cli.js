const {
  implementReduce,
} = require('../lib/hook');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  create: {
    description: 'make something',
    usage: 'sealion create <something>',
    examples: ['sealion create entityType', 'sealion create content --bundle post'],
  },
  createEntityType: {
    description: 'create an entityType. This defines a category of entity, much like a class.',
    usage: 'sealion create entityType <name> [--canAuthenticate, --fieldable]',
    examples: [
      'sealion create entityType file --fieldable',
      'sealion create entityType user --canAuthenticate'
    ],
  },
  createEntityProperty: {
    description: 'define a property on an entity. properties are 1 to 1 and become columns on the entity table',
    usage: 'sealion create entityProperty <entityTypeName> <propName> <type> [--options...]',
    examples: [
      'sealion create entityProperty file mime string',
      'sealion create entityProperty user integer'
    ],
  },
}))

module.exports = () => {

};
