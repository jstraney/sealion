const decorate = (fnA, fnB) => {
  return (...args) => fnA(fnB, ...args);
};

const curry = (fnA, ...args) => {
  return (...nextArgs) => fnA(...args, ...nextArgs);
}

module.exports = {
  decorate,
  curry,
}
