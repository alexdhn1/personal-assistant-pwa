# Research — AI Agent Chat (002)

**Date**: 2026-05-06  
**Feature**: 002-ai-agent-chat

## R1: Browser CORS for LLM APIs

### Decision: Direct browser → API (no proxy)

**Rationale**: Both OpenAI and Anthropic APIs support CORS headers for browser requests.

- **OpenAI SDK**: Supports browser with `dangerouslyAllowBrowser: true` option. Uses standard `fetch` under the hood.
- **Anthropic SDK**: `@anthropic-ai/sdk` supports browser usage. Pass API key via `x-api-key` header. CORS is allowed.

**Alternatives considered**:
- Backend proxy → rejected (violates Constitution P5: no backend server)
- Cloudflare Worker proxy → over-engineering for single-user app

## R2: Streaming Implementation

### Decision: Native SDK streaming with `for await...of`

**Rationale**: Both SDKs provide streaming iterators that work in the browser.

- **OpenAI**: `stream: true` → returns async iterable of `ChatCompletionChunk` with `delta.content` and `delta.tool_calls`
- **Anthropic**: `stream: true` → returns `RawMessageStreamEvent` sequence with `content_block_delta` events for text and `content_block_start` for tool_use blocks

**Pattern**:
```ts
// OpenAI
const stream = await openai.chat.completions.create({ ...params, stream: true });
for await (const chunk of stream) {
  // chunk.choices[0].delta.content or chunk.choices[0].delta.tool_calls
}

// Anthropic
const stream = await anthropic.messages.stream({ ...params });
stream.on('text', (text) => { /* append */ });
stream.on('contentBlock', (block) => { /* tool_use block */ });
```

## R3: Tool Use / Function Calling Format

### Decision: Abstract interface with provider-specific adapters

**Rationale**: OpenAI uses `tools` array with `type: "function"`, Anthropic uses `tools` array with `input_schema`. The shapes are different but semantically equivalent.

**OpenAI tool definition**:
```json
{
  "type": "function",
  "function": {
    "name": "read_file",
    "description": "Read a markdown file from the assistant/ directory",
    "parameters": { "type": "object", "properties": { "path": { "type": "string" } }, "required": ["path"] }
  }
}
```

**Anthropic tool definition**:
```json
{
  "name": "read_file",
  "description": "Read a markdown file from the assistant/ directory",
  "input_schema": { "type": "object", "properties": { "path": { "type": "string" } }, "required": ["path"] }
}
```

**Tool call response**: 
- OpenAI: message with `tool_calls` array → respond with `role: "tool"` messages
- Anthropic: `content` block of type `tool_use` → respond with `tool_result` content blocks

## R4: update_file Strategy (Partial Modification)

### Decision: Section-based replacement (read → find section → replace section content → write)

**Rationale**: 
- Full diff (unified diff format) is error-prone with LLMs — they often produce invalid diffs
- Line-number based edits are fragile (line numbers shift after each edit)
- Section-based replacement is robust: the LLM reads the file, identifies the section by heading or marker, and rewrites just that section's content

**Strategy for the agent**:
1. `read_file` → gets current content
2. LLM identifies which section to modify (by heading, list item, etc.)
3. LLM produces full new content for the file (but only changes the relevant section)
4. `update_file(path, content)` → writes entire file with the modification

**Why write the whole file**: GitHub API `createOrUpdateFileContents` requires the full encoded content anyway. There's no patch endpoint. The LLM is instructed via system prompt to only change the relevant section.

**Alternative rejected**: Diff-based (unified diff) — LLMs produce malformed diffs 30%+ of the time. Not reliable without a diff-apply library and validation layer.

## R5: OpenAI SDK Bundle Size

### Decision: Use `openai` package (ESM, tree-shakeable)

- Package: `openai` (npm) — 91 KB minified
- Only imports needed: `OpenAI` class + chat completions
- Tree-shaking effective with Vite (eliminates unused modules)

## R6: Anthropic SDK Bundle Size  

### Decision: Use `@anthropic-ai/sdk` package

- Package: `@anthropic-ai/sdk` — ~60 KB minified
- Browser-compatible ESM build
- Both SDKs together add < 150 KB gzip to bundle (acceptable given < 200 KB budget for this feature)

## R7: Token Counting

### Decision: Approximate counting using character-based heuristic

**Rationale**: Accurate token counting requires tiktoken (>1 MB WASM) — too heavy for a PWA.

**Heuristic**: 1 token ≈ 4 characters for English, ≈ 3 characters for French. Display as "~X tokens" with disclaimer.

**Alternative rejected**: tiktoken WASM — adds 1.5 MB to bundle, violates performance constraints.

## R8: Key Storage Extension

### Decision: Extend existing Dexie schema with `llmKeys` table

**Schema addition**:
```ts
db.version(2).stores({
  auth: 'id',
  llmKeys: 'id'  // same structure as auth: encrypted blob + salt + iv
})
```

**Reuses**: `encryptToken()` / `decryptToken()` from `lib/crypto.ts` — same PBKDF2+AES-GCM pattern. The LLM key is encrypted with the same user password.
