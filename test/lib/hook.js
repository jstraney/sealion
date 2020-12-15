const {
  invokeHook,
  invokeReduce,
  implementHook,
  implementReduce,
} = require('../../lib/hook');

const logger = require('../../lib/logger')('Test libHook');

const assert = require('assert');

module.exports = async () => {

  // implement callbacks should register and run in order
  implementReduce('testReduce', async (a) => {
    return a + ' days grace is not a good band';
  });

  implementReduce('testReduce', async (a) => {
    return a + ' im not sorry';
  });

  implementReduce('testReduce2', async (a) => {
    return a === 3;
  });

  // running a single reduce returns a single value
  const reduceResult = await invokeReduce('testReduce', 3);

  assert(reduceResult === '3 days grace is not a good band im not sorry');

  // running array of reduces returns
  const [
    reduceResult2,
    reduceResult3,
  ] = await invokeReduce(['testReduce', 'testReduce2'], 3);

  assert(reduceResult2 === '3 days grace is not a good band im not sorry');
  assert(reduceResult3 === true);

  // running an unimplemented reducer returns passed value (default)
  const reduceResult4 = await invokeReduce('noSuchReducer', 10);

  assert(reduceResult4 === 10);

  // hooks return no value but should run in order
  const testState = {};

  implementHook('testHook', async (key, value) => {

    testState[key] = value;

  });

  await invokeHook('testHook', 'thank', 'you');

  assert(testState.thank === 'you');

  implementHook('testHook', async (key, value) => {

    testState[key] += ' means thank you very much';
    testState[value] = key;

  });

  // both hooks shold have run.
  await invokeHook('testHook', 'vielen', 'dank');

  assert(testState.vielen === 'dank means thank you very much');
  assert(testState.dank === 'vielen');

  // you can bind an implementation to multiple hooks/reducers
  implementHook(['testHook2', 'testHook3'], (key, value) => {
    if (testState[key]) {
      testState[key] += value;
    } else {
      testState[key] = value;
    }
  });

  await invokeHook('testHook2', 'sum', 1);
  assert(testState.sum === 1);

  await invokeHook('testHook3', 'sum', 1);
  assert(testState.sum === 2);

  await invokeHook(['testHook2', 'testHook3'], 'sum', 1);
  assert(testState.sum === 4);

  logger.info('all hook tests passed')

};
