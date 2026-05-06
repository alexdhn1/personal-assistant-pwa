import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../stores/chat'
import { useAgent } from '../hooks/useAgent'
import { useLLMKey } from '../hooks/useLLMKey'
import { useAuthStore } from '../stores/auth'
import ChatBubble from '../components/ChatBubble'
import ChatInput from '../components/ChatInput'
import ToolCallIndicator from '../components/ToolCallIndicator'
import LLMSetup from '../components/LLMSetup'
export default function Chat() {
  const {
    messages,
    isStreaming,
    currentToolCalls,
    tokenCount,
    error,
    addMessage,
    updateLastAssistantContent,
    setStreaming,
    setError,
    addTokens,
    upsertToolCall,
    reset,
  } = useChatStore()

  const { sendMessage, isReady } = useAgent()
  const { hasStoredKey } = useLLMKey()
  const sessionPassword = useAuthStore((s) => s.sessionPassword)

  const [keySetup, setKeySetup] = useState<'loading' | 'needed' | 'ready'>('loading')
  const [offline, setOffline] = useState(!navigator.onLine)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Offline detection
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // Check if LLM key is configured
  useEffect(() => {
    hasStoredKey().then((has) => {
      setKeySetup(has ? 'ready' : 'needed')
    })
  }, [hasStoredKey])

  // Auto-scroll on new messages
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, currentToolCalls])

  async function handleSend(text: string) {
    if (!isReady || isStreaming) return

    // Add user message to history
    addMessage({ role: 'user', content: text })

    // Add placeholder assistant message
    addMessage({ role: 'assistant', content: '' })

    setStreaming(true)
    setError(null)

    try {
      for await (const event of sendMessage(text)) {
        if (event.type === 'text_delta' && event.text) {
          updateLastAssistantContent(event.text)
        } else if (event.type === 'tool_call_start' && event.toolCall) {
          upsertToolCall({
            id: event.toolCall.id ?? crypto.randomUUID(),
            name: event.toolCall.name ?? '',
            arguments: {},
            status: 'running',
          })
        } else if (event.type === 'tool_call_done' && event.toolCall?.id) {
          upsertToolCall({
            id: event.toolCall.id,
            status: 'done',
            result: event.toolResult,
          })
        } else if (event.type === 'done' && event.usage) {
          addTokens(event.usage.inputTokens, event.usage.outputTokens)
        } else if (event.type === 'error') {
          setError(event.error ?? 'Erreur inconnue')
        }
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi")
    } finally {
      setStreaming(false)
    }
  }

  if (keySetup === 'loading') {
    return (
      <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">
        Chargement…
      </div>
    )
  }

  if (keySetup === 'needed') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-4 text-center">
          Configurez votre clé API LLM pour utiliser le chat.
        </p>
        <LLMSetup
          password={sessionPassword ?? ''}
          onSaved={() => setKeySetup('ready')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chat</h1>
        <div className="flex items-center gap-3">
          {(tokenCount.input + tokenCount.output) > 0 && (
            <span className="text-xs text-gray-400">
              ~{tokenCount.input + tokenCount.output} tokens
            </span>
          )}
          <button
            onClick={reset}
            aria-label="Nouvelle conversation"
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            Nouvelle conv.
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              Bonjour ! Je peux vous aider à organiser vos notes et idées.
              <br />
              Essayez : <em>"Ajoute 'acheter du pain' dans ma todo"</em>
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Tool call indicators */}
        {currentToolCalls.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {currentToolCalls.map((tc) => (
              <ToolCallIndicator key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            role="alert"
            className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2"
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {offline && (
        <div className="text-center text-xs text-amber-600 dark:text-amber-400 px-4 py-1.5 border-t border-gray-200 dark:border-gray-700">
          Hors ligne — le chat est désactivé
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isStreaming || !isReady || offline} />
    </div>
  )
}
