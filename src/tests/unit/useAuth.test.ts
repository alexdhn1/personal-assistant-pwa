import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../stores/auth'

// Reset auth store between tests
beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false, token: null, client: null })
})

describe('useAuth', () => {
  it('setup: encrypts token and sets auth as authenticated', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.setup('ghp_testtoken123', 'password123')
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('ghp_testtoken123')
    expect(useAuthStore.getState().client).not.toBeNull()
  })

  it('unlock: decrypts token from storage and sets auth', async () => {
    // First set up the token
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.setup('ghp_testtoken456', 'mypassword')
    })
    // Clear in-memory auth (simulate app reload)
    useAuthStore.setState({ isAuthenticated: false, token: null, client: null })

    // Now unlock with password
    await act(async () => {
      await result.current.unlock('mypassword')
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('ghp_testtoken456')
  })

  it('unlock: throws on wrong password', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.setup('ghp_abc', 'correct')
    })
    useAuthStore.setState({ isAuthenticated: false, token: null, client: null })

    await expect(
      act(async () => {
        await result.current.unlock('wrong')
      })
    ).rejects.toThrow()
  })

  it('wipes encrypted blob after 5 failed attempts', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.setup('ghp_wipe', 'goodpass')
    })
    useAuthStore.setState({ isAuthenticated: false, token: null, client: null })

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.unlock('badpass').catch(() => {})
      })
    }

    // After 5 failures, hasToken should return false (blob wiped)
    const { result: result2 } = renderHook(() => useAuth())
    const hasToken = await act(async () => result2.current.hasStoredToken())
    expect(hasToken).toBe(false)
  })
})
