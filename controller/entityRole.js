const ResourceController = require('./ResourceController');

module.exports = new ResourceController('entityRole', {
  idKey: ['entityId', 'entityTypeName'],
  propKeys: [
    'entityId',
    'entityTypeName',
    'roleName',
    'created_at',
    'udpated_at',
  ],
});
