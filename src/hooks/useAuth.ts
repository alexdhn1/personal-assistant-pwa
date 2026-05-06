import { db } from '../lib/storage'
import { encryptToken, decryptToken } from '../lib/crypto'
import { createGitHubClient } from '../lib/github-client'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'

const MAX_ATTEMPTS = 5

export function useAuth() {
  const { setAuth, clearAuth } = useAuthStore.getState()
  const settings = useSettingsStore.getState()

  async function hasStoredToken(): Promise<boolean> {
    try {
      const record = await db.auth.get('main')
      return !!record?.encryptedToken
    } catch {
      return false
    }
  }

  async function setup(token: string, password: string): Promise<void> {
    const blob = await encryptToken(token, password)
    await db.auth.put({
      id: 'main',
      encryptedToken: blob.ciphertext,
      passwordSalt: blob.salt,
      encryptionIv: blob.iv,
      failedAttempts: 0,
    })
    const client = createGitHubClient(
      token,
      settings.githubOwner,
      settings.githubRepo,
      settings.defaultBranch
    )
    setAuth(token, client, password)
  }

  async function unlock(password: string): Promise<void> {
    const record = await db.auth.get('main')
    if (!record) throw new Error('No stored token — please set up first')

    const currentAttempts = record.failedAttempts ?? 0

    try {
      const token = await decryptToken(
        {
          ciphertext: record.encryptedToken as ArrayBuffer,
          salt: record.passwordSalt as Uint8Array<ArrayBuffer>,
          iv: record.encryptionIv as Uint8Array<ArrayBuffer>,
        },
        password
      )
      // Success — reset failed attempts
      await db.auth.update('main', { failedAttempts: 0 })
      const client = createGitHubClient(
        token,
        settings.githubOwner,
        settings.githubRepo,
        settings.defaultBranch
      )
      setAuth(token, client, password)
    } catch (err) {
      const newAttempts = currentAttempts + 1
      if (newAttempts >= MAX_ATTEMPTS) {
        // Wipe everything after 5 failures
        await db.auth.delete('main')
        clearAuth()
        throw new Error('Too many failed attempts — token wiped. Please set up again.')
      }
      await db.auth.update('main', { failedAttempts: newAttempts })
      throw new Error(`Wrong password (attempt ${newAttempts}/${MAX_ATTEMPTS})`)
    }
  }

  return { setup, unlock, hasStoredToken }
}
