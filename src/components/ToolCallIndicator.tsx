import type { ToolCall } from '../stores/chat'

const TOOL_LABELS: Record<string, string> = {
  list_files: 'Lecture de la structure…',
  read_file: 'Lecture de',
  update_file: 'Mise à jour de',
  create_file: 'Création de',
}

interface ToolCallIndicatorProps {
  toolCall: ToolCall
}

function getLabel(tc: ToolCall): string {
  const base = TOOL_LABELS[tc.name] ?? tc.name
  const path = (tc.arguments as { path?: string })?.path
  return path ? `${base} ${path}` : `${base}…`
}

function getSummary(tc: ToolCall): string | null {
  if (tc.status !== 'done' || !tc.result) return null
  // Show result confirmation for write operations
  if (tc.name === 'update_file' || tc.name === 'create_file') {
    return tc.result
  }
  return null
}

export default function ToolCallIndicator({ toolCall }: ToolCallIndicatorProps) {
  const isDone = toolCall.status === 'done'
  const isError = toolCall.status === 'error'
  const summary = getSummary(toolCall)

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
      {!isDone && !isError && (
        <span className="inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      )}
      {isDone && !isError && <span className="text-green-500">✓</span>}
      {isError && <span className="text-red-500">✗</span>}
      <span>{summary ?? getLabel(toolCall)}</span>
    </div>
  )
}
