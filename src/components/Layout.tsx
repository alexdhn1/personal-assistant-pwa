import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'

const navItems = [
  { to: '/todo', label: 'Todo', icon: '✓' },
  { to: '/editor', label: 'Editor', icon: '✎' },
  { to: '/inbox', label: 'Inbox', icon: '📥' },
  { to: '/chat', label: 'Chat', icon: '💬' },
] as const

export default function Layout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  function handleLock() {
    clearAuth()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Offline banner */}
      {offline && (
        <div className="bg-amber-500 text-white text-xs text-center py-1.5 font-medium" role="alert">
          You are offline — reads work, writes disabled
        </div>
      )}
      {/* Top bar with lock button */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Personal Assistant
        </span>
        <button
          onClick={handleLock}
          aria-label="Lock and sign out"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          Lock 🔒
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex"
        aria-label="Main navigation"
      >
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              ].join(' ')
            }
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

