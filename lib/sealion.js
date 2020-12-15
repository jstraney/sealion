const
fs = require('fs'),
path = require('path');

const requireDir = require('require-dir');

const {
  collapseObjects
} = require('./util');

const cache = {};

const sealionRequireBranch = (dir, pattern) => {

  const cacheKey = dir.concat(':', pattern);

  if (cache.hasOwnProperty(cacheKey)) {
    return cache[cacheKey];
  }

  const results = {};

  // require dir will actually return a tree
  // but we actually want a collapsed object of unique names
  try {
    requireDir(dir, {
      filter: (abs) => {
        return fs.statSync(abs).isDirectory() || pattern.test(abs);
      },
      mapKey: (value, baseName) => {
        if (typeof value === 'function') {
          results[baseName.split('.').shift()] = value;
        }
        return '_';
      },
    });
  } catch (error) {

    if (error.code === 'ENOENT') {
      return {};
    }

    console.error(error);

  }

  cache[cacheKey] = results;

  return results;

};

const sealionRequire = (rel = '', pattern) => {

  // may not be in a sealion project
  const validSealionPaths = [
    sealionCorePath(rel),
    sealionProjectPath(rel),
  ].filter((slPath) => slPath !== null);

  // find all exported functions in paths
  const objects = validSealionPaths
    .map((slPath) => sealionRequireBranch(slPath, pattern))

  // collapse into single object
  return collapseObjects(objects);

};

const sealionRequireInList = (tokens = [], rel = '', trailingExp = '') => {
  const
  fst = tokens.length ? tokens.join('|') : '.*',
  fullExp = fst.concat(trailingExp);
  return sealionRequire(rel, new RegExp(fullExp));
};

const sealionRequireClis = (plugins = []) => {
  return sealionRequireInList(plugins, 'bin', '\\.js$');
};

const sealionRequirePlugins = (plugins = []) => {
  return sealionRequireInList(plugins, 'bin', '\\.js$');
};

const sealionCorePath = (rel = '') => {
  return path.join(process.env.SEALION_CORE_DIR, rel);
}

const sealionProjectPath = ( rel = '') => {
  return process.env.SEALION_PROJECT_DIR
    ? path.join(process.env.SEALION_PROJECT_DIR, rel)
    : null;
}

const sealionUninstallPlugin = () => {
  // stub
}


const sealionInstallPlugin = () => {
  // stub
}

module.exports = {
  sealionCorePath,
  sealionInstallPlugin,
  sealionProjectPath,
  sealionRequire,
  sealionRequireBranch,
  sealionRequireClis,
  sealionUnstallPlugin,
};
