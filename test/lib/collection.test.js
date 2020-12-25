const {
  collapseObjects,
  arrayToLookup,
  getIfSet,
  uniqueElements,
} = require('@owo/lib/collection');

const {
  test,
} = require('@owo/lib/test');

module.exports = test('@owo/lib/collection', async (owo, args, ensure) => {

  await ensure('Testing collapseObjects',  async () => {

    const collapsed = collapseObjects([
      { foo: 'bar' },
      { bar: 'foo' },
      { foo: 10, baz: 'bar' },
    ]);

    await ensure('foo overwritten', collapsed.foo === 10);
    await ensure('collapsed.bar === "foo"', collapsed.bar === 'foo');
    await ensure('colapsed.baz === "bar"', collapsed.baz === 'bar');

  });

  await ensure('Testing arrayToLookup', async (logger) => {

    const arr = ['foo', 'bar', 'baz', 'baz'];
    const lookup = arrayToLookup(arr);

    logger.info('arr = %o', arr);
    logger.info('lookup = %o', lookup);
    logger.info('lookup should have keys foo, bar, and baz');

    await ensure('has key foo', lookup.hasOwnProperty('foo'));
    await ensure('has key bar', lookup.hasOwnProperty('bar'));
    await ensure('has key baz', lookup.hasOwnProperty('baz'));

    logger.info('lookup values for those keys should be boolean true');

    await ensure('lookup.foo === true', lookup.foo === true);
    await ensure('lookup.bar === true', lookup.bar === true);
    await ensure('lookup.baz === true', lookup.baz === true);

  });

  await ensure('Testing getIfSet', async () => {

    const obj = { foo: 'bar', baz: 'foo' };
    await ensure('safely returns property value of object', getIfSet(obj, 'foo') === 'bar');
    await ensure('returns null if not set', getIfSet(obj, 'lol') === null);
    await ensure('a different default value can be returned', getIfSet(obj, 'lol', 5) === 5);

  });

  await ensure('Testing uniqueElements', async () => {
    const arr = ['foo', 'bar', 'foo', 'foo', 'baz', 'bar'];
    const nextArr = uniqueElements(arr);
    await ensure('has three elements', nextArr.length === 3);
    for (let i = 0; i < nextArr.length; i++) {
      for (let j = 0; j < nextArr.length; j++) {
        if (i === j) continue;
        await ensure(`arr[${i}] !== arr[${j}]`, nextArr[i] !== nextArr[j]);
      }
    }

  });

});
