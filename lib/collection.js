const
toposort = require('toposort');

const reduceAnd = (arr = []) => {
  return arr.reduce((acc, b) => acc && b, true);
};

const reduceOr = (arr = []) => {
  return arr.reduce((acc, b) => acc || b, false);
};

const uniqueElements = (arr = []) => [...new Set(arr)];

// collapse an array of objects into object.
// while intuitively, you can use the rest operator, it
// can be a little verbose if your objects are already in
// an array.
const collapseObjects = (arr = [], init = {}) => {

  return arr.reduce((acc, obj) => {
    return obj instanceof Object
      ? {...acc, ...obj}
      : acc;
  }, init);

};

// takes array and produces an object with distinct keys
// this is can be used as a look up table to assert a value
// is in the array
//
// example: ['foo', 'bar', 'baz', 'bar'] => {foo: true, bar: true, baz: true}
const arrayToLookup = (arr = []) => {
  return arr.reduce((o, v) => ({...o, [v]: true}), {})
};

const getIfSet = (o = {}, key = null, defaultValue = null) => {

  if (typeof o === 'object') {
    return o.hasOwnProperty(key) ? o[key] : defaultValue;
  }

  return defaultValue;

};

const getTrueIfSet = (o = {}, key = null) => {

  if (typeof o === 'object') {
    return o.hasOwnProperty(key) ? true : false;
  }

  return false;

};

// sorting on array of objects by key value.
const sortOnObjKey = (arr = [], key = null, mode = 'asc') => {
  const mod = mode === 'asc' ? 0 : 2;
  return arr.sort((a = {}, b = {}) => {
    const aVal = getIfSet(a, key), bVal = getIfSet(b, key);
    if (aVal > bVal) return 1 - (mod * -1);
    if (aVal < bVal) return -1 + (mod * 1);
    return 0;
  })
};

module.exports = {
  reduceAnd,
  reduceOr,
  uniqueElements,
  collapseObjects,
  arrayToLookup,
  getIfSet,
  getTrueIfSet,
  toposort,
  sortOnObjKey,
};
