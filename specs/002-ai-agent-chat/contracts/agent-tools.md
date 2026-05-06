# Agent Tool Contracts — AI Agent Chat (002)

**Date**: 2026-05-06

## Tool: list_files

**Purpose**: List files and directories under a given path in the assistant/ folder.

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Relative path inside assistant/ to list. Empty string or '.' for root."
    }
  },
  "required": []
}
```

**Returns**: JSON array of `{ name: string, type: "file" | "dir" }`

**Example**:
- Input: `{ "path": "" }`  
- Output: `[{"name":"todo.md","type":"file"},{"name":"inbox","type":"dir"},{"name":"gifts.md","type":"file"}]`

---

## Tool: read_file

**Purpose**: Read the full content of a markdown file in the assistant/ folder.

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Relative path to the file inside assistant/ (e.g. 'todo.md', 'inbox/2026-05-06.md')"
    }
  },
  "required": ["path"]
}
```

**Returns**: String content of the file (UTF-8 markdown)

**Error cases**:
- File not found → returns error string: "File not found: {path}"
- Not a file (is directory) → returns error: "{path} is a directory, use list_files instead"

---

## Tool: update_file

**Purpose**: Update an existing markdown file. The LLM provides the full new content (having read the file first and made targeted changes).

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Relative path to the file inside assistant/"
    },
    "content": {
      "type": "string",
      "description": "The complete new content of the file (UTF-8 markdown)"
    },
    "message": {
      "type": "string",
      "description": "Git commit message describing what was changed. Keep concise."
    }
  },
  "required": ["path", "content"]
}
```

**Returns**: String confirmation: "✓ Updated {path} (commit: {short_sha})"

**Behavior**:
- Reads current SHA of the file before writing (for optimistic locking)
- On SHA conflict (409): re-fetches file, returns error asking LLM to retry with fresh content
- Default commit message: "update: {filename} - via AI assistant"

**Error cases**:
- File not found → returns error: "File not found: {path}. Use create_file instead."
- SHA conflict → returns error: "Conflict: file was modified externally. Please read_file again and retry."

---

## Tool: create_file

**Purpose**: Create a new markdown file in the assistant/ folder.

**Parameters**:
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Relative path for the new file inside assistant/ (e.g. 'vacances-2026.md')"
    },
    "content": {
      "type": "string",
      "description": "The content of the new file (UTF-8 markdown)"
    },
    "message": {
      "type": "string",
      "description": "Git commit message. Keep concise."
    }
  },
  "required": ["path", "content"]
}
```

**Returns**: String confirmation: "✓ Created {path} (commit: {short_sha})"

**Behavior**:
- Calls GitHub API createOrUpdateFileContents without SHA (creates new file)
- Default commit message: "create: {filename} - via AI assistant"

**Error cases**:
- File already exists (422 from GitHub) → returns error: "File already exists: {path}. Use update_file instead."
- Invalid path (contains ..) → returns error: "Invalid path: must be within assistant/"

---

## LLM Client Interface

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: LLMToolCall[];
  tool_call_id?: string;
}

interface LLMToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

interface LLMStreamEvent {
  type: 'text_delta' | 'tool_call_start' | 'tool_call_delta' | 'done' | 'error';
  text?: string;
  toolCall?: Partial<LLMToolCall>;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
}

interface LLMClient {
  stream(messages: LLMMessage[], tools: LLMToolDefinition[]): AsyncIterable<LLMStreamEvent>;
}

interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}
```

## System Prompt Contract

The system prompt MUST include:
1. Role definition ("Tu es un assistant personnel...")
2. Available file structure (from list_files at conversation start)
3. Behavioral instructions:
   - "Range les idées dans le fichier le plus pertinent"
   - "Si aucun fichier ne correspond, crée-en un nouveau avec un nom descriptif"
   - "Toujours lire un fichier avant de le modifier"
   - "Ne modifie que la section pertinente, laisse le reste intact"
4. Constraint: "Maximum 10 tool calls par demande"
