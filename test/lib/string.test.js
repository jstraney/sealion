const {
  rtrim,
  ltrim,
  trim,
  pad,
  lpad,
  rpad,
  list,
  arrayToCamel,
} = require('@owo/lib/string');

const {
  test,
} = require('@owo/lib/test');

module.exports = test('@owo/lib/string', async (owo, args, ensure) => {

  await ensure('Testing trim functions (ltrim, rtrim, trim)', async (logger) => {

    await ensure('Should default to trailing white space', async () => {

      const testStr = '   we are falling apart   ';

      logger.info('str = "%s"', testStr);

      logger.info('ltrim(str) === "we are falling apart   "');
      await ensure(ltrim(testStr) === 'we are falling apart   ');

      logger.info('rtrim(str) === "   we are falling apart"');
      await ensure(rtrim(testStr) === '   we are falling apart');

      logger.info('trim(str) === "we are falling apart"');
      await ensure(trim(testStr) === 'we are falling apart');

    });

    await ensure('Should escape regular expression characters', async () => {

      const testStr2 = '++++try to trim this++++';
      logger.info('str2 = "%s"', testStr2)

      logger.info('ltrim(str2, "+") === "try to trim this++++"');
      await ensure(ltrim(testStr2, '+') === 'try to trim this++++');

      logger.info('rtrim(str2, "+") === "++++try to trim this"');
      await ensure(rtrim(testStr2, '+') === '++++try to trim this');

      logger.info('trim(str2, "+") === "try to trim this"');
      await ensure(trim(testStr2, '+') === 'try to trim this')

    });

  });

  await ensure('Testing pad functions (pad, lpad, rpad)', async (logger) => {

    const testStr3 = 'hunch';

    await ensure('Should default to padding a single ASCII space', async () => {

      logger.info('str3 = %s', testStr3);

      logger.info('lpad(str3) === " %s"', testStr3);
      await ensure(lpad(testStr3) === ' hunch');

      logger.info('rpad(str3) === "%s "', testStr3);
      await ensure(rpad(testStr3) === 'hunch ');

      logger.info('pad(str3) === " %s "', testStr3);
      await ensure(pad(testStr3) === ' hunch ');

    });

    await ensure('Should allow custom character to be passed', async () => {

      logger.info('lpad(str3, "-") === "-%s"');
      await ensure(lpad(testStr3, '-') === '-hunch');

      await ensure(rpad(testStr3, '-') === 'hunch-');

      logger.info('pad(str3, "-") === "-%s-"');
      await ensure(pad(testStr3, '-') === '-hunch-');

    });

    await ensure('Should allow number of repeats to be passed', async () => {

      logger.info('lpad(str3, "-", 3) === "---%s"');
      await ensure(lpad(testStr3, '-', 3) === '---hunch');

      logger.info('rpad(str3, "-", 3) === "%s---"');
      await ensure(rpad(testStr3, '-', 3) === 'hunch---');

      logger.info('pad(str3, "-", 3) === "---%s---"');
      await ensure(pad(testStr3, '-', 3) === '---hunch---');

    });

  });

  await ensure('Testing list', async () => {
    const arr1 = [];
    await ensure('empty array produces empty string', list(arr1) === '');

    arr1.push('foo');
    await ensure('single element returns just the element', list(arr1) === 'foo');

    arr1.push('bar');
    await ensure('for n > 1, a neatly comma separated list', list(arr1) === 'foo, bar');

    arr1.push('baz');
    await ensure('list(["foo", "bar", "baz"]) === "foo, bar, baz"', list(arr1) === 'foo, bar, baz');

  });

  await ensure('Testing arrayToCamel', async () => {
    const arr = ['FOO', 'bar-bar', 'baZ'];
    await ensure('Maps an array of strings to one camel case string');
    await ensure(arrayToCamel(arr) === 'fooBarBarBaz');
  });

});
