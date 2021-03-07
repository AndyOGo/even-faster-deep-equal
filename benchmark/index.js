/* globals console, require */
'use strict';

const assertDeepStrictEqual = require('assert').deepStrictEqual;
const runTests = require('../src/run-tests');
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

const equalPackages = {
  'even-faster-deep-equal': require('../build/main'),
  'react-fast-compare': true,
  'fast-deep-equal': require('fast-deep-equal'),
  'fast-deep-equal/es6': require('fast-deep-equal/es6'),
  'fast-equals': require('fast-equals').deepEqual,
  'nano-equal': true,
  'shallow-equal-fuzzy': true,
  'underscore.isEqual': require('underscore').isEqual,
  'lodash.isEqual': require('lodash').isEqual,
  'deep-equal': true,
  'deep-eql': true,
  'ramda.equals': require('ramda').equals,
  'util.isDeepStrictEqual': require('util').isDeepStrictEqual,
  'assert.deepStrictEqual': (a, b) => {
    try {
      assertDeepStrictEqual(a, b);
      return true;
    } catch (e) {
      return false;
    }
  },
};

for (const equalName in equalPackages) {
  let equalFunc = equalPackages[equalName];
  if (equalFunc === true) equalFunc = require(equalName);

  runTests(testWithAssert, equalFunc);

  suite.add(equalName, function () {
    runTests(test, equalFunc);
  });
}

console.log();

suite
  .on('cycle', (event) => console.log(String(event.target)))
  .on('complete', function () {
    console.log('The fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });

function testWithAssert(name, callback) {
  const t = {
    true: (value) => console.assert(value === true, name),
    false: (value) => console.assert(value === false, name),
  };

  callback(t);
}

const t = {
  true: () => {},
  false: () => {},
};
function test(name, callback) {
  callback(t);
}
