const Logger = require('@owo/lib/logger');

const assert = require('assert');

// TODO: consider making ensurer return non-async function by default
// but allow async to be available (for testing async operations)

// just nice wrappers for logger.tab/logger.shiftTab
const test = (name, cb = null) => {

  if (!cb || typeof cb !== 'function') {
    throw new Error('test requires a function callback');
  }

  // cli context passes in the sealion global and cli args
  return async (owo, args) => {

    // we build a new logger for the test and
    // pass the logger and assert to the test callback
    const logger = Logger(`Testing ${name}`);
    logger.info(`Running tests for ${name}`);
    logger.tab();

    await cb(owo, args, ensurer(logger), logger);

    logger.shiftTab();
    logger.info(`Ran all tests for ${name}`);

  };

};

const ensurer = (logger) => {

  return async (label, cb) => {

    if (cb === undefined) {

      if (typeof label === 'string') {
        logger.info(`%s`, label);
      } else if (typeof lable === 'boolean') {
        logger.info(`%s`, label ? 'OK' : 'fail');
      }

    } else if (typeof cb === 'boolean') {

      // assert will throw an error if false
      try {

        assert(cb);

        logger.tab()

        logger.info(`%s : OK`, label);

        logger.shiftTab()

      } catch (error) {

        logger.tab()
        logger.shiftTab()

        throw error;

      }

    } else if (typeof cb === 'function') {

      logger.info('%s', label);
      logger.tab()
      await cb(logger);
      logger.shiftTab()

    }

  };

};

module.exports = {
  test,
};
