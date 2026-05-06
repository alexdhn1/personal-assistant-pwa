import { useCallback } from 'react'
import type { GitHubClient } from '../lib/github-client'
import { useSettingsStore } from '../stores/settings'

const INBOX_FOLDER = 'inbox'

export function useInbox(client: GitHubClient) {
  const { rootFolder } = useSettingsStore.getState()
  const root = rootFolder?.replace(/\/+$/, '')
  const inboxFolder = root ? `${root}/inbox` : INBOX_FOLDER

  const capture = useCallback(
    async (text: string, date: string) => {
      const path = `${inboxFolder}/${date}.md`
      let existingContent = ''
      let sha = ''

      try {
        const file = await client.readFile(path)
        existingContent = file.content
        sha = file.sha
      } catch {
        // File doesn't exist yet — start fresh
      }

      const heading = `# ${date}\n\n`
      const body = existingContent || heading
      const newContent = body.trimEnd() + '\n- ' + text + '\n'

      await client.writeFile({
        path,
        content: newContent,
        sha,
        message: `inbox: capture note ${date} - via PWA`,
      })
    },
    [client, inboxFolder]
  )

  return { capture }
}
