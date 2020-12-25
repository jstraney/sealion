module.exports = () => ({
  name: 'entityType',
  version: '1.x-0.0',
  description: [
    'entityType is in fact its own entity (table). By inserting a record of',
    'entityType, a new table is created with columns representing the',
    'entityProperties.',
  ].join(' '),
  dependencies: [
    'base',
    'bundle',
    'entity',
    'entityProperty',
  ],
})
