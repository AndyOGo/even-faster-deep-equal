/* eslint-disable @typescript-eslint/no-explicit-any */
export type Type =
  | 'Array'
  | 'Map'
  | 'Set'
  | 'ArrayBuffer'
  | 'RegExp'
  | 'ValueOf'
  | 'ToString'
  | 'Object';
export interface Plate {
  actual: any;
  expected: any;
  length?: number;
  index?: number;
  iterator?: IterableIterator<[unknown, unknown]>;
  keys?: string[];
  type?: Type;
}

export type Stack = (Plate | null)[];

const objectHasOwnProperty = Object.prototype.hasOwnProperty;
const objectToString = Object.prototype.toString;
const objectValueOf = Object.prototype.valueOf;
const objectKeys = Object.keys;
const arrayIsArray = Array.isArray;
const hasElementType = typeof Element !== 'undefined';
const hasMap = typeof Map === 'function';
const hasSet = typeof Set === 'function';
const hasArrayBuffer =
  typeof ArrayBuffer === 'function' && !!ArrayBuffer.isView;
const arrayBufferIsView = hasArrayBuffer && ArrayBuffer.isView;

/**
 * Tests deep strict equality between the `actual` and `expected` parameters.
 *
 * @param actual any value
 * @param expected any other value
 */
function deepEqual<T = unknown>(actual: unknown, expected: T): actual is T {
  // fastest comparison - strict equal
  if (actual === expected) {
    return true;
  }

  let plate: Plate | null = { actual, expected };
  const stack: Stack = [plate];
  let stackPointer = 0;

  stack: do {
    const { actual, expected } = plate;

    // if last index reached, pop stack or return
    if (plate.index != null && plate.index <= 0) {
      if (stackPointer) {
        stack[stackPointer] = null;
        --stackPointer;

        continue;
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

      const type =
        plate.type || arrayIsArray(actual)
          ? 'Array'
          : hasMap && actual instanceof Map && expected instanceof Map
          ? 'Map'
          : hasSet && actual instanceof Set && expected instanceof Set
          ? 'Set'
          : hasArrayBuffer &&
            (<ArrayBufferConstructor['isView']>arrayBufferIsView)(actual) &&
            (<ArrayBufferConstructor['isView']>arrayBufferIsView)(expected)
          ? 'ArrayBuffer'
          : actual.constructor === RegExp
          ? 'RegExp'
          : actual.valueOf !== objectValueOf
          ? 'ValueOf'
          : actual.toString !== objectToString
          ? 'ToString'
          : 'Object';
      plate.type = type;

      let length;
      let index;
      let keys;
      let item;
      let iterator;
      let actualItem;
      let expectedItem;

      switch (type) {
        // Array
        case 'Array':
          length = actual.length;

          if (length !== (<[]>(<unknown>expected)).length) {
            return false;
          }

          index = plate.index || length;

          plate.length = length;

          if (length === 0) {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }

          for (; index-- !== 0; ) {
            actualItem = actual[index];
            expectedItem = (<[]>(<unknown>expected))[index];

            if (
              actualItem === expectedItem ||
              (actualItem !== actualItem && expectedItem !== expectedItem)
            ) {
              continue;
            }

            plate.index = index;

            stack[++stackPointer] = {
              actual: actualItem,
              expected: expectedItem,
            };

            continue stack;
          }

          break;

        // Map
        case 'Map':
          if (!plate.iterator) {
            if (actual.size !== expected.size) {
              return false;
            }

            if (actual.size === 0) {
              stack[stackPointer] = null;
              stackPointer--;
              continue stack;
            }
          }

          iterator = plate.iterator || actual.entries();
          plate.iterator = iterator;

          while (!(item = iterator.next()).done) {
            if (!expected.has(item.value[0])) {
              return false;
            }

            actualItem = item.value[1];
            expectedItem = expected.get(item.value[0]);

            if (
              actualItem === expectedItem ||
              (actualItem !== actualItem && expectedItem !== expectedItem)
            ) {
              continue;
            }

            stack[++stackPointer] = {
              actual: actualItem,
              expected: expectedItem,
            };

            continue stack;
          }

          break;

        // Set
        case 'Set':
          if (!plate.iterator) {
            if (actual.size !== expected.size) {
              return false;
            }

            if (actual.size === 0) {
              stack[stackPointer] = null;
              stackPointer--;
              continue stack;
            }
          }

          iterator = actual.entries();
          item;

          while (!(item = iterator.next()).done) {
            if (!expected.has(item.value[0])) {
              return false;
            }
          }

          break;

        // ArrayBuffer
        case 'ArrayBuffer':
          length = (<ArrayBufferViewWithLength>actual).length;
          if (length != (<ArrayBufferViewWithLength>expected).length) {
            return false;
          }

          if (length === 0) {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }

          plate.length = length;
          index = plate.index || length;

          for (; index-- !== 0; ) {
            actualItem = (<[]>(<unknown>actual))[index];
            expectedItem = (<[]>(<unknown>expected))[index];

            if (
              actualItem === expectedItem ||
              (actualItem !== actualItem && expectedItem !== expectedItem)
            ) {
              continue;
            }

            plate.index = index;

            stack[++stackPointer] = {
              actual: actualItem,
              expected: expectedItem,
            };

            continue stack;
          }

          break;

        // Regular Expression
        case 'RegExp':
          if (
            (<RegExp>(<unknown>actual)).source !==
              (<RegExp>(<unknown>expected)).source ||
            (<RegExp>(<unknown>actual)).flags !==
              (<RegExp>(<unknown>expected)).flags
          ) {
            return false;
          }
          break;

        // Primitive value of custom objects like Date, String, Number, Symbol, Boolean, etc.
        case 'ValueOf':
          if (actual.valueOf() !== expected.valueOf()) {
            return false;
          }
          break;

        // String representation of custom objects like Error, etc.
        case 'ToString':
          if (actual.toString() !== expected.toString()) {
            return false;
          }
          break;

        // Object
        default:
          keys = plate.keys || objectKeys(actual);
          length = keys.length;

          if (
            !plate.keys &&
            !actual.$$typeof &&
            !expected.$$typeof &&
            length !== objectKeys(expected).length
          ) {
            return false;
          }

          if (length === 0) {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }

          index = plate.index || length;
          plate.keys = keys;
          plate.length = length;

          // custom handling for DOM elements
          if (hasElementType && actual instanceof Element) {
            return false;
          }

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

            if (!objectHasOwnProperty.call(expected, key)) {
              return false;
            }

            actualItem = (<Record<string, unknown>>(<unknown>actual))[key];
            expectedItem = (<Record<string, unknown>>(<unknown>expected))[key];

            if (
              actualItem === expectedItem ||
              (actualItem !== actualItem && expectedItem !== expectedItem)
            ) {
              continue;
            }

            plate.index = index;

            stack[++stackPointer] = {
              actual: actualItem,
              expected: expectedItem,
            };

            continue stack;
          }

          plate.length = 0;
          break;
      }

      stack[stackPointer] = null;
      stackPointer--;
      continue stack;
    }

    // Primitive
    if (actual !== expected) {
      // true if both NaN, false otherwise
      return actual !== actual && expected !== expected;
    }
  } while ((plate = stack[stackPointer]));

  return true;
}

export default deepEqual;
