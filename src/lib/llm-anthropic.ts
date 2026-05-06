import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMMessage, LLMStreamEvent, LLMToolDefinition } from './llm-client'

type AnthropicMessage = Anthropic.MessageParam
type AnthropicTool = Anthropic.Tool

function toAnthropicMessages(messages: LLMMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = []

  for (const m of messages) {
    if (m.role === 'system') continue // system is separate in Anthropic

    if (m.role === 'assistant' && m.tool_calls?.length) {
      result.push({
        role: 'assistant',
        content: [
          ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
          ...m.tool_calls.map((tc) => ({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.name,
            input: JSON.parse(tc.arguments || '{}'),
          })),
        ],
      })
    } else if (m.role === 'tool') {
      result.push({
        role: 'user',
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: m.tool_call_id!,
            content: m.content,
          },
        ],
      })
    } else {
      result.push({ role: m.role as 'user' | 'assistant', content: m.content })
    }
  }

  return result
}

function toAnthropicTools(tools: LLMToolDefinition[]): AnthropicTool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool['input_schema'],
  }))
}

function extractSystem(messages: LLMMessage[]): string | undefined {
  return messages.find((m) => m.role === 'system')?.content
}

export function createAnthropicClient(
  apiKey: string,
  model = 'claude-sonnet-4-20250514'
): LLMClient {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  return {
    async *stream(messages: LLMMessage[], tools: LLMToolDefinition[]) {
      try {
        const system = extractSystem(messages)
        const params: Anthropic.MessageStreamParams = {
          model,
          max_tokens: 4096,
          messages: toAnthropicMessages(messages),
          ...(system ? { system } : {}),
          ...(tools.length > 0 ? { tools: toAnthropicTools(tools) } : {}),
        }

        let delay = 1000
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const stream = anthropic.messages.stream(params)

            for await (const event of stream) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                  yield {
                    type: 'tool_call_start',
                    toolCall: { id: event.content_block.id, name: event.content_block.name },
                  } as LLMStreamEvent
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  yield { type: 'text_delta', text: event.delta.text } as LLMStreamEvent
                } else if (event.delta.type === 'input_json_delta') {
                  yield {
                    type: 'tool_call_delta',
                    toolCall: { arguments: event.delta.partial_json },
                  } as LLMStreamEvent
                }
              } else if (event.type === 'message_delta' && event.usage) {
                yield {
                  type: 'done',
                  usage: {
                    inputTokens: (event as { usage?: { input_tokens?: number } }).usage?.input_tokens ?? 0,
                    outputTokens: event.usage.output_tokens,
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
                ? 'Clé API Anthropic invalide ou expirée. Reconfigurez votre clé dans le chat.'
                : status === 429
                  ? 'Limite de taux atteinte. Réessayez dans quelques secondes.'
                  : e instanceof Error
                    ? e.message
                    : String(e)
            yield { type: 'error', error: msg } as LLMStreamEvent
            return
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        yield { type: 'error', error: msg } as LLMStreamEvent
      }
    },
  }
}
