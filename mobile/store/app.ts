import { getItem, removeItem, setItem } from "@/lib/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// Custom storage adapter for Zustand
const zustandStorage: StateStorage<void> = {
  setItem: <T>(name: string, value: T): void => {
    return setItem(name, value);
  },
  getItem: <T>(name: string): T | null => {
    const value = getItem<T>(name);
    return value ?? null;
  },
  removeItem: (name: string): void => {
    return removeItem(name);
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
