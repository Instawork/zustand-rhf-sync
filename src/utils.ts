import { Path, PathValue } from "react-hook-form";

/**
 * Deep compare two objects. Returns an array of [path, newValue] for each difference.
 *
 * This is used to update react-hook-form when the store changes.
 *
 * Function properties are ignored.
 *
 * @param state - The new state
 * @param prev - The previous state
 * @param pathPrefix - The path prefix to use for the callback
 */
function _deepCompareDifferences<
  T extends Record<string, unknown> | Array<unknown> | unknown,
>(state: T, prev: T, pathPrefix = ""): [string, unknown][] {
  if (typeof state === "function") return [];
  if (state === prev) return [];
  if (Array.isArray(state) && Array.isArray(prev)) {
    const result: [string, unknown][] = [];
    if (state.length !== prev.length) {
      result.push([pathPrefix, state]);
    } else {
      for (let i = 0; i < state.length; i++) {
        result.push(
          ..._deepCompareDifferences(
            state[i] as Record<string, unknown> | Array<unknown>,
            prev[i] as Record<string, unknown> | Array<unknown>,
            `${pathPrefix ? `${pathPrefix}.` : ""}${i}`,
          ),
        );
      }
    }
    return result;
  }

  if (typeof state === "object" && typeof prev === "object") {
    if (state === null || prev === null) {
      return [[pathPrefix, state]];
    }
    const result: [string, unknown][] = [];
    for (const key in state) {
      result.push(
        ..._deepCompareDifferences(
          state[key] as Record<string, unknown> | Array<unknown>,
          prev[key] as Record<string, unknown> | Array<unknown>,
          `${pathPrefix ? `${pathPrefix}.` : ""}${key}`,
        ),
      );
    }
    return result;
  }

  return [[pathPrefix, state]];
}

/**
 * Deep compare two objects. Returns an array of [path, newValue] for each difference.
 *
 * This is used to update react-hook-form when the store changes.
 *
 * Function properties are ignored.
 *
 * @param state - The new state
 * @param prev - The previous state
 * @param pathPrefix - The path prefix to use for the callback
 */
export function deepCompareDifferences<T extends Record<string, unknown>>(
  state: T,
  prev: T,
): [Path<T> | "", PathValue<T, Path<T>>][] {
  return _deepCompareDifferences(state, prev) as [
    Path<T>,
    PathValue<T, Path<T>>,
  ][];
}

export type RecursiveNonFunction<T> = T extends
  | Record<string, unknown>
  | Array<unknown>
  ? {
      [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
        ? never
        : RecursiveNonFunction<T[K]>;
    }
  : T;

/**
 * Deep clone an object, but remove all functions.
 *
 * @param a - The object to clone.
 * @returns The cloned object, without any functions.
 */
export function deepCloneWithoutFunctions<
  T extends Record<string, unknown> | Array<unknown>,
>(a: T): RecursiveNonFunction<T> {
  if (Array.isArray(a)) {
    return a.map((value) => {
      if (value === null || typeof value !== "object") return value;
      return deepCloneWithoutFunctions(
        value as Record<string, unknown> | Array<unknown>,
      );
    }) as unknown as RecursiveNonFunction<T>;
  }
  const result = {} as T;
  for (const key in a) {
    if (typeof a[key] !== "function") {
      if (a[key] === null || typeof a[key] !== "object") {
        result[key] = a[key];
      } else {
        result[key] = deepCloneWithoutFunctions(
          a[key] as Record<string, unknown> | Array<unknown>,
        ) as unknown as T[Extract<keyof T, string>];
      }
    }
  }
  return result as RecursiveNonFunction<T>;
}
