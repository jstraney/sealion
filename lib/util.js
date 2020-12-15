const changeCase = require('change-case');

const collapseObjects = (arr = [], init = {}) => {

  return arr.reduce((acc, obj) => {
    return obj instanceof Object
      ? {...acc, ...obj}
      : acc;
  }, init);

};

module.exports = {
  ...changeCase,
  collapseObjects,
};
