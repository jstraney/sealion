const path = require('path');

const {
  invokeReduce,
  implementReduce,
} = require('../lib/hook');

module.exports = async () => {

  const resourceNames = await invokeReduce('resourceNames', [
    'entity',
    'entityType',
    'entityTypeProperty',
    'bundle',
    'entityTypeBundle',
    'field',
    'bundleField',
    'permission',
    'role',
    'rolePermission',
    'entityRole',
    'logEvent',
    'batch',
  ]);

  return invokeReduce('resourceControllers', resourceNames.reduce((obj, name) => ({
    ...obj,
    [name]: require(path.join(__dirname, name)),
  }), {}));

};
