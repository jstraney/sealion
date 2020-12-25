module.exports = () => ({
  name: 'sealion',
  version: '1.x-0.0',
  description: [
    'A modular node framework with emphasis on extensability and',
    'adoption of strong specifications.',
  ].join(' '),
  dependencies: [
    'base',
    'plugin',
    'entity',
    'entityTypeProperty',
    'bundle',
    'entityType',
    'auth',
    'server',
  ]
});
