# Data Model — AI Agent Chat (002)

**Date**: 2026-05-06  
**Feature**: 002-ai-agent-chat

## Entities

### Message

Represents a single message in the conversation.

| Field | Type | Description |
|---|---|---|
| id | string | Unique ID (crypto.randomUUID()) |
| role | 'user' \| 'assistant' \| 'tool' | Who sent the message |
| content | string | Text content (markdown for assistant) |
| toolCalls | ToolCall[] \| undefined | Tool calls requested by assistant |
| toolCallId | string \| undefined | ID of the tool call this message responds to (role=tool only) |
| timestamp | number | Date.now() when created |

### ToolCall

Represents a single tool invocation requested by the LLM.

| Field | Type | Description |
|---|---|---|
| id | string | Unique tool call ID (from LLM response) |
| name | 'list_files' \| 'read_file' \| 'update_file' \| 'create_file' | Tool name |
| arguments | Record<string, unknown> | Parsed JSON arguments |
| result | string \| undefined | Execution result (filled after execution) |
| status | 'pending' \| 'running' \| 'done' \| 'error' | Execution state |

### Conversation (Zustand store — in-memory only)

| Field | Type | Description |
|---|---|---|
| messages | Message[] | Full message history for current session |
| isStreaming | boolean | Whether assistant is currently streaming |
| currentToolCalls | ToolCall[] | Active tool calls being executed |
| tokenCount | { input: number, output: number } | Approximate token usage for session |
| error | string \| null | Last error message |

### LLMProviderConfig (Zustand store — persisted in localStorage)

| Field | Type | Description |
|---|---|---|
| provider | 'openai' \| 'anthropic' | Selected LLM provider |
| model | string | Model name (e.g. 'gpt-4o', 'claude-sonnet-4-20250514') |

### LLMKeyRecord (IndexedDB via Dexie — encrypted)

| Field | Type | Description |
|---|---|---|
| id | string | Fixed: 'llm-api-key' |
| encryptedKey | ArrayBuffer | AES-GCM encrypted API key |
| passwordSalt | Uint8Array | PBKDF2 salt |
| encryptionIv | Uint8Array | AES-GCM IV |
| provider | 'openai' \| 'anthropic' | Provider associated with this key |

## State Transitions

### Conversation Flow

```
IDLE → USER_INPUT → STREAMING → [TOOL_CALLING → TOOL_EXECUTING → STREAMING]* → IDLE
```

- IDLE: No active request. Input enabled.
- USER_INPUT: User typed and sent a message. Message added to history.
- STREAMING: LLM response streaming in. Assistant bubble growing.
- TOOL_CALLING: LLM emitted a tool_call. Waiting for execution.
- TOOL_EXECUTING: Tool function running (GitHub API call). Indicator shown.
- Loop repeats until LLM produces final text response (stop_reason=end_turn).

### Tool Call Lifecycle

```
pending → running → done | error
```

### Agent Loop Guard

```
tool_call_count >= 10 → FORCE_STOP → error message to user
```

## Relationships

```
Conversation 1──* Message
Message 1──* ToolCall (only for role=assistant)
LLMProviderConfig 1──1 LLMKeyRecord
```

## Validation Rules

- Message.content: non-empty for role=user, may be empty for role=assistant (tool-only responses)
- ToolCall.arguments: must be valid JSON matching tool schema
- LLMKeyRecord: key encrypted before storage, never stored in plaintext
- Conversation: max 100 messages before suggesting "New conversation" (context window management)
- Agent loop: hard cap at 10 tool calls per user message

## Storage Schema (Dexie extension)

```ts
// Extends existing db from lib/storage.ts
db.version(2).stores({
  auth: 'id',        // existing
  llmKeys: 'id'     // new: stores encrypted LLM API key
})
```
