const hasMap = typeof Map === 'function';
const hasSet = typeof Set === 'function';
const hasSymbol = typeof Symbol === 'function';
const hasArrayBuffer =
  typeof ArrayBuffer === 'function' && !!ArrayBuffer.isView;

function runTests(test, deepEqual) {
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
    function () {},
    function foo() {},
    () => {},
    NaN,
  ];

  test('it compares literal primitives', (t) => {
    primitives.forEach((primitive) => {
      t.true(deepEqual(primitive, primitive));
    });

    primitives.forEach((a) => {
      primitives.forEach((b) => {
        if (a !== b && a === a && b === b) {
          t.false(deepEqual(a, b));
        }
      });
    });
  });

  test('it compares empty arrays', (t) => {
    t.true(deepEqual([], []));
  });

  test('it compares different length arrays', (t) => {
    t.false(deepEqual([], [1]));
    t.false(deepEqual([1], []));
    t.false(deepEqual([1], [1, 2]));
    t.false(deepEqual([1, 2], [1]));
  });

  test('it compares array of literal primitives', (t) => {
    t.true(deepEqual(primitives, [...primitives]));
  });

  test('it compares nested arrays of literal primitives', (t) => {
    const mapNested = (_primitive, index) => [
      ...primitives.slice(0, index + 1),
    ];

    t.true(deepEqual(primitives.map(mapNested), primitives.map(mapNested)));
  });

  test('it compares empty objects', (t) => {
    t.true(deepEqual({}, {}));
  });

  test('it compares different keys objects', (t) => {
    t.false(deepEqual({}, { foo: 'bar' }));
    t.false(deepEqual({ foo: 'bar' }, {}));
    t.false(deepEqual({ foo: 'bar' }, { bar: 'baz' }));
    t.false(deepEqual({ bar: 'baz' }, { foo: 'bar' }));
  });

  test('it compares object of literal primitives', (t) => {
    const obj = primitives.reduce(
      (obj, primitive, index) =>
        Object.assign(obj, {
          [`foo-${index}`]: primitive,
        }),
      {}
    );

    t.true(deepEqual(obj, Object.assign({}, obj)));
  });

  test('it compares regular expressions', (t) => {
    const patterns = ['foo', 'bar'];
    const flags = ['g', 'i', 'm', 's', 'u', 'y'];

    try {
      patterns.forEach((pattern) => {
        t.true(deepEqual(new RegExp(pattern), new RegExp(pattern)));

        flags.forEach((flag) => {
          t.true(
            deepEqual(new RegExp(pattern, flag), new RegExp(pattern, flag))
          );
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
      // eslint-disable-next-line no-empty
    } catch (error) {}
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

  if (hasSymbol) {
    test('it compares symbols', (t) => {
      const foo = Symbol('foo');
      const fooCopy = Symbol('foo');
      const bar = Symbol('bar');

      t.true(deepEqual(foo, foo));
      t.false(deepEqual(foo, fooCopy));
      t.false(deepEqual(foo, bar));
    });
  }

  if (hasMap) {
    test('it compares maps', (t) => {
      const map = new Map([
        ['key', 'value'],
        ['foo', 'bar'],
      ]);
      const mapCopy = new Map([
        ['key', 'value'],
        ['foo', 'bar'],
      ]);
      const mapFlipped = new Map([
        ['foo', 'bar'],
        ['key', 'value'],
      ]);
      const mapDiff = new Map([
        ['foo', 'baz'],
        ['key', 'value'],
      ]);

      t.true(deepEqual(map, map));
      t.true(deepEqual(map, mapCopy));
      t.true(deepEqual(map, mapFlipped));

      t.false(deepEqual(map, mapDiff));
      t.false(deepEqual(map, new Map()));
    });

    test('it compares empty maps', (t) => {
      t.true(deepEqual(new Map(), new Map()));
    });

    test('it compares different length maps', (t) => {
      t.false(deepEqual(new Map(), new Map([['key', 'value']])));
      t.false(deepEqual(new Map([['key', 'value']]), new Map()));
      t.false(
        deepEqual(
          new Map([['key', 'value']]),
          new Map([
            ['key', 'value'],
            ['foo', 'bar'],
          ])
        )
      );
      t.false(
        deepEqual(
          new Map([
            ['key', 'value'],
            ['foo', 'bar'],
          ]),
          new Map([['key', 'value']])
        )
      );
    });
  }

  if (hasSet) {
    test('it compares sets', (t) => {
      const set = new Set([1, 2, 3, 4]);
      const setCopy = new Set([4, 3, 2, 1]);
      const setDiff = new Set([1, 2, 5, 3]);

      t.true(deepEqual(set, set));
      t.true(deepEqual(set, setCopy));

      t.false(deepEqual(set, new Map()));
      t.false(deepEqual(set, setDiff));
    });

    test('it compares empty sets', (t) => {
      t.true(deepEqual(new Set(), new Set()));
    });

    test('it compares different length sets', (t) => {
      t.false(deepEqual(new Set(), new Set([1])));
      t.false(deepEqual(new Set([1]), new Set()));
      t.false(deepEqual(new Set([1]), new Set([1, 2])));
      t.false(deepEqual(new Set([1, 2]), new Set([1])));
    });
  }

  if (hasArrayBuffer) {
    test('compares array buffers', (t) => {
      const arrayBufferViews = [
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];

      arrayBufferViews.forEach((ArrayBufferView) => {
        const arr = new ArrayBufferView([21, 31]);
        const arrCopy = new ArrayBufferView([21, 31]);
        const arrDiff = new ArrayBufferView([31, 21]);

        t.true(deepEqual(arr, arr));
        t.true(deepEqual(arr, arrCopy));

        t.false(deepEqual(arr, new ArrayBufferView(0)));
        t.false(deepEqual(arr, arrDiff));
      });
    });

    test('compares empty array buffers', (t) => {
      t.true(deepEqual(new Int8Array(), new Int8Array()));
      t.true(deepEqual(new Uint8Array(), new Uint8Array()));
      t.true(deepEqual(new Uint8ClampedArray(), new Uint8ClampedArray()));
      t.true(deepEqual(new Int16Array(), new Int16Array()));
      t.true(deepEqual(new Uint16Array(), new Uint16Array()));
      t.true(deepEqual(new Int32Array(), new Int32Array()));
      t.true(deepEqual(new Uint32Array(), new Uint32Array()));
      t.true(deepEqual(new Float32Array(), new Float32Array()));
      t.true(deepEqual(new Float64Array(), new Float64Array()));
    });
  }

  test('compares error objects', (t) => {
    const err = new Error();
    const errCopy = new Error();
    const errMsg = new Error('foo');
    const errMsgCopy = new Error('foo');
    const errDiff = new Error('bar');

    t.true(deepEqual(err, err));
    t.true(deepEqual(err, errCopy));
    t.true(deepEqual(errMsg, errMsg));
    t.true(deepEqual(errMsg, errMsgCopy));

    t.false(deepEqual(err, errMsg));
    t.false(deepEqual(errMsg, errDiff));
  });

  test('compares HTML elements', (t) => {
    if (typeof document !== 'undefined') {
      // eslint-disable-next-line no-undef
      const div = document.createElement('div');

      t.true(deepEqual(div, div));
      // t.false(deepEqual(div, div.cloneNode()));
      // t.false(deepEqual(div, div.cloneNode(true)));
    }
  });

  test('compares named functions', (t) => {
    t.false(
      deepEqual(
        function foo() {},
        function foo() {}
      )
    );

    t.false(
      deepEqual(
        function foo() {},
        function bar() {}
      )
    );
  });

  test('compares anonymous functions', (t) => {
    t.false(
      deepEqual(
        function () {},
        function () {}
      )
    );
  });

  test('compares arrow functions', (t) => {
    t.false(
      deepEqual(
        () => {},
        () => {}
      )
    );
  });

  test('bypasses react/preact internals', (t) => {
    const $$typeof = 'foo';
    const reactOwner = { _owner: {}, $$typeof };
    const preactVNode = { __v: {}, $$typeof };
    const preactOwner = { __o: {}, $$typeof };
    const fooNode = { $$typeof };
    const barNode = { $$typeof: 'bar' };

    t.true(deepEqual(reactOwner, fooNode));
    t.true(deepEqual(preactVNode, fooNode));
    t.true(deepEqual(preactOwner, fooNode));

    t.false(deepEqual(reactOwner, barNode));
    t.false(deepEqual(preactVNode, barNode));
    t.false(deepEqual(preactOwner, barNode));
  });
}

// eslint-disable-next-line no-undef
module.exports = runTests;
