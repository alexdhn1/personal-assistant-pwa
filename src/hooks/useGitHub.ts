import { useAuthStore } from '../stores/auth'

/**
 * Returns the authenticated GitHub client from the auth store,
 * or null if not yet authenticated.
 *
 * Usage:
 *   const github = useGitHub()
 *   if (!github) return <Navigate to="/auth" />
 *   const file = await github.readFile('assistant/todo.md')
 */
export function useGitHub() {
  return useAuthStore((s) => s.client)
}
