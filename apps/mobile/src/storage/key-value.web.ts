const storage = typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;

export const keyValueStorage = {
  getItem: (key: string) => Promise.resolve(storage?.getItem(key) ?? null),
  setItem: (key: string, value: string) => {
    storage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    storage?.removeItem(key);
    return Promise.resolve();
  },
};
