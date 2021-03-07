/* globals require */

const runTests = require('../src/run-tests');
const deepEqual = require('../build/main');

const t = {
  true: () => {},
  false: () => {},
};
function test(name, callback) {
  callback(t);
}

runTests(test, deepEqual);
