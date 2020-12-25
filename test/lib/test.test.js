const {
  test,
} = require('../../lib/test');

module.exports = test('lib/test', async (owo, args, ensure) => {

  // semantically the test below is kind of nonsense, but is just
  // to check printing and order of unit tests in sealion.
  const a = 2, b = 2;

  await ensure('Assignment Operator Works', async () => {
    await ensure('When this runs: a = b');
    await ensure('And a !== 3', a !== 3);
    await ensure('And b !== "foo"', a !== 'foo');
    await ensure('And a === b', a === b);

    await ensure('Weird Stuff Happens', async () => {
      await ensure('When you run: 3 + "4"');
      await ensure('3 + "4" !== 7', 3 + '4' !== 7);
      await ensure('3 + "4" === 34', 3 + '4' === '34');
    });

  });

  await ensure('a === b', () => a === b);

});
