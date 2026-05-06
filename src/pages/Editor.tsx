import { useEffect, useState } from 'react'
import { useGitHub } from '../hooks/useGitHub'
import { useFile } from '../hooks/useFile'
import { useSettingsStore } from '../stores/settings'

export default function Editor() {
  const client = useGitHub()
  const { files, content, currentPath, loading, error, loadDir, openFile, save } = useFile(client!)
  const rootFolder = useSettingsStore((s) => s.rootFolder?.replace(/\/+$/, '') || 'assistant')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadDir(rootFolder)
  }, [])

  useEffect(() => {
    setDraft(content)
  }, [content])

  async function handleSave() {
    setSaving(true)
    try {
      await save(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const mdFiles = files.filter((f) => f.type === 'file' && f.name.endsWith('.md'))

  return (
    <div className="flex h-full min-h-0 max-w-4xl mx-auto">
      {/* File list sidebar */}
      <aside className="w-40 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Files
        </p>
        {mdFiles.map((f) => (
          <button
            key={f.path}
            onClick={() => openFile(f.path)}
            className={[
              'w-full text-left px-2 py-1.5 text-sm rounded truncate',
              currentPath === f.path
                ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            {f.name}
          </button>
        ))}
        {mdFiles.length === 0 && !loading && (
          <p className="text-xs text-gray-400 px-1">No .md files</p>
        )}
      </aside>

      {/* Editor area */}
      <div className="flex flex-col flex-1 min-w-0 p-4 gap-3">
        {currentPath ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400 truncate">{currentPath}</p>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors flex-shrink-0"
              >
                {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={loading}
              className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a file to edit
          </div>
        )}
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  )
}

