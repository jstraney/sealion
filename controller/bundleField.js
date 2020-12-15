const {
  invokeHook,
} = require('../lib/hook');

const {
  camelCase,
  capitalCase,
} = require('../lib/util');

const db = require('../lib/db');

const logger = require('../lib/logger')('bundleFieldController');

const ResourceController = require('./ResourceController');

const bundleFieldController = new ResourceController('bundleField', {
  idKey: ['bundleName', 'fieldName'],
  propKeys: [
    'bundleName',
    'fieldName',
    'label',
    'created_at',
    'updated_at',
  ],
});

const fieldController = require('./field');

invokeHook('bundleFieldCreateTableArgs', async (rawArgs = {}) => {

  const {
    fieldName,
    label = capitalCase(fieldName),
    ...tableArgs
  } = bundleField;

  return {
    fieldName,
    label,
    ...tableArgs
  };

});

module.exports = bundleFieldController;
