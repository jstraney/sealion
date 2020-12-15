const ResourceController = require('./ResourceController');

module.exports = new ResourceController('rolePermission', {
  idKey: ['roleName', 'permissionName'],
  propKeys: [
    'roleName',
    'permissionName',
    'created_at',
    'updated_at',
  ],
});
