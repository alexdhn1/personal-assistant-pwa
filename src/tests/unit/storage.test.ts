import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { AssistantDB } from '../../lib/storage'

describe('storage', () => {
  let db: AssistantDB

  beforeEach(async () => {
    db = new AssistantDB()
    await db.delete()
    db = new AssistantDB()
    await db.open()
  })

  it('stores and retrieves encrypted token data', async () => {
    const ciphertext = new ArrayBuffer(32)
    const salt = new Uint8Array(16).fill(1)
    const iv = new Uint8Array(12).fill(2)

    await db.auth.put({
      id: 'main',
      encryptedToken: ciphertext,
      passwordSalt: salt,
      encryptionIv: iv,
      failedAttempts: 0,
    })

    const record = await db.auth.get('main')
    expect(record).toBeDefined()
    expect(record!.encryptedToken).toBeTruthy()
    expect(record!.failedAttempts).toBe(0)
  })

  it('stores and retrieves preferences', async () => {
    await db.preferences.put({
      id: 'main',
      githubOwner: 'testuser',
      githubRepo: 'obsidian-vault',
      rootFolder: 'assistant/',
      defaultBranch: 'main',
      theme: 'auto',
    })

    const prefs = await db.preferences.get('main')
    expect(prefs!.githubOwner).toBe('testuser')
    expect(prefs!.theme).toBe('auto')
  })

  it('increments and resets failed attempts', async () => {
    await db.auth.put({ id: 'main', encryptedToken: new ArrayBuffer(0), passwordSalt: new Uint8Array(0), encryptionIv: new Uint8Array(0), failedAttempts: 0 })
    await db.auth.update('main', { failedAttempts: 3 })
    const record = await db.auth.get('main')
    expect(record!.failedAttempts).toBe(3)

    await db.auth.update('main', { failedAttempts: 0 })
    const reset = await db.auth.get('main')
    expect(reset!.failedAttempts).toBe(0)
  })
})
