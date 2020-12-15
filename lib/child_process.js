const bluebird = require('bluebird');
module.exports = bluebird.promisifyAll(require('child_process'));
