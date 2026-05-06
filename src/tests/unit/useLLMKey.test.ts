import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLLMKey } from '../../hooks/useLLMKey'
import { db } from '../../lib/storage'

beforeEach(async () => {
  // Clear llmKeys table between tests
  await db.llmKeys.clear()
})

describe('useLLMKey', () => {
  it('hasStoredKey returns false when no key exists', async () => {
    const { result } = renderHook(() => useLLMKey())
    const has = await act(async () => result.current.hasStoredKey())
    expect(has).toBe(false)
  })

  it('saveKey encrypts and stores the API key', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-test-key-123', 'openai', 'mypassword')
    })

    const record = await db.llmKeys.get('llm-api-key')
    expect(record).toBeDefined()
    expect(record?.provider).toBe('openai')
    // The key should be encrypted — not equal to original
    expect(record?.encryptedKey).not.toBeNull()
  })

  it('hasStoredKey returns true after saving', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-test-key', 'anthropic', 'pass123')
    })
    const has = await act(async () => result.current.hasStoredKey())
    expect(has).toBe(true)
  })

  it('loadKey decrypts the key with correct password', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-secret-api-key', 'openai', 'mypassword')
    })

    const decrypted = await act(async () =>
      result.current.loadKey('mypassword')
    )
    expect(decrypted).toEqual({ key: 'sk-secret-api-key', provider: 'openai' })
  })

  it('loadKey throws on wrong password', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-secret', 'openai', 'correct')
    })

    await expect(
      act(async () => result.current.loadKey('wrong'))
    ).rejects.toThrow()
  })

  it('round-trip works for anthropic provider', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-ant-key-xyz', 'anthropic', 'pass')
    })

    const decrypted = await act(async () => result.current.loadKey('pass'))
    expect(decrypted).toEqual({ key: 'sk-ant-key-xyz', provider: 'anthropic' })
  })

  it('deleteKey removes the stored key', async () => {
    const { result } = renderHook(() => useLLMKey())
    await act(async () => {
      await result.current.saveKey('sk-to-delete', 'openai', 'pass')
    })
    await act(async () => {
      await result.current.deleteKey()
    })
    const has = await act(async () => result.current.hasStoredKey())
    expect(has).toBe(false)
  })
})
