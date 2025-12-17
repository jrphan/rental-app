import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type AppState = Record<string, never>

export const useAppStore = create<AppState>()(
  persist(
    () => ({
      // Empty state without theme
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({
        // No theme state to persist
      }),
    },
  ),
)
