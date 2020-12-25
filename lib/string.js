const
escapeRegExp = require('escape-string-regexp'),
changeCase = require('change-case');

const trim = ( str, trimmings = ' ') => {
  return ltrim(rtrim(str, trimmings), trimmings);
};

const rtrim = (str, trimmings = ' ') => {
  const safe = escapeRegExp(trimmings);
  return str.replace(new RegExp(safe + '+$'), '');
};

const ltrim = (str, trimmings = ' ') => {
  const safe = escapeRegExp(trimmings);
  return str.replace(new RegExp('^' + safe + '+'), '');
};

const pad = (str, padding = ' ', num = 1) => {
  return rpad(lpad(str, padding, num), padding, num);
}

const lpad = (str, padding = ' ', num = 1) => {
  return padding.repeat(num).concat(str);
};

const rpad = (str, padding = ' ', num = 1) => {
  return str.concat(padding.repeat(num));
};

const list = (arr = []) => arr.join(', ');

const arrayToCamel = (arr = []) => {
  const {camelCase, pascalCase} = changeCase;
  // remove empty strings from array as they have no affect
  // but can break result if the first element is empty
  const [fst = '', ...rest] = arr.filter((str) => {
    return typeof str === 'string' && str !== '';
  });
  return camelCase(fst).concat(...rest.map(pascalCase));
}

module.exports = {
  ...changeCase,
  escapeRegExp,
  trim,
  ltrim,
  rtrim,
  pad,
  lpad,
  rpad,
  list,
  arrayToCamel,
};
