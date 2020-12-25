module.exports = () => ({
  name: 'entity',
  version: '1.x-0.0',
  description: [
    'An entity is a table is a table is a table. The entity plugin provides',
    'an abstract interface for interfacing a table and establishes strong',
    'hook and reduce patterns for other plugins to use.',
  ].join(' '),
  dependencies: [
    'base',
  ],
});
