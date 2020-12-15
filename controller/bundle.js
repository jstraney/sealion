const ResourceController = require('./ResourceController');

module.exports = new ResourceController('bundle', {
  idKey: 'name',
  propKeys: [
    'name',
    'label',
    'created_at',
    'updated_at',
  ],
});
