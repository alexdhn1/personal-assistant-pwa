import { create } from 'zustand'
import type { GitHubClient } from '../lib/github-client'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  client: GitHubClient | null
  /** Session password (in-memory only, cleared on reload). Used to decrypt LLM key. */
  sessionPassword: string | null
  setAuth: (token: string, client: GitHubClient, password?: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  client: null,
  sessionPassword: null,
  setAuth: (token, client, password) =>
    set({ isAuthenticated: true, token, client, sessionPassword: password ?? null }),
  clearAuth: () =>
    set({ isAuthenticated: false, token: null, client: null, sessionPassword: null }),
}))
