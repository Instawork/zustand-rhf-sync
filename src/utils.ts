/**
 * Deep compare two objects, and then calls a callback for each difference.
 * The callback is called with the path to the difference, and the new value.
 *
 * This is used to update react-hook-form when the store changes.
 *
 * Function properties are ignored.
 *
 * @param state - The new state
 * @param prev - The previous state
 * @param callback - The callback to call for each difference
 * @param pathPrefix - The path prefix to use for the callback
 * @returns void
 */
export function deepCompareDifferences<
  T extends Record<string, unknown> | Array<unknown>,
>(
  state: T,
  prev: T,
  callback: (path: string, newValue: unknown) => void,
  pathPrefix = "",
): void {
  if (Array.isArray(state) && Array.isArray(prev)) {
    if (state.length !== prev.length) {
      callback(pathPrefix, state);
      return;
    }
    for (let i = 0; i < state.length; i++) {
      if (typeof state[i] === "object" && typeof prev[i] === "object") {
        deepCompareDifferences(
          state[i] as Record<string, unknown> | Array<unknown>,
          prev[i] as Record<string, unknown> | Array<unknown>,
          callback,
          `${pathPrefix}[${i}].`,
        );
      } else if (state[i] !== prev[i] && typeof state[i] !== "function") {
        callback(`${pathPrefix}[${i}]`, state[i]);
      }
    }
    return;
  }

  if (typeof state === "object" && typeof prev === "object") {
    for (const key in state) {
      if (typeof state[key] === "object" && typeof prev[key] === "object") {
        deepCompareDifferences(
          state[key] as Record<string, unknown> | Array<unknown>,
          prev[key] as Record<string, unknown> | Array<unknown>,
          callback,
          `${pathPrefix}${key}.`,
        );
      } else if (state[key] !== prev[key] && typeof state[key] !== "function") {
        callback(`${pathPrefix}${key}`, state[key]);
      }
    }
    return;
  }

  callback(pathPrefix, state);
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
