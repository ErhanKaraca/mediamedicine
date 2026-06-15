import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  toggleSidebar: () => void
  activeProfileId: string
  setActiveProfileId: (id: string) => void
  composerOpen: boolean
  setComposerOpen: (v: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      activeProfileId: 'user-1',
      setActiveProfileId: (id) => set({ activeProfileId: id }),
      composerOpen: false,
      setComposerOpen: (v) => set({ composerOpen: v }),
    }),
    {
      name: 'mm-ui-store',
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
