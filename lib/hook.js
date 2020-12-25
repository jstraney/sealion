const crytpo = require('crypto');
const {
  arrayToCamel,
  pascalCase,
} = require('@owo/lib/string');

const {
  getIfSet,
} = require('@owo/lib/collection');

const logger = require('@owo/lib/logger')('@owo/lib/hook');

const
hooks = new Map(),
reducers = new Map();

const
isHookImplemented = (name) => hooks.has(name),
isReducerImplemented = (name) => reducers.has(name);

// I gotta be honest, I picked these numbers at random.
// TODO: adjust based on benchmarks
const
HOOK_MAX_HOOKS = Math.pow(2, 64),
HOOK_MAX_IMPLEMENTATIONS = Math.pow(2, 64),
HOOK_MAX_CALL_STACK = Math.pow(2, 16);

// TODO: track "call depth" to throw a legible error
// whent there is a cycle. When there is a cycle
// (an invoked hook A triggers an implementation B that
// invokes the same hook A) somehow identify the cycle
// something like:
// let callDepth = 0;
// or:
// const depths = { id1: 0, ...}
// or:
// some third approach
const implementHook = (name, cb) => {

  if (Array.isArray(name)) {
    return name.map((hookName) => implementHook(hookName, cb));
  } else if (typeof name === 'string') {

    if (hooks.size >= HOOK_MAX_HOOKS) {
      throw new Error('Max hooks of %s exceeded. sealion dying', HOOK_MAX_HOOKS);
    }

    if (!hooks.has(name)) {
      hooks.set(name, new Map());
    }

    const implementations = hooks.get(name);

    if (implementations.size >= HOOK_MAX_IMPLEMENTATIONS) {
      throw new Error([
        'Max implmentations of %s for %s exceeded. sealion dying'
      ].join(' '), HOOK_MAX_IMPLEMENTATIONS, name);
    }

    let uniqueId

    // look for a unique ID until we found an unused one
    if (typeof cb === 'function') {

      do {
        uniqueId = crytpo.randomBytes(16).toString('base64');
      } while (implementations.has(uniqueId));

      hooks.get(name).set(uniqueId, cb);

      // not awaited
      invokeHook([
        'hookImplemented',
        `hook${pascalCase(name)}Implemented`
      ], name, [uniqueId]);

      return uniqueId;


    } else if (Array.isArray(cb)) {

      const uniqueIds = [];

      for(const f of cb) {

        if (typeof f != 'function') {
          throw new Error([
            `${name} implementation requires array of functions.`,
            `${typeof f} provided`,
          ].join(' '))
        }

        do {
          uniqueId = crytpo.randomBytes(16).toString('base64');
        } while (implementations.has(uniqueId));

        hooks.get(name).set(uniqueId, f);

        uniqueIds.push(uniqueId);

      }

      // not awaited
      invokeHook([
        'hookImplemented',
        `hook${pascalCase(name)}Implemented`
      ], name, uniqueIds);

      return uniqueIds;

    } else {

      throw Error('hooks require function or array of functions for implemenations');

    }

  } else {

    throw new Error('String or array expected for implemented hook name');

  }
}

const implementReduce = (name, cb) => {

  if (typeof cb !== 'function') {
    throw new Error(`hook implementation for ${name} requires function`);
  }

  if (Array.isArray(name)) {
    name.forEach((reducerName) => implementReduce(reducerName, cb));
  } else if (typeof name === 'string') {

    if (reducers.size >= HOOK_MAX_HOOKS) {
      throw new Error('Max hooks of %s exceeded. sealion dying', HOOK_MAX_HOOKS);
    }

    if (!reducers.has(name)) {
      reducers.set(name, new Map());
    }

    const implementations = reducers.get(name);

    if (implementations.size >= HOOK_MAX_IMPLEMENTATIONS) {
      throw new Error([
        'Max implmentations of %s for %s exceeded. sealion dying'
      ].join(' '), HOOK_MAX_IMPLEMENTATIONS, name);
    }

    // look for a unique ID until we found an unused one
    if (typeof cb === 'function') {

      let uniqueId

      do {
        uniqueId = crytpo.randomBytes(16).toString('base64');
      } while (implementations.has(uniqueId));

      reducers.get(name).set(uniqueId, cb);

      // not awaited
      invokeHook([
        'reducerImplemented',
        `reducer${pascalCase(name)}Implemented`
      ], name, [uniqueId]);

      return uniqueId;

    } else if (Array.isArray(cb)) {

      const uniqueIds = [];

      for(const f of cb) {

        let uniqueId

        if (typeof f != 'function') {
          throw new Error([
            `${name} implementation requires array of functions.`,
            `${typeof f} provided`,
          ].join(' '))
        }

        do {
          uniqueId = crytpo.randomBytes(16).toString('base64');
        } while (implementations.has(uniqueId));

        reducers.get(name).set(uniqueId, f);

        uniqueIds.push(uniqueIds);

      }

      invokeHook([
        'reducerImplemented',
        `reducer${pascalCase(name)}Implemented`
      ], name, uniqueIds);

    } else {

      throw Error('hooks require function or array of functions for implemenations');

    }


  } else {
    throw new Error('String or array expected for implemented reducer name');
  }
}

const removeHookImplementations = async (name, uniqueIds = []) => {

  if (!hook.has(name)) {
    logger.debug(`couldnt remove unique ids from hook %s. hook not found`, name);
    return false;
  }

  for (const uniqueId of uniqueIds) {
    hook.get(name).delete(uniqueId);
  }

  return true;

}

const removeHookImplementation = async (name, uniqueId) => {
  return removeHookImplementations(name, [uniqueId]);
};

const removeReducerImplementations = async (name, uniqueIds = []) => {

  if (!reducers.has(name)) {
    logger.debug(`couldnt remove unique ids from reducer %s. reducer not found`, name);
    return false;
  }

  for (const uniqueId of uniqueIds) {
    reducers.get(name).delete(uniqueId);
  }

  return true;

};

const removeReducerImplementation = async (name, uniqueId) => {
  return removeReducerImplementations(name, [uniqueId]);
};

// hooks are async by default, but you do sometimes (at startup)
// need to run a hook or reducer in a global context and it makes
// sense to just run it synchronized.

const invokeHookSync = (name, ...args) => {

  if (Array.isArray(name)) {
    const finishedHooks = name
      .map((hookName) => invokeHookSync(hookName, ...args));
  } else if (typeof name !== 'string') {
    throw new Error('name of hook must be an array of strings, or string');
  }

  if (!hooks.has(name)) {
    return false;
  }

  const hookFns = hooks.get(name)

  for(const fn of hookFns.values()) {

    fn(...args);

  }

  return true;

};

const invokeReduceSync = (name, ...args) => {

  if (Array.isArray(name)) {

    const reducedValues = name.map((reducerName) => {
      return invokeReduceSync(reducerName, acc, ...args)
    });

    return reducedValues;

  } else if (typeof name !== 'string') {

    throw new Error(`expected reducer name to be string or Array, got ${typeof name}`);

  }

  if (!reducers.has(name)) {
    return resolve(acc);
  }

  const reducerFns = reducers.get(name);

  let nextAcc = acc;

  for(const fn of reducerFns.values()) {

    const val = fn(nextAcc, ...args);

    // I expect this will be a super common mistake (not returning
    // a value in a reducer implementation. here is some help)
    if (val === undefined) {
      logger.warn([
        'undefined value returned from %s implementation.',
        'This is most likely a mistake!'
      ].join(' '), name);
    }

    nextAcc = val;

  }

  return nextAcc;

};

const invokeHook = async (name, ...args) => {

  if (Array.isArray(name)) {
    const finishedHooks = name
      .map((hookName) => invokeHook(hookName, ...args));
    return Promise.all(finishedHooks);
  } else if (typeof name !== 'string') {
    throw new Error('name of hook must be an array of strings, or a string');
  }

  return new Promise(async (resolve, reject) => {

    if (!hooks.has(name)) {
      return resolve(false);
    }

    const hookFns = hooks.get(name)

    for(const fn of hookFns.values()) {

      try {

        await fn(...args);

      } catch (error) {

        return reject(error);

      }

    }

    resolve(true);

  });

};

const invokeReduce = async (name, acc, ...args) => {

  if (Array.isArray(name)) {

    const reducedValues = name.map((reducerName) => {
      return invokeReduce(reducerName, acc, ...args)
    });

    return Promise.all(reducedValues);

  } else if (typeof name !== 'string') {

    throw new Error(`expected reducer name to be string or Array, got ${typeof name}`);

  }

  return new Promise(async (resolve, reject) => {

    if (!reducers.has(name)) {
      return resolve(acc);
    }

    const reducerFns = reducers.get(name);

    let nextAcc = acc;

    for(const fn of reducerFns.values()) {

      try {

        const val = await fn(nextAcc, ...args);

        // I expect this will be a super common mistake (not returning
        // a value in a reducer implementation. here is some help)
        if (val === undefined) {
          logger.warn([
            'undefined value returned from %s implementation.',
            'This is most likely a mistake!'
          ].join(' '), name);
        }

        nextAcc = val;

      } catch (error) {

        reject(error);

      }

    }

    resolve(nextAcc);

  });

};

// colloquially, a reducer is a hook of sorts. this will
// use a lookup object and a stack of tokens to greedily suggest
// a hook by name. returns null on no tokens provided or no matches
const suggestHook = (tokens = [], options = {}) => {

  const {
    prefix = '',
    suffix = '',
    lookupObj = {},
    nextKey = null,
    // can pass 'reducer'
    mode = 'hook',
  } = options;

  if (!tokens.length) {
    return null;
  }

  const [ fst, ...subTokens] = tokens;

  const fstSuggestion = arrayToCamel([prefix, fst, suffix]);
  logger.debug(`checking suggestion for %s %s`, mode, fstSuggestion);
  // check if fst token works. if not, return null
  if (mode === 'hook') {
    if (!isHookImplemented(fstSuggestion, mode)) {
      return null;
    }
  } else if (mode === 'reducer') {
    if (!isReducerImplemented(fstSuggestion)) {
      logger.debug(`no such reducer as %s`, fstSuggestion)
      return null;
    }
  } else {
    throw new Error('must pass mode of "hook" or "reducer" to suggestHook');
  }

  // put the primary command in a stack, make a copy of sub args
  const lookupStack = [fst];

  // check if the current command has help (it should!)
  while (getIfSet(lookupObj, arrayToCamel(lookupStack))) {

    // convert stack to single camel-case string and
    // use it to look in help array and see if that command
    // defines subCommands
    const lookup = arrayToCamel(lookupStack);
    const next = getIfSet(lookupObj, lookup, {});
    const nextList = getIfSet(next, nextKey, []);
    const nextToken = subTokens.shift();

    // just use the present stack if next token not part
    // of a subcommand
    if (!nextToken || !nextList.includes(nextToken)) {
      logger.debug(`no more suggestions to check`);
      break;
    }

    // so now on first iteration, foo bar baz would check
    // if fooBarDefineCliArgs exists
    const possibleHookArray = [].concat([
      prefix,
      ...lookupStack,
      nextToken,
      suffix
    ]);

    // convert stack to camelCase
    const possibleHook = arrayToCamel(possibleHookArray);

    logger.debug(`checking suggestion for %s %s`, mode, possibleHook);
    // now check if that reducer is implemented, if it is
    // we push the token onto our stack, otherwise break
    if (mode === 'hook') {
      if (isHookImplemented(possibleHook, mode)) {
        lookupStack.push(nextToken);
      }
    } else if (mode === 'reducer') {
      if (isReducerImplemented(possibleHook)) {
        lookupStack.push(nextToken);
      }
    } else {
      break;
    }

  }

  return arrayToCamel([prefix, ...lookupStack, suffix]);

};

module.exports = {
  invokeHook,
  invokeHookSync,
  implementHook,
  invokeReduce,
  invokeReduceSync,
  implementReduce,
  isHookImplemented,
  isReducerImplemented,
  suggestHook,
};
