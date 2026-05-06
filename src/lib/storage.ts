import Dexie, { type Table } from 'dexie'

export interface AuthRecord {
  id: 'main'
  encryptedToken: ArrayBuffer
  passwordSalt: Uint8Array
  encryptionIv: Uint8Array
  failedAttempts: number
}

export interface PreferencesRecord {
  id: 'main'
  githubOwner: string
  githubRepo: string
  rootFolder: string
  defaultBranch: string
  theme: 'light' | 'dark' | 'auto'
}

export interface FileCacheRecord {
  path: string
  sha: string
  content: string
  fetchedAt: number
}

export class AssistantDB extends Dexie {
  auth!: Table<AuthRecord, string>
  preferences!: Table<PreferencesRecord, string>
  filesCache!: Table<FileCacheRecord, string>

  constructor() {
    super('personal-assistant-db')
    this.version(1).stores({
      auth: 'id',
      preferences: 'id',
      filesCache: 'path',
    })
  }
}

export const db = new AssistantDB()
