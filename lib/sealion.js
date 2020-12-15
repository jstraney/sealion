const
fs = require('fs'),
path = require('path');

const requireDir = require('require-dir');

const {
  collapseObjects
} = require('./util');

const cache = {};

const logger = require('./logger')('libSealion');

// given a dir and a pattern, return all files
// that match pattern and expose a function.
const recursiveRequire = (dir, pattern) => {

  logger.info('recusively requiring %s in %s', pattern, dir);

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

          const uniqueName = baseName.split('.').shift();

          if (results.hasOwnProperty(uniqueName)) {
            throw new Error([
              `duplicate plugin/required entry found "${uniqueName}".`,
              `Ensure you are not reusing the name of a core sealion plugin.`
            ].join(' '));
          } else {
            results[uniqueName] = value;
          }
        }
        return '_';
      },
      recurse: true,
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

// sealionRequire will load matching node modules recursively
// from a relative directory from the sealionCorePath and
// the projectPath
const sealionRequire = (relDir, subDirs = [], tailPattern = '$', coreOnly = false) => {

  // may not be running sealion command inside installed project
  const sealionPaths = [
    sealionCorePath(relDir),
  ];

  if (!coreOnly) {
    sealionPaths.push(sealionProjectPath(relDir));
  }

  const validSealionPaths = sealionPaths.filter((slPath) => slPath !== null);

  const completePattern = subDirs.length
    ? ['(', subDirs.join('|'), ')/', tailPattern].join('')
    : ['.*', tailPattern].join('')

  // find all exported functions in paths
  const objects = validSealionPaths
    .map((slPath) => recursiveRequire(slPath, new RegExp(completePattern)))

  // collapse into single object
  return collapseObjects(objects);

};

// loads bootstrapped cli interface for installing managing sealion
// projects
const sealionRequireCoreClis = () => {
  return sealionRequire('bin', [], '\\/.*\\.cli\\.js$', true);
};

// loads clis found in plugin directories.
const sealionRequirePluginClis = (plugins = []) => {
  return sealionRequire('plugin', plugins, '\\/.*\\.cli\\.js$');
};

// exposes hooks
const sealionRequirePlugins = (plugins = []) => {
  return sealionRequire('plugin', plugins, '\\/.*\\.plugin\\.js$');
};

// loads install
const sealionRequireInstalls = (plugins = []) => {
  return sealionRequire('plugin', plugins, '\\/.*\\.install\\.js$');
};

const sealionRequireUninstalls = (plugins = []) => {
  return sealionRequire('plugin', plugins, '\\/.*\\.uninstall\\.js$');
};

/* expections:
 * const plugins = sealionRequirePlugins(['user', 'blogPost', 'oauth2']);
 * const clis = sealionRequireClis(['blogPost', 'oauth2']);
 * plugin.js in <path to installed sealion>/plugin/user/user.plugin.js
 * plugin.js in <path project>/plugin/user/user.plugin.js
 * passing no array would do all
 */

const sealionCorePath = (rel = '') => {

  return process.env.SEALION_CORE_DIR
    ? path.join(process.env.SEALION_CORE_DIR, rel)
    : null;

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
  sealionRequireCoreClis,
  sealionRequirePluginClis,
  sealionRequirePlugins,
  sealionRequireInstalls,
  sealionRequireUninstalls,
  sealionUninstallPlugin,
};
