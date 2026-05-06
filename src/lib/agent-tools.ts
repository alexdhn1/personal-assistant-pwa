import type { GitHubClient } from './github-client'

export interface AgentToolsClient {
  readFile: GitHubClient['readFile']
  listDir: GitHubClient['listDir']
  writeFile: GitHubClient['writeFile']
  createFile: GitHubClient['createFile']
}

function validatePath(path: string): string | null {
  if (path.includes('..')) return 'Invalid path: must be within assistant/'
  return null
}

function resolvePath(rootFolder: string, relativePath: string): string {
  if (!relativePath || relativePath === '.') return rootFolder
  return `${rootFolder}/${relativePath}`
}

export interface ListFilesArgs {
  path?: string
}

export interface ReadFileArgs {
  path: string
}

export interface UpdateFileArgs {
  path: string
  content: string
  message?: string
}

export interface CreateFileArgs {
  path: string
  content: string
  message?: string
}

export interface AgentTools {
  list_files: (args: ListFilesArgs) => Promise<Array<{ name: string; type: 'file' | 'dir' }>>
  read_file: (args: ReadFileArgs) => Promise<string>
  update_file: (args: UpdateFileArgs) => Promise<string>
  create_file: (args: CreateFileArgs) => Promise<string>
}

export function createAgentTools(client: AgentToolsClient, rootFolder: string): AgentTools {
  const root = rootFolder.replace(/\/+$/, '')

  async function list_files(
    args: ListFilesArgs
  ): Promise<Array<{ name: string; type: 'file' | 'dir' }>> {
    const relativePath = args.path ?? ''
    const fullPath = resolvePath(root, relativePath)
    const entries = await client.listDir(fullPath)
    return entries.map((e) => ({ name: e.name, type: e.type }))
  }

  async function read_file(args: ReadFileArgs): Promise<string> {
    const err = validatePath(args.path)
    if (err) return err

    const fullPath = `${root}/${args.path}`
    try {
      const { content } = await client.readFile(fullPath)
      return content
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) return `File not found: ${args.path}`
      throw e
    }
  }

  async function update_file(args: UpdateFileArgs): Promise<string> {
    const err = validatePath(args.path)
    if (err) return err

    const fullPath = `${root}/${args.path}`
    const commitMessage = args.message ?? `update: ${args.path} - via AI assistant`

    try {
      const { sha } = await client.readFile(fullPath)
      const newSha = await client.writeFile({
        path: fullPath,
        content: args.content,
        sha,
        message: commitMessage,
      })
      return `✓ Updated ${args.path} (commit: ${newSha})`
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 404) return `File not found: ${args.path}. Use create_file instead.`
      if (status === 409) {
        return `Conflict: file was modified externally. Please read_file again and retry.`
      }
      throw e
    }
  }

  async function create_file(args: CreateFileArgs): Promise<string> {
    const err = validatePath(args.path)
    if (err) return err

    const fullPath = `${root}/${args.path}`
    const commitMessage = args.message ?? `create: ${args.path} - via AI assistant`

    try {
      const newSha = await client.createFile({
        path: fullPath,
        content: args.content,
        message: commitMessage,
      })
      return `✓ Created ${args.path} (commit: ${newSha})`
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 422) return `File already exists: ${args.path}. Use update_file instead.`
      throw e
    }
  }

  return { list_files, read_file, update_file, create_file }
}
