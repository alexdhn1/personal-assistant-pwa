import { describe, it, expect } from 'vitest'
import { encryptToken, decryptToken } from '../../lib/crypto'

describe('crypto', () => {
  const password = 'test-password-123'
  const token = 'ghp_testtoken1234567890abcdefghij'

  it('encrypts and decrypts a token round-trip', async () => {
    const encrypted = await encryptToken(token, password)
    expect(encrypted.ciphertext).toBeTruthy()
    expect((encrypted.ciphertext as ArrayBuffer).byteLength).toBeGreaterThan(0)
    expect(encrypted.salt).toHaveLength(16)
    expect(encrypted.iv).toHaveLength(12)

    const decrypted = await decryptToken(encrypted, password)
    expect(decrypted).toBe(token)
  })

  it('decryption fails with wrong password', async () => {
    const encrypted = await encryptToken(token, password)
    await expect(decryptToken(encrypted, 'wrong-password')).rejects.toThrow()
  })

  it('generates unique salt and iv each time', async () => {
    const enc1 = await encryptToken(token, password)
    const enc2 = await encryptToken(token, password)
    expect(enc1.salt).not.toEqual(enc2.salt)
    expect(enc1.iv).not.toEqual(enc2.iv)
  })
})
