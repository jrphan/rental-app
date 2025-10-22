import { create } from "zustand";

type AppState = {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: false,
  setDarkMode: (value) => set({ isDarkMode: value }),
}));
