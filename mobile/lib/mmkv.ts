// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MMKV } = require("react-native-mmkv");

export const storage = new MMKV();

export function setItem<T>(key: string, value: T) {
  const str = JSON.stringify(value);
  storage.set(key, str);
}

export function getItem<T>(key: string, fallback?: T): T | undefined {
  const str = storage.getString(key);
  if (str == null) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function removeItem(key: string) {
  storage.delete(key);
}
