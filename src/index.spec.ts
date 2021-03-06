import test from 'ava';

import deepEqual from './index';

const primitives = [
  undefined,
  null,
  true,
  false,
  0,
  1,
  '',
  'foo',
  {},
  [],
  /foo/g,
  Date.now(),
  new Date(),
  Symbol(),
];

test('it compares literal primitives', (t) => {
  primitives.forEach((primitive) => {
    t.true(deepEqual(primitive, primitive));
  });

  primitives.forEach((a) => {
    primitives.forEach((b) => {
      if (a !== b) {
        t.false(deepEqual(a, b));
      }
    });
  });
});

test('it compares empty arrays', (t) => {
  t.true(deepEqual([], []));
});

test('it compares array of literal primitives', (t) => {
  t.true(deepEqual(primitives, [...primitives]));
});

test('it compares nested arrays of literal primitives', (t) => {
  const mapNested = (_primitive: unknown, index: number) => [
    ...primitives.slice(0, index + 1),
  ];

  t.true(deepEqual(primitives.map(mapNested), primitives.map(mapNested)));
});

test('it compares empty objects', (t) => {
  t.true(deepEqual({}, {}));
});

test('it compares object of literal primitives', (t) => {
  const obj = primitives.reduce(
    (obj, primitive, index) => ({
      ...obj,
      [`foo-${index}`]: primitive,
    }),
    {}
  );

  t.true(deepEqual(obj, { ...obj }));
});

test('it compares regular expressions', (t) => {
  const patterns = ['foo', 'bar'];
  const flags = ['g', 'i', 'm', 's', 'u', 'y'];

  patterns.forEach((pattern) => {
    t.true(deepEqual(new RegExp(pattern), new RegExp(pattern)));

    flags.forEach((flag) => {
      t.true(deepEqual(new RegExp(pattern, flag), new RegExp(pattern, flag)));
    });
  });

  patterns.forEach((pattern, patternIndex) => {
    t.false(
      deepEqual(
        new RegExp(pattern),
        new RegExp(patterns[(patternIndex + 1) % patterns.length])
      )
    );

    flags.forEach((flag, flagIndex) => {
      t.false(
        deepEqual(
          new RegExp(pattern, flag),
          new RegExp(
            patterns[(patternIndex + 1) % patterns.length],
            flags[(flagIndex + 1) % flags.length]
          )
        )
      );
    });
  });
});

test('it compares dates', (t) => {
  const date = new Date();
  const dateClone = new Date(date.getTime());
  const dateDiff = new Date(date.getTime() + 1);

  t.true(deepEqual(date, dateClone));
  t.true(deepEqual([date], [dateClone]));
  t.true(deepEqual({ date: date }, { date: dateClone }));
  t.true(deepEqual({ date: [date] }, { date: [dateClone] }));
  t.true(deepEqual([{ date: date }], [{ date: dateClone }]));
  t.true(deepEqual([{ date: [date] }], [{ date: [dateClone] }]));

  t.false(deepEqual(date, dateDiff));
  t.false(deepEqual([date], [dateDiff]));
  t.false(deepEqual({ date: date }, { date: dateDiff }));
  t.false(deepEqual({ date: [date] }, { date: [dateDiff] }));
  t.false(deepEqual([{ date: date }], [{ date: dateDiff }]));
  t.false(deepEqual([{ date: [date] }], [{ date: [dateDiff] }]));
});

test('it compares symbols', (t) => {
  const foo = Symbol('foo');
  const fooCopy = Symbol('foo');
  const bar = Symbol('bar');

  t.true(deepEqual(foo, foo));
  t.false(deepEqual(foo, fooCopy));
  t.false(deepEqual(foo, bar));
});

test('it compares maps', (t) => {
  const map = new Map([
    ['key', 'value'],
    ['foo', 'bar'],
  ]);
  const mapCopy = new Map([
    ['key', 'value'],
    ['foo', 'bar'],
  ]);

  t.true(deepEqual(map, map));
  t.true(deepEqual(map, mapCopy));

  t.false(deepEqual(map, new Map()));
});

test('it compares empty maps', (t) => {
  t.true(deepEqual(new Map(), new Map()));
});

test('it compares sets', (t) => {
  const set = new Set([1, 2, 3, 4]);
  const setCopy = new Set([1, 2, 3, 4]);

  t.true(deepEqual(set, set));
  t.true(deepEqual(set, setCopy));

  t.false(deepEqual(set, new Map()));
});

test('it compares empty sets', (t) => {
  t.true(deepEqual(new Set(), new Set()));
});

test('compares array buffers', (t) => {
  const int32arr = new Int32Array([21, 31]);
  const int32arrCopy = new Int32Array([21, 31]);

  t.true(deepEqual(int32arr, int32arr));
  t.true(deepEqual(int32arr, int32arrCopy));

  t.false(deepEqual(int32arr, new Int32Array(0)));
});
