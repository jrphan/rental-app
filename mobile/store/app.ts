import { create } from "zustand";
import { getItem, removeItem, setItem } from "@/lib/async-storage";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// Custom storage adapter for Zustand
const zustandStorage: StateStorage<void> = {
  setItem: <T>(name: string, value: T): void => {
    setItem(name, value);
  },
  getItem: async <T>(name: string): Promise<T | null> => {
    return await getItem<T>(name);
  },
  removeItem: async (name: string): Promise<void> => {
    await removeItem(name);
  },
};

type AppState = Record<string, never>;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Empty state without theme
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => zustandStorage as StateStorage<void>),
      partialize: (state) => ({
        // No theme state to persist
      }),
    }
  )
);
