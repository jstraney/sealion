const {
  test
} = require('@owo/lib/test');

const {
  reduceAnd,
} = require('@owo/lib/collection');

module.exports = test('@owo/lib/cache', async (owo, args, ensure) => {

  const { lib : { cache: { Cache } } } = owo;

  await ensure('Cache and MemoryCacheStrategy');

  const cache = new Cache('testCache', ['memoryCache']);

  const undefinedResult = cache.getValue('result');

  await ensure('cached result undefined', undefinedResult === undefined);

  await cache.setValue('result', 1 + 1);

  const result = cache.getValue('result');

  await ensure('cached result returned', result === 2);

  await cache.setValue('resultOf9', 3 * 3);

  await cache.invalidate('result');

  const undefinedResultAgain = cache.getValue('result');

  await ensure('exactly one cached key removed', undefinedResultAgain === undefined);

  const resultOf9 = cache.getValue('resultOf9');

  await ensure('because only other key still extant', resultOf9 === 9);

  const inserts = ['foo', 'bar', 'baz', 'lol'];

  await Promise.all(inserts.map((str, i) => cache.setValue(`key${i}`, str)));

  const doneInserts = await Promise.all(inserts.map((str, i) => cache.getValue(`key${i}`)));

  const didInsertAll = reduceAnd(inserts.map((str, i) => doneInserts[i] === str));
  await ensure('inserted many keys', didInsertAll);

  await cache.flush();

  const nextInserts = await Promise.all(inserts.map((str, i) => cache.getValue(`key${i}`)));
  const didFlush = reduceAnd(nextInserts.map((_, i) => nextInserts[i] === undefined));
  await ensure('flushed cache missing values', didFlush);

});
