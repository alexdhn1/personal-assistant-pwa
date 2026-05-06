import { create } from 'zustand'

interface FileEntry {
  path: string
  sha: string
  content: string
  isDirty: boolean
}

interface FilesState {
  openFiles: Record<string, FileEntry>
  lastAgentWrite: number
  setFile: (path: string, entry: Omit<FileEntry, 'isDirty'>) => void
  markDirty: (path: string, content: string) => void
  markSaved: (path: string, newSha: string) => void
  removeFile: (path: string) => void
  bumpAgentWrite: () => void
}

export const useFilesStore = create<FilesState>((set) => ({
  openFiles: {},
  lastAgentWrite: 0,
  setFile: (path, entry) =>
    set((state) => ({
      openFiles: { ...state.openFiles, [path]: { ...entry, isDirty: false } },
    })),
  markDirty: (path, content) =>
    set((state) => ({
      openFiles: {
        ...state.openFiles,
        [path]: { ...state.openFiles[path], content, isDirty: true },
      },
    })),
  markSaved: (path, newSha) =>
    set((state) => ({
      openFiles: {
        ...state.openFiles,
        [path]: { ...state.openFiles[path], sha: newSha, isDirty: false },
      },
    })),
  removeFile: (path) =>
    set((state) => {
      const { [path]: _, ...rest } = state.openFiles
      return { openFiles: rest }
    }),
  bumpAgentWrite: () => set({ lastAgentWrite: Date.now() }),
}))
