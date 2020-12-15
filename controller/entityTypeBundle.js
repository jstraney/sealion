const ResourceController = require('./ResourceController');

module.exports = new ResourceController('entityTypeBundle', {
  idKey: ['entityTypeName', 'bundleName'],
  propKeys: [
    'entityTypeName',
    'bundleName',
    'created_at',
    'updated_at',
  ],
});
