import type { LLMClient, LLMMessage, LLMStreamEvent, LLMToolDefinition } from './llm-client'
import type { AgentTools } from './agent-tools'

const MAX_TOOL_CALLS = 10

export async function* runAgentLoop(
  llm: LLMClient,
  tools: AgentTools,
  initialMessages: LLMMessage[],
  toolDefs: LLMToolDefinition[]
): AsyncGenerator<LLMStreamEvent> {
  const messages: LLMMessage[] = [...initialMessages]
  let toolCallCount = 0

  while (true) {
    const pendingToolCalls: Array<{ id: string; name: string; arguments: string }> = []
    let hasError = false
    let hasText = false
    let lastDoneEvent: LLMStreamEvent | null = null

    // Stream one LLM turn
    for await (const event of llm.stream(messages, toolDefs)) {
      if (event.type === 'error') {
        yield event
        hasError = true
        break
      }

      if (event.type === 'tool_call_start') {
        pendingToolCalls.push({
          id: event.toolCall?.id ?? crypto.randomUUID(),
          name: event.toolCall?.name ?? '',
          arguments: '',
        })
        yield event // forward for UI visibility
      } else if (event.type === 'tool_call_delta') {
        const last = pendingToolCalls.at(-1)
        if (last && event.toolCall?.arguments) {
          last.arguments += event.toolCall.arguments
        }
        // don't yield tool_call_delta upstream — noisy for UI
      } else if (event.type === 'text_delta') {
        hasText = true
        yield event
      } else if (event.type === 'done') {
        lastDoneEvent = event
      }
    }

    if (hasError) break

    // No tool calls → terminal text response, we're done
    if (pendingToolCalls.length === 0) {
      if (lastDoneEvent) yield lastDoneEvent
      break
    }

    // Check safety cap
    toolCallCount += pendingToolCalls.length
    if (toolCallCount > MAX_TOOL_CALLS) {
      yield {
        type: 'error',
        error: `Safety limit reached: maximum ${MAX_TOOL_CALLS} tool calls per request.`,
      }
      break
    }

    // Add assistant message with tool calls to history
    const assistantMsg: LLMMessage = {
      role: 'assistant',
      content: '',
      tool_calls: pendingToolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
      })),
    }
    messages.push(assistantMsg)

    // Execute each tool call
    for (const tc of pendingToolCalls) {
      let result: string
      try {
        const args = JSON.parse(tc.arguments || '{}') as Record<string, unknown>

        if (tc.name === 'list_files') {
          const items = await tools.list_files(args as { path?: string })
          result = JSON.stringify(items)
        } else if (tc.name === 'read_file') {
          result = await tools.read_file(args as { path: string })
        } else if (tc.name === 'update_file') {
          result = await tools.update_file(args as { path: string; content: string; message?: string })
        } else if (tc.name === 'create_file') {
          result = await tools.create_file(args as { path: string; content: string; message?: string })
        } else {
          result = `Unknown tool: ${tc.name}`
        }
      } catch (e) {
        result = `Tool error: ${e instanceof Error ? e.message : String(e)}`
      }

      // Add tool result to message history
      messages.push({ role: 'tool', content: result, tool_call_id: tc.id })

      // Yield tool_call_done so UI can mark spinner as complete
      yield {
        type: 'tool_call_done',
        toolCall: { id: tc.id, name: tc.name },
        toolResult: result,
      }
    }

    // Loop back to call LLM with updated history (including tool results)
    // If there was text before the tool calls, clear it — we'll get a fresh response
    void hasText
  }
}
