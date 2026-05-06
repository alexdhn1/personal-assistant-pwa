import { Octokit } from '@octokit/rest'

export class AuthError extends Error {
  constructor(message = 'GitHub authentication failed') {
    super(message)
    this.name = 'AuthError'
  }
}

export interface FileEntry {
  name: string
  path: string
  sha: string
  type: 'file' | 'dir'
}

export interface FileContent {
  content: string
  sha: string
}

export interface WriteFileParams {
  path: string
  content: string
  sha: string
  message: string
}

export interface CreateFileParams {
  path: string
  content: string
  message: string
}

// Minimal shape of the Octokit repos API we use — allows easy test injection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<{ data: unknown }>

export interface OctokitLike {
  rest: {
    repos: {
      getContent: AnyFn
      createOrUpdateFileContents: AnyFn
    }
  }
}

function wrapAuthErrors<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: unknown) => {
    const status = (err as { status?: number }).status
    if (status === 401 || status === 403) throw new AuthError()
    throw err
  })
}

export function createGitHubClient(
  token: string,
  owner: string,
  repo: string,
  branch = 'main',
  _octokit?: OctokitLike
) {
  const octokit: OctokitLike = _octokit ?? new Octokit({ auth: token })

  async function readFile(path: string): Promise<FileContent> {
    const response = await wrapAuthErrors(
      octokit.rest.repos.getContent({ owner, repo, path, ref: branch })
    )
    const data = response.data as { type: string; content: string; sha: string }
    if (data.type !== 'file') throw new Error(`${path} is not a file`)
    const base64 = data.content.replace(/\s/g, '')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const decoded = new TextDecoder('utf-8').decode(bytes)
    return { content: decoded, sha: data.sha }
  }

  async function listDir(path: string): Promise<FileEntry[]> {
    const response = await wrapAuthErrors(
      octokit.rest.repos.getContent({ owner, repo, path, ref: branch })
    )
    const items = response.data as Array<{ type: string; name: string; path: string; sha: string }>
    return items
      .filter((item) => item.type === 'file' || item.type === 'dir')
      .map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        type: item.type as 'file' | 'dir',
      }))
  }

  async function writeFile(params: WriteFileParams): Promise<string> {
    const encoded = btoa(unescape(encodeURIComponent(params.content)))
    const response = await wrapAuthErrors(
      octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: params.path,
        message: params.message,
        content: encoded,
        sha: params.sha,
        branch,
      })
    )
    const data = response.data as { content: { sha: string } }
    return data.content.sha
  }

  async function createFile(params: CreateFileParams): Promise<string> {
    const encoded = btoa(unescape(encodeURIComponent(params.content)))
    const response = await wrapAuthErrors(
      octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: params.path,
        message: params.message,
        content: encoded,
        branch,
      })
    )
    const data = response.data as { content: { sha: string } }
    return data.content.sha
  }

  return { readFile, listDir, writeFile, createFile }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>
