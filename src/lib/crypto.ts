export interface EncryptedBlob {
  ciphertext: ArrayBuffer
  salt: Uint8Array<ArrayBuffer>
  iv: Uint8Array<ArrayBuffer>
}

export async function encryptToken(
  token: string,
  password: string
): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
  const key = await deriveKey(password, salt, ['encrypt'])
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  )
  return { ciphertext, salt, iv }
}

export async function decryptToken(
  blob: EncryptedBlob,
  password: string
): Promise<string> {
  const key = await deriveKey(password, blob.salt, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: blob.iv },
    key,
    blob.ciphertext
  )
  return new TextDecoder().decode(plaintext)
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  usages: KeyUsage[]
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  )
}
