import { create } from 'zustand'
import type { GitHubClient } from '../lib/github-client'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  client: GitHubClient | null
  setAuth: (token: string, client: GitHubClient) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  client: null,
  setAuth: (token, client) => set({ isAuthenticated: true, token, client }),
  clearAuth: () => set({ isAuthenticated: false, token: null, client: null }),
}))
