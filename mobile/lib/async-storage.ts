import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setItem<T>(key: string, value: T): Promise<void> {
  const str = JSON.stringify(value);
  await AsyncStorage.setItem(key, str);
}

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const str = await AsyncStorage.getItem(key);
    if (str == null) return null;
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

// Synchronous wrappers for Zustand
export const storage = {
  setItem: async <T>(name: string, value: T): Promise<void> => {
    await setItem(name, value);
  },
  getItem: async <T>(name: string): Promise<T | null> => {
    return await getItem<T>(name);
  },
  removeItem: async (name: string): Promise<void> => {
    await removeItem(name);
  },
};
