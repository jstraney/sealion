const [test = null] = process.argv.slice(2);

if (test === null) {
  throw new Error('must specify a test');
}

const path = require('path');

const dotenv = require('dotenv');

dotenv.config();

process.env.SEALION_CORE_DIR = path.resolve(__dirname, '..');

const db = require('../lib/db');

const testFn = require(path.join(__dirname, test));

(async () => {

  await testFn();

  // to prevent test from hanging
  db.destroy();

})();
