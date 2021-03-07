/* eslint-disable @typescript-eslint/no-explicit-any */
export enum Type {
  Array,
  Map,
  Set,
  ArrayBuffer,
  RegExp,
  ValueOf,
  ToString,
  Object,
}
export interface Plate {
  actual: any;
  expected: any;
  length?: number;
  index?: number;
  iterator?: IterableIterator<[unknown, unknown]>;
  keys?: string[];
  isObject?: boolean;
  type?: Type;
}

export type Stack = (Plate | null)[];

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
function deepEqual<T = unknown>(actual: unknown, expected: T): actual is T {
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
        stack[stackPointer] = null;
        --stackPointer;

        continue;
      }
    }

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

    const isObject =
      plate.isObject ||
      (actual &&
        expected &&
        typeof actual == 'object' &&
        typeof expected == 'object');
    plate.isObject = isObject;

    // Non-primitives
    if (isObject) {
      // Different types
      if (
        actual.constructor !==
        (<Record<string, unknown>>(<unknown>expected)).constructor
      ) {
        return false;
      }

      const type =
        plate.type || Array.isArray(actual)
          ? Type.Array
          : hasMap && actual instanceof Map && expected instanceof Map
          ? Type.Map
          : hasSet && actual instanceof Set && expected instanceof Set
          ? Type.Set
          : hasArrayBuffer &&
            ArrayBuffer.isView(actual) &&
            ArrayBuffer.isView(expected)
          ? Type.ArrayBuffer
          : actual.constructor === RegExp
          ? Type.RegExp
          : actual.valueOf !== objectValueOf
          ? Type.ValueOf
          : actual.toString !== objectToString
          ? Type.ToString
          : Type.Object;
      plate.type = type;

      let length;
      let index;
      let keys;
      let item;
      let iterator;
      let skippedAllKeys;

      switch (type) {
        // Array
        case Type.Array:
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
            plate.index = index;

            stack[++stackPointer] = {
              actual: actual[index],
              expected: (<[]>(<unknown>expected))[index],
            };

            continue stack;
          }
          break;

        // Map
        case Type.Map:
          if (!plate.iterator) {
            if (actual.size !== expected.size) {
              return false;
            }

            if (actual.size === 0) {
              stack[stackPointer] = null;
              stackPointer--;
              continue stack;
            }

            iterator = actual.entries();

            while (!(item = iterator.next()).done) {
              if (!expected.has(item.value[0])) return false;
            }
          }

          iterator = plate.iterator || actual.entries();
          plate.iterator = iterator;
          while (!(item = iterator.next()).done) {
            stack[++stackPointer] = {
              actual: item.value[1],
              expected: expected.get(item.value[0]),
            };

            continue stack;
          }
          break;

        // Set
        case Type.Set:
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

          stack[stackPointer] = null;
          stackPointer--;
          continue stack;
          break;

        // ArrayBuffer
        case Type.ArrayBuffer:
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
            plate.index = index;

            stack[++stackPointer] = {
              actual: (<[]>(<unknown>actual))[index],
              expected: (<[]>(<unknown>expected))[index],
            };

            continue stack;
          }
          break;

        // Regular Expression
        case Type.RegExp:
          if (
            (<RegExp>(<unknown>actual)).source !==
              (<RegExp>(<unknown>expected)).source ||
            (<RegExp>(<unknown>actual)).flags !==
              (<RegExp>(<unknown>expected)).flags
          ) {
            return false;
          } else {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }
          break;

        // Primitive value of custom objects like Date, String, Number, Symbol, Boolean, etc.
        case Type.ValueOf:
          if (actual.valueOf() !== expected.valueOf()) {
            return false;
          } else {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }
          break;

        // String representation of custom objects like Error, etc.
        case Type.ToString:
          if (actual.toString() !== expected.toString()) {
            return false;
          } else {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }
          break;

        // Object
        default:
          keys = plate.keys || Object.keys(actual);
          length = keys.length;
          index = plate.index || length;

          if (
            !plate.keys &&
            !actual.$$typeof &&
            !expected.$$typeof &&
            length !== Object.keys(expected).length
          ) {
            return false;
          }

          plate.keys = keys;
          plate.length = length;

          if (length === 0) {
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }

          // custom handling for DOM elements
          if (hasElementType && actual instanceof Element) {
            return false;
          }

          skippedAllKeys = true;

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

            stack[++stackPointer] = {
              actual: (<Record<string, unknown>>(<unknown>actual))[key],
              expected: (<Record<string, unknown>>(<unknown>expected))[key],
            };

            continue stack;
          }

          if (skippedAllKeys) {
            plate.length = 0;
            stack[stackPointer] = null;
            stackPointer--;
            continue stack;
          }
          break;
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
