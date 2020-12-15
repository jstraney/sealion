const {
  pascalCase,
} = require('./util');

const logger = require('./logger')('libHook');

// TODO: find a way to trigger a clean of some
// reducer results
const reducerResultCache = {};

const
hooks = {},
reducers = {};

const implementHook = (name, cb) => {
  if (Array.isArray(name)) {
    name.forEach((hookName) => implementHook(hookName, cb));
  } else if (typeof name === 'string') {
    hooks[name] = hooks[name] || [];
    hooks[name].push(cb);
  } else {
    throw new Error('String or array expected for implemented hook name');
  }
}

const implementReduce = (name, cb) => {
  if (Array.isArray(name)) {
    name.forEach((reducerName) => implementReduce(reducerName, cb));
  } else if (typeof name === 'string') {
    reducers[name] = reducers[name] || [];
    reducers[name].push(cb);
  } else {
    throw new Error('String or array expected for implemented reducer name');
  }
}


implementHook('clearReducerCache', (reducerName) => {

  if (reducerResultCache.hasOwnProperty(reducerName)) {

    delete reducerName;

    // This is where I'm uncertain the best way to re-invoke the reducer.
    // this seems tennable for now.
    //
    // by implementing hook reducerCacheRebuild, you can re-invoke necessary
    // reducers.
    const specificReducerCache = ['rebuild', pascalCase(reducerName), 'Cache'].join;

    // NOTE: runs in async. I am thinking this is good.
    invokeHook([
      'rebuildReducerCache',
      specificReducerCache
    ], reducerName);

  }

});

const invokeHook = async (name, ...args) => {

  if (Array.isArray(name)) {
    const finishedHooks = name
      .map((hookName) => invokeHook(hookName, ...args));
    return Promise.all(finishedHooks);
  } else if (typeof name !== 'string') {
    throw new Error('name of hook must be an array of strings, or string');
  }

  return new Promise(async (resolve, reject) => {

    const hookFns = hooks[name] || [];

    for(let i = 0; i < hookFns.length; i++) {

      const fn = hookFns[i];

      try {

        await fn(...args);

      } catch (error) {

        reject(error);

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

    /*
    // TODO: determine if caching logic can exist here
    // (probably not!)
    if (reducerResultCache.hasOwnProperty(name)) {

      logger.info(`using cached reducer result for ${name}`);

      return resolve(reducerResultCache[name].result);

    }
    */

    const reducerFns = reducers[name] || [];

    let nextAcc = acc;

    for(let i = 0; i < reducerFns.length; i++) {

      const fn = reducerFns[i];

      try {

        nextAcc = await fn(nextAcc, ...args);

      } catch (error) {

        reject(error);

      }

    }

    reducerResultCache[name] = {
      result: nextAcc,
      args,
    };

    resolve(nextAcc);

  });

};

module.exports = {
  invokeHook,
  implementHook,
  invokeReduce,
  implementReduce,
};
