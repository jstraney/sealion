const ResourceController = require('./ResourceController');

module.exports = new ResourceController('batch', {
  idKey: 'id',
  propKeys: [
    'id',
    'batchName',
    'status',
    'finished',
    'created_at',
    'updated_at',
  ]
})
