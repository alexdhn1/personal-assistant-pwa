export interface TodoItem {
  id: string
  text: string
  checked: boolean
  tags: string[]
}

export interface TodoSection {
  title: string
  items: TodoItem[]
}

const TAG_RE = /#([\w-]+)/g
const TASK_RE = /^- \[([xX ])\] (.+)$/

function extractTags(text: string): { clean: string; tags: string[] } {
  const tags: string[] = []
  const clean = text
    .replace(TAG_RE, (_, tag) => {
      tags.push(tag)
      return ''
    })
    .trim()
  return { clean, tags }
}

export function parseTodoFile(content: string): TodoSection[] {
  const sections: TodoSection[] = []
  let current: TodoSection | null = null
  let itemIndex = 0

  for (const line of content.split('\n')) {
    const heading = line.match(/^## (.+)$/)
    if (heading) {
      current = { title: heading[1].trim(), items: [] }
      sections.push(current)
      continue
    }

    const task = line.match(TASK_RE)
    if (task && current) {
      const checked = task[1].toLowerCase() === 'x'
      const rawText = task[2]
      const { clean, tags } = extractTags(rawText)
      current.items.push({
        id: `item-${itemIndex++}`,
        text: clean,
        checked,
        tags,
      })
    }
  }

  return sections
}

export function serializeTodoFile(sections: TodoSection[]): string {
  const lines: string[] = ['# Todo', '']
  for (const section of sections) {
    lines.push(`## ${section.title}`, '')
    for (const item of section.items) {
      const check = item.checked ? 'x' : ' '
      const tagStr = item.tags.length > 0 ? ' ' + item.tags.map((t) => `#${t}`).join(' ') : ''
      lines.push(`- [${check}] ${item.text}${tagStr}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
