# Tasks: AI Agent Chat

**Input**: Design documents from `/specs/002-ai-agent-chat/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: TDD mandated by Constitution P3. Test tasks included — tests MUST be written FIRST and FAIL before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US5)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install new dependencies, extend existing config

- [ ] T001 Install openai and @anthropic-ai/sdk packages via `npm install openai @anthropic-ai/sdk`
- [ ] T002 [P] Extend Dexie schema with `llmKeys` table in src/lib/storage.ts
- [ ] T003 [P] Add LLM provider settings to Zustand settings store in src/stores/settings.ts
- [ ] T004 [P] Add /chat route to React Router config in src/App.tsx
- [ ] T005 [P] Add Chat nav link to Layout component in src/components/Layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core LLM infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Write unit test for agent tools (list_files, read_file, update_file, create_file) in src/tests/unit/agent-tools.test.ts
- [ ] T007 Implement agent tool definitions and executors in src/lib/agent-tools.ts
- [ ] T008 Write unit test for LLM client interface (streaming mock, tool call parsing, both providers) in src/tests/unit/llm-client.test.ts
- [ ] T009 Implement LLM client abstract interface in src/lib/llm-client.ts
- [ ] T010 [P] Implement OpenAI provider (streaming + function calling) in src/lib/llm-openai.ts
- [ ] T011 [P] Implement Anthropic provider (streaming + tool use) in src/lib/llm-anthropic.ts
- [ ] T012 Write unit test for agent loop (LLM→tool→LLM→response, max 10 cap, error recovery) in src/tests/unit/agent-loop.test.ts
- [ ] T013 Implement agent orchestration loop in src/lib/agent-loop.ts
- [ ] T014 Write unit test for context builder (system prompt from file tree + headings, token limit) in src/tests/unit/context-builder.test.ts
- [ ] T015 Implement context builder (system prompt with arborescence + headings) in src/lib/context-builder.ts

**Checkpoint**: Foundation ready — agent loop can execute tool calls and stream responses from both providers

---

## Phase 3: User Story 2 — LLM API Key Setup (Priority: P1) 🎯 MVP prerequisite

**Goal**: User can securely store and retrieve their LLM API key encrypted in IndexedDB

**Independent Test**: Enter API key + provider → close app → reopen → unlock with password → key is available decrypted

### Tests for US2

- [ ] T016 [P] [US2] Write unit test for useLLMKey hook (encrypt/store/retrieve/decrypt round-trip) in src/tests/unit/useLLMKey.test.ts
- [ ] T017 [P] [US2] Write integration test for LLMSetup UI (key input, provider select, submit) in src/tests/integration/LLMSetup.test.tsx

### Implementation for US2

- [ ] T018 [US2] Implement useLLMKey hook (encrypt/store/decrypt LLM key using existing crypto.ts) in src/hooks/useLLMKey.ts
- [ ] T019 [US2] Implement LLMSetup component (provider dropdown + key input + save button) in src/components/LLMSetup.tsx

**Checkpoint**: LLM API key can be stored securely and retrieved — prerequisite for all chat functionality

---

## Phase 4: User Story 1 — Agent File Organization via Chat (Priority: P1) 🎯 MVP

**Goal**: User sends natural language request → agent reads/modifies/creates files via tool use → commits to GitHub

**Independent Test**: Type "Ajoute 'acheter du pain' dans ma todo" → verify commit appears on GitHub with correct content

### Tests for US1

- [ ] T020 [P] [US1] Write integration test for Chat page (send message → agent responds with tool actions) in src/tests/integration/Chat.test.tsx

### Implementation for US1

- [ ] T021 [US1] Create Zustand chat store (messages, streaming state, token counter, error) in src/stores/chat.ts
- [ ] T022 [US1] Implement useAgent hook (connects chat store + agent loop + GitHub client + context builder) in src/hooks/useAgent.ts
- [ ] T023 [US1] Implement ChatBubble component (user/assistant/tool message rendering with markdown) in src/components/ChatBubble.tsx
- [ ] T024 [P] [US1] Implement ChatInput component (text input + send button + disabled while streaming) in src/components/ChatInput.tsx
- [ ] T025 [P] [US1] Implement ToolCallIndicator component ("Reading todo.md…" visual feedback + action summary "✓ Updated todo.md") in src/components/ToolCallIndicator.tsx
- [ ] T026 [US1] Implement Chat page (message list + input + LLMSetup gate + new conversation button) in src/pages/Chat.tsx

**Checkpoint**: Full agent loop works — user can organize files via natural language chat

---

## Phase 5: User Story 3 — Chat Interface Polish (Priority: P2)

**Goal**: Streaming responses display progressively, markdown rendered, mobile-friendly UX

**Independent Test**: Send message → response streams word by word with markdown formatting

### Implementation for US3

- [ ] T027 [US3] Add streaming text display to ChatBubble (progressive rendering as tokens arrive) in src/components/ChatBubble.tsx
- [ ] T028 [US3] Add "New conversation" button with state reset in src/pages/Chat.tsx
- [ ] T029 [US3] Add token counter display (approximate input/output tokens per session) in src/pages/Chat.tsx
- [ ] T030 [US3] Add auto-scroll to bottom on new messages in src/pages/Chat.tsx

**Checkpoint**: Chat UI is polished with streaming, counters, and conversation management

---

## Phase 6: User Story 4 — Intelligent Context (Priority: P2)

**Goal**: Agent automatically knows file structure and can decide where to organize content without user guidance

**Independent Test**: Ask "Range cette idée cadeau pour Jenna" without specifying file → agent picks correct file

### Implementation for US4

- [ ] T031 [US4] Extend context builder: add file heading extraction (read first # heading of each file) in src/lib/context-builder.ts
- [ ] T032 [US4] Extend context builder: add token budget management (truncate/summarize if arborescence > 8000 tokens) in src/lib/context-builder.ts
- [ ] T033 [US4] Extend context builder: write system prompt with behavioral instructions (range dans le bon fichier, crée si nécessaire) in src/lib/context-builder.ts

**Checkpoint**: Agent intelligently routes content to correct files without explicit user instruction

---

## Phase 7: User Story 5 — Multi-Provider Support (Priority: P3)

**Goal**: User can switch between OpenAI and Anthropic in settings

**Independent Test**: Configure Anthropic → chat works. Switch to OpenAI → chat works.

### Implementation for US5

- [ ] T034 [US5] Add provider/model selection UI to settings or LLMSetup in src/components/LLMSetup.tsx
- [ ] T035 [US5] Wire provider switch to LLM client factory (swap provider at runtime) in src/hooks/useAgent.ts
- [ ] T036 [US5] Handle provider-specific error messages (different error formats) in src/lib/llm-openai.ts and src/lib/llm-anthropic.ts

**Checkpoint**: Both providers work interchangeably with same tool definitions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, rate limiting, edge cases, E2E

- [ ] T037 [P] Add exponential backoff on 429 rate limit responses in src/lib/llm-client.ts
- [ ] T038 [P] Add SHA conflict retry logic (re-fetch + retry once) in src/lib/agent-tools.ts
- [ ] T039 [P] Add invalid/expired API key detection with clear error message + re-setup prompt in src/hooks/useAgent.ts
- [ ] T040 [P] Add offline detection (disable chat input when navigator.onLine is false) in src/pages/Chat.tsx
- [ ] T041 Write E2E test spec (with intercepted API) for full chat flow in src/tests/e2e/agent-chat.spec.ts
- [ ] T042 Run quickstart.md validation (full manual test of the flow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US2 — Key Setup)**: Depends on Phase 2 (needs storage.ts extension)
- **Phase 4 (US1 — Agent Chat)**: Depends on Phase 2 + Phase 3 (needs key to call LLM)
- **Phase 5 (US3 — UI Polish)**: Depends on Phase 4 (needs working chat)
- **Phase 6 (US4 — Context)**: Depends on Phase 2 (can parallel with Phase 4)
- **Phase 7 (US5 — Multi-Provider)**: Depends on Phase 2 (can parallel with Phase 4)
- **Phase 8 (Polish)**: Depends on Phases 3–7

### User Story Dependencies

- **US2 (Key Setup)**: Blocking prerequisite — nothing works without a stored key
- **US1 (Agent Chat)**: Core MVP — depends on US2
- **US3 (UI Polish)**: Enhancement — depends on US1
- **US4 (Context)**: Can develop in parallel with US1 (just the context-builder)
- **US5 (Multi-Provider)**: Can develop in parallel with US1 (just the adapter files)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution P3)
- Stores/hooks before components
- Components before pages
- Core implementation before integration

### Parallel Opportunities

- T002, T003, T004, T005 can all run in parallel (Phase 1)
- T010, T011 can run in parallel (different provider files)
- T016, T017 can run in parallel (different test files)
- T024, T025 can run in parallel (independent components)
- T037, T038, T039, T040 can all run in parallel (Phase 8 — different files)
- US4 (Phase 6) and US5 (Phase 7) can run in parallel with US1 (Phase 4)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Sequential (dependencies):
T006 → T007 (test then implement agent-tools)
T008 → T009 → T010+T011 (test then implement llm-client, then providers in parallel)
T012 → T013 (test then implement agent-loop)
T014 → T015 (test then implement context-builder)

# Parallel chains (independent):
Chain A: T006 → T007
Chain B: T008 → T009 → T010+T011
Chain C: T012 → T013 (depends on T007 + T009)
Chain D: T014 → T015
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Complete Phase 1: Setup (install deps, extend config)
2. Complete Phase 2: Foundational (agent tools, LLM client, agent loop, context builder)
3. Complete Phase 3: US2 — LLM Key Setup
4. Complete Phase 4: US1 — Agent Chat
5. **STOP and VALIDATE**: Test full flow manually per quickstart.md
6. Deploy if ready — MVP delivers core value

### Incremental Delivery

1. Setup + Foundational → Core engine ready
2. Add US2 (Key Setup) → Can store API key securely
3. Add US1 (Agent Chat) → **MVP!** User can organize files via chat
4. Add US3 (UI Polish) → Streaming UX, token counter
5. Add US4 (Context) → Smarter file routing
6. Add US5 (Multi-Provider) → Anthropic/OpenAI choice
7. Polish → Error handling, rate limits, E2E tests
