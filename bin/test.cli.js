const {
  list,
  trim,
} = require('@owo/lib/string')

const {
  implementReduce,
} = require('@owo/lib/hook');

const {
  isInOwoProjectPath,
  isInOwoCorePath,
  owoRequireCoreTests,
  owoRequireProjectTests,
} = require('@owo/lib/loader');

const logger = require('@owo/lib/logger')('@owo/bin/test');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  test: {
    description: [
      'Run unit tests on a plugin or on sealion core library.',
      'the --sealion option looks for tests under your globally installed',
      'sealion. Otherwise it will look in the current sealion project for',
      'a file named <plugin>.test.js',
    ].join(' '),
    usage: 'sealion test [--sealion] <plugin-name>',
    examples: [
      'sealion test my-plugin-name',
      'sealion test --sealion lib/util',
    ],
  }
}))

implementReduce('testDefineCliArgs', () => [
  { name: 'tests', type: String, defaultOption: true, multiple: true},
  { name: 'sealion', type: Boolean, defaultValue: false, description: 'test a sealion core library'},
  { name: 'all', type: Boolean, defaultValue: false, description: 'test every .test.js file'},
]);

module.exports = async (owo,  args = {} ) => {

  const {
    tests = [],
    sealion = false,
    all = false,
  } = args;

  // you must run 'sealion test --all' to leave out tests by name
  if (!all && !tests.length) {

    throw new Error('You have to specify a list of tests or run with --all');

  }

  let testModules;

  // if command specifically asks to run core tests,
  // find tests in sealion core
  if (sealion) {
    testModules = owoRequireCoreTests(tests);
  // if we are in the core directory, assume we want core tests
  } else if (isInOwoCorePath()) {
    testModules = owoRequireCoreTests(tests);
  // assume we want project tests if in project dir
  } else if (isInOwoProjectPath()) {
    testModules = owoRequireProjectTests(tests);
  }

  const numModules = Object.keys(testModules).length;

  if (numModules !== tests.length) {

    const missing = [], dupes = [], unique = {};

    for (testName of tests) {

      // e.g. foo/bar/baz => baz
      const canonicalName = trim(testName, '/').split('/').pop();

      if (unique.hasOwnProperty(canonicalName)) {
        dupes.push(canonicalName);
      } else {
        unique[canonicalName] = true;
      }

      if (!testModules.hasOwnProperty(canonicalName)) {
        missing.push(testName);
      }
    }

    // this implies that the test does not exist
    if (missing.length) {

      throw new Error(`Cannot find tests ${missing.join(', ')}.`)

    } else if (dupes.length) {

      throw new Error([
        `Duplicate tests found: ${dupes.join(', ')}.`,
        `Tests must have unique names.`
      ].join(' '));

    }

  }

  const success = [], fails = [];

  logger.info('Running tests for %s', list(tests));

  for (testName of tests ) {

    // e.g. foo/bar/baz => baz
    const canonicalName = trim(testName, '/').split('/').pop();

    const test = testModules[canonicalName];

    try {

      const result = await test(owo, args);

      success.push(result);

    } catch (error) {

      logger.error('%o', error);

      fails.push(error);

    }

  }

  return [
    `Ran ${tests.length} tests.`,
    `${success.length} tests completed.`,
    `${fails.length} failures.`,
    `${fails.length} failures.`,
  ].join(' ');

};
