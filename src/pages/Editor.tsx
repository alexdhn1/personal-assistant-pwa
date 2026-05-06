import { useEffect, useState } from 'react'
import { useGitHub } from '../hooks/useGitHub'
import { useFile } from '../hooks/useFile'
import { useSettingsStore } from '../stores/settings'
import FileTree from '../components/FileTree'
import FileBreadcrumb from '../components/FileBreadcrumb'
import MarkdownView from '../components/MarkdownView'
import Skeleton from '../components/Skeleton'

export default function Editor() {
  const client = useGitHub()
  const rootFolder = useSettingsStore((s) => s.rootFolder?.replace(/\/+$/, '') || 'assistant')
  const {
    tree, treeLoading, treeError, loadTree,
    content, currentPath, loading, error: fileError,
    openFile, save,
  } = useFile(client!)

  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    loadTree(rootFolder)
  }, [loadTree, rootFolder])

  // Keep draft in sync when file changes
  useEffect(() => {
    setDraft(content)
    setViewMode('read')
    setSaveError(null)
  }, [content, currentPath])

  async function handleSelect(path: string) {
    setSaveError(null)
    await openFile(path)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await save(draft)
      setSaved(true)
      setViewMode('read')
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(content)
    setViewMode('read')
    setSaveError(null)
  }

  return (
    <div className="flex h-full min-h-0 max-w-4xl mx-auto">
      {/* Sidebar */}
      <aside className="w-44 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Fichiers
        </p>
        {treeLoading && (
          <div className="space-y-1.5 px-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        {treeError && !treeLoading && (
          <div className="flex flex-col gap-2 px-1">
            <p role="alert" className="text-xs text-red-500">{treeError}</p>
            <button
              onClick={() => loadTree(rootFolder)}
              className="text-xs text-violet-600 hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}
        {!treeLoading && !treeError && (
          <FileTree
            tree={tree}
            currentPath={currentPath}
            onSelect={handleSelect}
          />
        )}
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 p-4 gap-3">
        {/* Header row: breadcrumb + action buttons */}
        <div className="flex items-center justify-between gap-2 min-h-[28px]">
          <div className="flex-1 min-w-0">
            {currentPath ? (
              <FileBreadcrumb path={currentPath.replace(`${rootFolder}/`, '')} />
            ) : null}
          </div>
          {currentPath && viewMode === 'read' && (
            <button
              onClick={() => setViewMode('edit')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium flex-shrink-0"
            >
              Modifier
            </button>
          )}
          {currentPath && viewMode === 'edit' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs rounded font-medium"
              >
                {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-xs text-red-500">{saveError}</p>
        )}

        {/* File error */}
        {fileError && !loading && currentPath && (
          <p className="text-xs text-red-500">{fileError}</p>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {!currentPath && !loading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400 text-center">
                Sélectionnez un fichier dans la barre latérale
              </p>
            </div>
          )}
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {currentPath && !loading && viewMode === 'read' && (
            <MarkdownView content={content} />
          )}
          {currentPath && !loading && viewMode === 'edit' && (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-full min-h-64 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}
