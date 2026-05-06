import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const navigate = useNavigate()
  const { setup, unlock, hasStoredToken } = useAuth()

  const [isFirstTime, setIsFirstTime] = useState(true)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    hasStoredToken().then((has) => setIsFirstTime(!has))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isFirstTime) {
        await setup(token.trim(), password)
      } else {
        await unlock(password)
      }
      navigate('/todo', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Personal Assistant
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isFirstTime ? 'First time setup' : 'Enter your password to unlock'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isFirstTime && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="token"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                GitHub Personal Access Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                required
                autoComplete="off"
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your local password"
              required
              autoComplete="current-password"
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            {loading ? 'Loading…' : isFirstTime ? 'Save & Connect' : 'Unlock'}
          </button>
        </form>
      </div>
    </main>
  )
}

