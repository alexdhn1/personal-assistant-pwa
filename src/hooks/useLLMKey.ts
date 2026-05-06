import { encryptToken, decryptToken } from '../lib/crypto'
import { db } from '../lib/storage'

export interface LLMKeyData {
  key: string
  provider: 'openai' | 'anthropic'
}

export function useLLMKey() {
  async function hasStoredKey(): Promise<boolean> {
    const record = await db.llmKeys.get('llm-api-key')
    return record !== undefined
  }

  async function saveKey(
    apiKey: string,
    provider: 'openai' | 'anthropic',
    password: string
  ): Promise<void> {
    const { ciphertext, salt, iv } = await encryptToken(apiKey, password)
    await db.llmKeys.put({
      id: 'llm-api-key',
      encryptedKey: ciphertext,
      passwordSalt: salt,
      encryptionIv: iv,
      provider,
    })
  }

  async function loadKey(password: string): Promise<LLMKeyData> {
    const record = await db.llmKeys.get('llm-api-key')
    if (!record) throw new Error('No LLM API key stored')

    const key = await decryptToken(
      {
        ciphertext: record.encryptedKey,
        salt: record.passwordSalt as Uint8Array<ArrayBuffer>,
        iv: record.encryptionIv as Uint8Array<ArrayBuffer>,
      },
      password
    )
    return { key, provider: record.provider }
  }

  async function deleteKey(): Promise<void> {
    await db.llmKeys.delete('llm-api-key')
  }

  return { hasStoredKey, saveKey, loadKey, deleteKey }
}
