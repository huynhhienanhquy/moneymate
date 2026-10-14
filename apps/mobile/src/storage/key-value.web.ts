const storage =
  typeof globalThis.localStorage === 'undefined'
    ? null
    : globalThis.localStorage;

export const keyValueStorage = {
  /**
   * Return item required by the key value.web workflow.
   *
   * Use it when key value.web data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @returns The resulting key value.web value for the caller.
   */
  getItem: (key: string) => Promise.resolve(storage?.getItem(key) ?? null),
  /**
   * Set item used by the key value.web workflow.
   *
   * Use it when key value.web data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @param value - The value to transform or evaluate.
   * @returns The resulting key value.web value for the caller.
   */
  setItem: (key: string, value: string) => {
    storage?.setItem(key, value);
    return Promise.resolve();
  },
  /**
   * Remove item from the key value.web workflow.
   *
   * Use it when key value.web data must be read from or written to local persistence.
   * @param key - The key value required by the operation.
   * @returns The resulting key value.web value for the caller.
   */
  removeItem: (key: string) => {
    storage?.removeItem(key);
    return Promise.resolve();
  },
};
