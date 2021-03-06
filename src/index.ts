/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Plate {
  actual: any;
  expected: any;
  length?: number;
  index?: number;
  iterator?: IterableIterator<[unknown, unknown]>;
  keys?: string[];
}

export type Stack = Plate[];

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const objectToString = Object.prototype.toString;
const objectValueOf = Object.prototype.valueOf;
const hasElementType = typeof Element !== 'undefined';
const hasMap = typeof Map === 'function';
const hasSet = typeof Set === 'function';
const hasArrayBuffer =
  typeof ArrayBuffer === 'function' && !!ArrayBuffer.isView;

/**
 * Tests deep strict equality between the `actual` and `expected` parameters.
 *
 * @param actual any value
 * @param expected any other value
 */
function deepEqual<T>(actual: unknown, expected: T): actual is T {
  // fastest comparison - strict equal
  if (actual === expected) {
    return true;
  }

  const stack: Stack = [{ actual, expected }];
  let stackPointer = 0;
  let plate;

  stack: while ((plate = stack[stackPointer])) {
    const { actual, expected } = plate;

    // fastest comparison - strict equal
    if (actual === expected) {
      if (stackPointer) {
        stack.pop();
        stackPointer--;

        continue stack;
      } else {
        return true;
      }
    }

    // if last index reached, pop stack or return
    if (plate.index != null && plate.index <= 0) {
      if (stackPointer) {
        stack.pop();
        stackPointer--;

        continue stack;
      } else {
        return true;
      }
    }

    // Non-primitives
    if (
      actual &&
      expected &&
      typeof actual == 'object' &&
      typeof expected == 'object'
    ) {
      // Different types
      if (
        actual.constructor !==
        (<Record<string, unknown>>(<unknown>expected)).constructor
      ) {
        return false;
      }

      // Array
      if (Array.isArray(actual)) {
        const length = actual.length;

        if (length !== (<[]>(<unknown>expected)).length) {
          return false;
        }

        let index = plate.index || length;

        plate.length = length;

        if (length === 0) {
          stack.pop();
          stackPointer--;
          continue stack;
        }

        for (; index-- !== 0; ) {
          plate.index = index;

          stack.push({
            actual: actual[index],
            expected: (<[]>(<unknown>expected))[index],
          });
          stackPointer++;

          continue stack;
        }
      }

      // Map
      if (hasMap && actual instanceof Map && expected instanceof Map) {
        if (actual.size !== expected.size) {
          return false;
        }

        if (actual.size === 0) {
          stack.pop();
          stackPointer--;
          continue stack;
        }

        let iterator = actual.entries();
        let item;

        while (!(item = iterator.next()).done) {
          if (!expected.has(item.value[0])) return false;
        }

        iterator = plate.iterator || actual.entries();
        plate.iterator = iterator;
        while (!(item = iterator.next()).done) {
          stack.push({
            actual: item.value[1],
            expected: expected.get(item.value[0]),
          });
          stackPointer++;

          continue stack;
        }
      }

      // Set
      if (hasSet && actual instanceof Set && expected instanceof Set) {
        if (actual.size !== expected.size) {
          return false;
        }

        if (actual.size === 0) {
          stack.pop();
          stackPointer--;
          continue stack;
        }

        const iterator = actual.entries();
        let item;

        while (!(item = iterator.next()).done) {
          if (!expected.has(item.value[0])) {
            return false;
          }
        }

        stack.pop();
        stackPointer--;
        continue stack;
      }

      // ArrayBuffer
      if (
        hasArrayBuffer &&
        ArrayBuffer.isView(actual) &&
        ArrayBuffer.isView(expected)
      ) {
        const length = (<ArrayBufferViewWithLength>actual).length;
        if (length != (<ArrayBufferViewWithLength>expected).length) {
          return false;
        }

        if (length === 0) {
          stack.pop();
          stackPointer--;
          continue stack;
        }

        plate.length = length;
        let index = plate.index || length;

        for (; index-- !== 0; ) {
          plate.index = index;

          stack.push({
            actual: (<[]>(<unknown>actual))[index],
            expected: (<[]>(<unknown>expected))[index],
          });
          stackPointer++;

          continue stack;
        }
      }

      // Regular Expression
      if (actual.constructor === RegExp) {
        if (
          (<RegExp>(<unknown>actual)).source !==
            (<RegExp>(<unknown>expected)).source ||
          (<RegExp>(<unknown>actual)).flags !==
            (<RegExp>(<unknown>expected)).flags
        ) {
          return false;
        } else {
          stack.pop();
          stackPointer--;
          continue stack;
        }
      }

      // Primitive value of custom objects like Date, String, Number, Symbol, Boolean, etc.
      if (actual.valueOf !== objectValueOf) {
        if (actual.valueOf() !== expected.valueOf()) {
          return false;
        } else {
          stack.pop();
          stackPointer--;
          continue stack;
        }
      }

      // String representation of custom objects
      if (actual.toString !== objectToString) {
        if (actual.toString() !== expected.toString()) {
          return false;
        } else {
          stack.pop();
          stackPointer--;
          continue stack;
        }
      }

      // Object
      const keys = plate.keys || Object.keys(actual);
      const length = keys.length;
      let index = plate.index || length;

      if (length !== Object.keys(expected).length) return false;

      plate.keys = keys;
      plate.length = length;

      if (length === 0) {
        stack.pop();
        stackPointer--;
        continue stack;
      }

      // custom handling for DOM elements
      if (hasElementType && actual instanceof Element) {
        return false;
      }

      let skippedAllKeys = true;

      for (; index-- !== 0; ) {
        const key = keys[index];

        if (
          (key === '_owner' || key === '__v' || key === '__o') &&
          actual.$$typeof
        ) {
          // React-specific: avoid traversing React elements' _owner
          // Preact-specific: avoid traversing Preact elements' __v and __o
          //    __v = $_original / $_vnode
          //    __o = $_owner
          // These properties contain circular references and are not needed when
          // comparing the actual elements (and not their owners)
          // .$$typeof and ._store on just reasonable markers of elements

          continue;
        }
        skippedAllKeys = false;

        if (!objectHasOwnProperty.call(expected, key)) {
          return false;
        }

        plate.index = index;

        stack.push({
          actual: (<Record<string, unknown>>(<unknown>actual))[key],
          expected: (<Record<string, unknown>>(<unknown>expected))[key],
        });
        stackPointer++;

        continue stack;
      }

      if (skippedAllKeys) {
        plate.length = 0;
        stack.pop();
        stackPointer--;
        continue stack;
      }
    }

    // Primitive
    if (actual !== expected) {
      return false;
    }
  }

  return true;
}

export default deepEqual;
