const
fs = require('fs'),
path = require('path');

// TODO: consider replacing with recursive-readdir
const requireDir = require('require-dir');

const {
  collapseObjects,
} = require('./collection');

const {
  list,
  trim,
  ltrim,
} = require('./string');

const logger = require('./logger')('@owo/lib/loader');

const isInOwoCorePath = (abs = process.env.PWD) => {

  const corePath = owoCorePath();

  return corePath !== null
    ? abs.startsWith(corePath)
    : false;

};

const isInOwoProjectPath = (abs = process.env.PWD) => {

  const projectPath = owoProjectPath();

  return projectPath !== null
    ? abs.startsWith(projectPath)
    : false;

};

const owoCorePath = (rel = '') => {

  return process.env.SEALION_CORE_DIR
    ? path.join(process.env.SEALION_CORE_DIR, rel)
    : null;

}

const owoProjectPath = ( rel = '') => {
  return process.env.SEALION_PROJECT_DIR
    ? path.join(process.env.SEALION_PROJECT_DIR, rel)
    : null;
}

// given a dir and a pattern, return all files
// that match pattern and expose a function.
const _recursiveRequire = (dir, ordered = [], pattern) => {

  // catches the absolute paths so they may be
  // required in the order passed
  const buffer = {};

  // check recursivley in the relative dir
  logger.silly('recursively requiring %s in %s', pattern, dir);

  // TODO consider a simple filesystem iterrator instead of
  // require-dir module. One of the reasons we are using the
  // approach below is to load plugins/assets in order!
  try {
    requireDir(dir, {
      filter: (abs) => {

        const isDirectory = fs.statSync(abs).isDirectory();

        const tail = ltrim(abs, dir);

        if (!isDirectory && pattern.test(tail)) {

          const [distinctPath,,] = abs.split('.');
          const distinctName = distinctPath.split('/').pop();

          buffer[distinctName] = path.relative(__dirname, abs);

        }

        return isDirectory;

      },
      mapKey: (value, baseName) => {
        // we are not actually requiring any files!
        // just scanning directories, and grabbing matched abs paths
        // when there is a match
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

  const results = {};

  // theres been no list of assets provided. load using the buffer keys
  // PLEASE BE AWARE OF THIS FACT. if you do not pass an array of assets
  // (plugins, installs, infos) sealion will just assume the order does not
  // matter when requiring all of them.
  if (!ordered.length) {
    for (const assetName in buffer) {
      const modulePath = buffer[assetName];
      if (!modulePath) continue;
      logger.silly('requiring %s from %s', assetName, modulePath);
      results[assetName] = require(modulePath);
    }
  } else {
    // load the assets in order provided
    for (const assetName of ordered) {
      const distinctName = assetName.split('/').pop();
      const modulePath = buffer[distinctName];
      if (!modulePath) continue;
      logger.silly('requiring %s from %s', distinctName, modulePath);
      results[distinctName] = require(modulePath);
    }
  }

  return results;

};

const
OWO_REQUIRE_CORE_ONLY = 0,
OWO_REQUIRE_PROJECT_ONLY = 1,
OWO_REQUIRE_ALL = 2;

// owoRequire will load matching node modules recursively
// from a relative directory from the owoCorePath and
// the projectPath
const owoRequire = (relDir, subDirs = [], tailPattern = '$', mode = OWO_REQUIRE_ALL) => {

  // may not be running owo command inside installed project
  const owoPaths = [];

  if (mode === OWO_REQUIRE_ALL) {
    owoPaths.push(owoCorePath(relDir), owoProjectPath(relDir));
  } else if (mode === OWO_REQUIRE_CORE_ONLY) {
    owoPaths.push(owoCorePath(relDir));
  } else if (mode === OWO_REQUIRE_PROJECT_ONLY) {
    owoPaths.push(owoProjectPath(relDir));
  }

  // remove leading trailing slashes from names
  const nextDirs = subDirs.map((str) => trim(str, '/'));

  const validowoPaths = owoPaths.filter((slPath) => slPath !== null);

  const completePattern = nextDirs.length
    ? ['\/(', nextDirs.join('|'), ')', tailPattern].join('')
    : ['\/.*', tailPattern].join('')

  // find all exported functions in paths
  const objects = validowoPaths
    .map((slPath) => _recursiveRequire(slPath, nextDirs, new RegExp(completePattern)))

  // collapse into single object
  return collapseObjects(objects);

};


// Please be aware that the owoRequire* functions will happily
// require the files regardless of the databases plugin enabled status.

// To that end, you shouldn't call these directly, as they are already
// called from the context of /bin/owo

// loads bootstrapped cli interface for installing managing owo
// projects
const owoRequireCoreClis = () => {
  return owoRequire('bin', [], '\\.cli\\.js$', OWO_REQUIRE_CORE_ONLY);
};

// loads clis found in plugin directories. can specify core or project
const owoRequirePluginClis = (plugins = [], mode = OWO_REQUIRE_ALL) => {
  return owoRequire('plugin', plugins, '\\.cli\\.js$', mode);
};

// loads clis found in plugin directories. can specify core or project
const owoRequireProjectClis = (plugins = [], mode = OWO_REQUIRE_PROJECT_ONLY) => {
  return owoRequire('plugin', plugins, '\\.cli\\.js$', mode);
};

// exposes hooks
const owoRequirePlugins = (plugins = [], mode = OWO_REQUIRE_ALL) => {
  return owoRequire('plugin', plugins, '\\.plugin\\.js$', mode);
};

// loads install
const owoRequirePluginInstalls = (plugins = [], mode = OWO_REQUIRE_ALL) => {
  return owoRequire('plugin', plugins, '\\.install\\.js$', mode);
};

const owoRequireInfos = (plugins = [], mode = OWO_REQUIRE_ALL) => {
  return owoRequire('plugin', plugins, '\\.info\\.js$', mode);
};

const owoRequireProjectTests = ( tests = []) => {
  return owoRequire('test', tests, '\\.test\\.js$', OWO_REQUIRE_PROJECT_ONLY);
};

const owoRequireCoreTests = (tests = []) => {
  return owoRequire('test', tests, '\\.test\\.js$', OWO_REQUIRE_CORE_ONLY);
};

// can be used on infos, plugins, installs
const owoAssertAssetLoaded = (type = null, assets = {}, required = []) => {

  if (!type) {
    throw Error('type must be specified to check if asset has loaded');
  }

  // check that all .info.js files could be fetched
  for (const assetName of required) {

    if (!assets.hasOwnProperty(assetName)) {
      throw new Error([
        `${type} for ${assetName} could not be found.`,
        `ensure that ${assetName}.${type}.js exists.`,
      ].join(' '));
    }
  }

}


module.exports = {
  OWO_REQUIRE_ALL,
  OWO_REQUIRE_CORE_ONLY,
  OWO_REQUIRE_PROJECT_ONLY,
  isInOwoCorePath,
  isInOwoProjectPath,
  owoAssertAssetLoaded,
  owoCorePath,
  owoProjectPath,
  owoRequire,
  owoRequireCoreClis,
  owoRequireProjectClis,
  owoRequireCoreTests,
  owoRequireInfos,
  owoRequirePluginClis,
  owoRequireProjectClis,
  owoRequirePluginInstalls,
  owoRequirePlugins,
  owoRequireProjectTests,
};
