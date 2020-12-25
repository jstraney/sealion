const {
  invokeHook,
  invokeReduce,
  implementHook,
  implementReduce,
} = require('../../lib/hook');

const {
  test,
} = require('../../lib/test');

module.exports = test('lib/hook', async (owo, args, ensure) => {

  // implement callbacks should register and run in order
  implementReduce('testReduce', async (a) => {
    return a + 2;
  });

  implementReduce('testReduce', async (a) => {
    return a * 3;
  });

  implementReduce('testReduce2', async (a) => {
    return a === 3;
  });

  // running a single reduce returns a single value
  const reduceResult = await invokeReduce('testReduce', 3);

  await ensure('reducer runs in order', reduceResult === 15);

  // running array of reduces returns
  const [
    reduceResult2,
    reduceResult3,
  ] = await invokeReduce(['testReduce', 'testReduce2'], 3);

  await ensure('reducers run independently', async () => {
    await ensure('first result is 15', reduceResult2 === 15)
    await ensure('second result is true', reduceResult3 === true);
  });

  // running an unimplemented reducer returns passed value (default)
  const reduceResult4 = await invokeReduce('noSuchReducer', 10);

  await ensure('reducer returns default value', reduceResult4 === 10);

  // hooks return no value but should run in order
  const testState = {};

  implementHook('testHook', async (key, value) => {

    testState[key] = value;

  });

  await invokeHook('testHook', 'thank', 'you');

  await ensure('hooks callbacks are invoked by name', testState.thank === 'you');

  implementHook('testHook', async (key, value) => {

    testState[key] += ' much';

  });

  await invokeHook('testHook', 'thank', 'you very');

  await ensure('both hooks run');
  await ensure('state shows both hooks ran', testState.thank === 'you very much');

  // you can bind an implementation to multiple hooks/reducers
  implementHook(['testHook2', 'testHook3'], (key, value) => {
    if (testState[key]) {
      testState[key] += value;
    } else {
      testState[key] = value;
    }
  });

  await invokeHook('testHook2', 'sum', 1);
  await ensure('only first hook runs', testState.sum === 1);

  await invokeHook('testHook3', 'sum', 1);
  await ensure('only second hook runs', testState.sum === 2);

  await invokeHook(['testHook2', 'testHook3'], 'sum', 1);
  await ensure('both hooks run', testState.sum === 4);

});
