import { useState } from 'react'
import { useGitHub } from '../hooks/useGitHub'
import { useInbox } from '../hooks/useInbox'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Inbox() {
  const client = useGitHub()
  const { capture } = useInbox(client!)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit() {
    const trimmed = note.trim()
    if (!trimmed || !client) return
    setSaving(true)
    try {
      await capture(trimmed, todayISO())
      setNote('')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setOpen(false)
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Inbox</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Quick-capture notes saved to your daily inbox file.
      </p>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-20 flex items-end justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Capture note</h2>
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Jot down a thought, idea, or task…"
              rows={4}
              disabled={saving}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none disabled:opacity-60"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !note.trim()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Capture inbox note"
        className="fixed bottom-20 right-4 w-14 h-14 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white rounded-full shadow-lg text-2xl flex items-center justify-center transition-transform z-10"
      >
        +
      </button>
    </div>
  )
}

