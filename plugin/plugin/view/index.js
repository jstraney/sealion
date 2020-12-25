const {
  pluginStatusLabel,
} = require('../lib');

const pluginCliView = (record = {}) => {

  const {
    name = 'unnamed',
    version = 'no version',
    description = '',
  } = record;

  const pluginStatus = pluginStatusLabel(record);


  return {
    header: `${name}`,
    content: {
      options: {
        columns: [
          { name: 'version', width: 16},
          { name: 'description', width: 48},
          { name: 'pluginStatus', width: 16}
        ],
      },
      data: [
        {
          version,
          description,
          pluginStatus,
        },
      ],
    }
  }
};

module.exports = {
  pluginCliView,
};
