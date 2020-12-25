const {
  curry,
  decorate,
} = require('@owo/lib/func');

const {
  test
} = require('@owo/lib/test');

module.exports = test('@owo/lib/func', async (owo, args, ensure, logger) => {

  await ensure('curry', async () => {

    const fnA = (a, b, c) => a + b + c;

    await ensure('fnA = (a, b, c) => a + b + c');
    await ensure('fnA(3, 2, 1) === 6', fnA(3, 2, 1) === 6);

    const newFnA = curry(fnA, 3);

    await ensure('curry(fnA, 3)(2, 1)  === 6', newFnA(2, 1) === 6);

    const newFnB = curry(fnA, 3, 5);

    await ensure('curry(fnB, 3, 5)(1)  === 9', newFnB(1) === 9);

  });

  await ensure('decorate', async () => {

    const fnA = (fn, ...args) => {

      return [
        'head',
        fn(...args),
        'tail',
      ];

    };

    await ensure('decorate(fnA, fnB)');

    const fnB = (str) => str;

    const newFn = decorate(fnA, fnB);

    const arr1 = fnA(fnB, 'body');
    const arr2 = newFn('body');

    await ensure('decorate(fnA, fnB)(...args) === fnA(fnB, ...args)');

    for (i in arr1) {

      await ensure(`arr1[${i}] === arr2[${i}]`, arr1[i] === arr2[i]);

    }

  });

});
