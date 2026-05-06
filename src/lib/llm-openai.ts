import OpenAI from 'openai'
import type { LLMClient, LLMMessage, LLMStreamEvent, LLMToolDefinition } from './llm-client'

function toOpenAIMessages(
  messages: LLMMessage[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m): OpenAI.Chat.ChatCompletionMessageParam => {
    if (m.role === 'tool') {
      return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id! }
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      return {
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.tool_calls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      }
    }
    return { role: m.role as 'system' | 'user' | 'assistant', content: m.content }
  })
}

function toOpenAITools(tools: LLMToolDefinition[]): OpenAI.Chat.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

export function createOpenAIClient(apiKey: string, model = 'gpt-4o'): LLMClient {
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  return {
    async *stream(messages: LLMMessage[], tools: LLMToolDefinition[]) {
      const streamParams: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
        model,
        messages: toOpenAIMessages(messages),
        stream: true,
        stream_options: { include_usage: true },
      }
      if (tools.length > 0) streamParams.tools = toOpenAITools(tools)

      let delay = 1000
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const stream = await openai.chat.completions.create(streamParams)
          const toolCallBuffers: Map<number, { id: string; name: string; arguments: string }> =
            new Map()

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index
                if (!toolCallBuffers.has(idx)) {
                  toolCallBuffers.set(idx, {
                    id: tc.id ?? '',
                    name: tc.function?.name ?? '',
                    arguments: '',
                  })
                  yield {
                    type: 'tool_call_start',
                    toolCall: { id: tc.id ?? '', name: tc.function?.name ?? '' },
                  } as LLMStreamEvent
                } else if (tc.function?.arguments) {
                  toolCallBuffers.get(idx)!.arguments += tc.function.arguments
                  yield {
                    type: 'tool_call_delta',
                    toolCall: { arguments: tc.function.arguments },
                  } as LLMStreamEvent
                }
              }
            }

            if (delta?.content) {
              yield { type: 'text_delta', text: delta.content } as LLMStreamEvent
            }

            if (chunk.usage) {
              yield {
                type: 'done',
                usage: {
                  inputTokens: chunk.usage.prompt_tokens,
                  outputTokens: chunk.usage.completion_tokens,
                },
              } as LLMStreamEvent
            }
          }
          return
        } catch (e) {
          const status = (e as { status?: number }).status
          if (status === 429 && attempt < 2) {
            await new Promise((r) => setTimeout(r, delay))
            delay *= 2
            continue
          }
          const msg =
            status === 401 || status === 403
              ? 'Clé API OpenAI invalide ou expirée. Reconfigurez votre clé dans le chat.'
              : status === 429
                ? 'Limite de taux atteinte. Réessayez dans quelques secondes.'
                : e instanceof Error
                  ? e.message
                  : String(e)
          yield { type: 'error', error: msg } as LLMStreamEvent
          return
        }
      }
    },
  }
}
