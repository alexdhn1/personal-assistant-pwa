import { useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useLLMKey } from './useLLMKey'
import { createAgentTools } from '../lib/agent-tools'
import { createOpenAIClient } from '../lib/llm-openai'
import { createAnthropicClient } from '../lib/llm-anthropic'
import { runAgentLoop } from '../lib/agent-loop'
import { buildSystemPrompt } from '../lib/context-builder'
import { useChatStore } from '../stores/chat'
import type { LLMMessage, LLMStreamEvent, LLMToolDefinition } from '../lib/llm-client'

const TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    name: 'list_files',
    description:
      'Liste les fichiers et dossiers dans le dossier assistant/. Utilise path vide ou "." pour la racine.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Chemin relatif dans assistant/ à lister. Vide ou "." pour la racine.',
        },
      },
    },
  },
  {
    name: 'read_file',
    description: "Lit le contenu complet d'un fichier markdown dans assistant/.",
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Chemin relatif du fichier dans assistant/ (ex: "todo.md", "inbox/2026-05-06.md")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'update_file',
    description:
      "Met à jour un fichier existant. Lis d'abord le fichier, modifie la section pertinente, puis soumets le fichier complet.",
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin relatif dans assistant/' },
        content: { type: 'string', description: 'Contenu complet du fichier (UTF-8 markdown)' },
        message: { type: 'string', description: 'Message de commit Git (concis)' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'create_file',
    description: 'Crée un nouveau fichier markdown dans assistant/.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Chemin relatif du nouveau fichier dans assistant/' },
        content: { type: 'string', description: 'Contenu du fichier (UTF-8 markdown)' },
        message: { type: 'string', description: 'Message de commit Git (concis)' },
      },
      required: ['path', 'content'],
    },
  },
]

export function useAgent() {
  const client = useAuthStore((s) => s.client)
  const sessionPassword = useAuthStore((s) => s.sessionPassword)
  const settings = useSettingsStore()
  const { loadKey } = useLLMKey()
  const chat = useChatStore()

  const isReady = !!client && !!sessionPassword

  const sendMessage = useCallback(
    async function* (userText: string): AsyncGenerator<LLMStreamEvent> {
      if (!client || !sessionPassword) {
        yield { type: 'error', error: 'Client GitHub ou mot de passe non disponible.' }
        return
      }

      // Load LLM key from IndexedDB
      let llmKey: string
      let llmProvider: 'openai' | 'anthropic'
      try {
        const keyData = await loadKey(sessionPassword)
        llmKey = keyData.key
        llmProvider = keyData.provider
      } catch {
        yield { type: 'error', error: 'Impossible de décrypter la clé API LLM.' }
        return
      }

      // Build LLM client — use provider-appropriate default model
      const DEFAULT_MODELS: Record<string, string> = {
        openai: 'gpt-4o',
        anthropic: 'claude-sonnet-4-5',
      }
      const model = DEFAULT_MODELS[llmProvider] ?? 'gpt-4o'
      const llm =
        llmProvider === 'anthropic'
          ? createAnthropicClient(llmKey, model)
          : createOpenAIClient(llmKey, model)

      // Build agent tools
      const rootFolder = settings.rootFolder.replace(/\/+$/, '')
      const tools = createAgentTools(client, rootFolder)

      // Build context (list files for system prompt)
      let systemPrompt: string
      try {
        const files = await client.listDir(rootFolder)
        systemPrompt = buildSystemPrompt(
          files.map((f) => ({ name: f.name, type: f.type }))
        )
      } catch {
        systemPrompt = buildSystemPrompt([])
      }

      // Build conversation history from store
      const history: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chat.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m): LLMMessage => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userText },
      ]

      // Run agent loop and stream events
      for await (const event of runAgentLoop(llm, tools, history, TOOL_DEFINITIONS)) {
        yield event
      }
    },
    [client, sessionPassword, settings, loadKey, chat.messages]
  )

  return { sendMessage, isReady }
}
