import { useState } from 'react'
import { useLLMKey } from '../hooks/useLLMKey'

interface LLMSetupProps {
  onSaved: () => void
  password: string
}

export default function LLMSetup({ onSaved, password }: LLMSetupProps) {
  const { saveKey } = useLLMKey()
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!apiKey.trim()) {
      setError('La clé API est requise.')
      return
    }

    setSaving(true)
    try {
      await saveKey(apiKey.trim(), provider, password)
      onSaved()
    } catch {
      setError('Erreur lors de la sauvegarde de la clé.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Configuration LLM
      </h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="llm-provider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fournisseur
        </label>
        <select
          id="llm-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="llm-api-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Clé API
        </label>
        <input
          id="llm-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
          autoComplete="off"
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded px-4 py-2 transition-colors"
      >
        {saving ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>
    </form>
  )
}
