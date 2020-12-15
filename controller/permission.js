const ResourceController = require('./ResourceController');

module.exports = new ResourceController('permission', {
  idKey: 'name',
  propKeys: [
    'name',
    'label',
    'resourceName',
    'created_at',
    'updated_at',
  ],
});
