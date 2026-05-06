export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: LLMToolCall[]
  tool_call_id?: string
}

export interface LLMToolCall {
  id: string
  name: string
  arguments: string // JSON string
}

export interface LLMStreamEvent {
  type: 'text_delta' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_done' | 'done' | 'error'
  text?: string
  toolCall?: Partial<LLMToolCall>
  toolResult?: string
  usage?: { inputTokens: number; outputTokens: number }
  error?: string
}

export interface LLMToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface LLMClient {
  stream(messages: LLMMessage[], tools: LLMToolDefinition[]): AsyncIterable<LLMStreamEvent>
}
