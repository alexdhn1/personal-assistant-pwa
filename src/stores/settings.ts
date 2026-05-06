import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  githubOwner: string
  githubRepo: string
  rootFolder: string
  defaultBranch: string
  theme: 'light' | 'dark' | 'auto'
}

interface SettingsState extends Settings {
  update: (partial: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      githubOwner: 'alexdhn1',
      githubRepo: 'obsidian-vault',
      rootFolder: 'assistant/',
      defaultBranch: 'main',
      theme: 'auto',
      update: (partial) => set(partial),
    }),
    { name: 'assistant-settings' }
  )
)
