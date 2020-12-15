const ResourceController = require('./ResourceController');

module.exports = new ResourceController('role', {
  idKey: 'name',
  propKeys: [
    'name',
    'label',
    'created_at',
    'updated_at',
  ],
});
