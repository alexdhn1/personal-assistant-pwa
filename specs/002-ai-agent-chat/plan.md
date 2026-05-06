# Implementation Plan: AI Agent Chat

**Branch**: `002-ai-agent-chat` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-agent-chat/spec.md`

**Note**: TDD-first approach mandated by Constitution P3. All code follows red → green → refactor.

## Summary

Ajouter un module conversationnel agentique à la PWA existante. L'utilisateur dialogue avec un LLM (OpenAI/Anthropic) qui dispose d'outils (list_files, read_file, update_file, create_file) pour lire et modifier les fichiers .md du dossier assistant/. La clé API LLM est stockée chiffrée (même pattern PBKDF2 + AES-GCM que le token GitHub). L'interface streaming affiche les réponses progressivement. La boucle agent gère automatiquement les tool calls (max 10/tour).

## Technical Context

**Language/Version**: TypeScript 6.0.2 strict, React 19.2.5  
**Primary Dependencies**: @octokit/rest 22 (existant), openai SDK (nouveau), @anthropic-ai/sdk (nouveau)  
**Storage**: IndexedDB via Dexie 4 (existant) — nouvelle table `llmKeys`  
**Testing**: Vitest 4 + React Testing Library + Playwright  
**Target Platform**: Browser PWA (Chrome, Safari, Firefox), mobile-first  
**Project Type**: Web application (SPA PWA, 100% client-side)  
**Performance Goals**: Streaming commence < 2s, tool loop < 30s pour 3 tool calls  
**Constraints**: Pas de backend, < 200 KB gzip bundle additionnel, offline-tolerant (chat désactivé offline)  
**Scale/Scope**: 1 utilisateur, < 50 fichiers dans assistant/, < 10 tool calls/tour

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Note |
|---|---|---|
| **P1** — Source de vérité = GitHub | ✅ PASS | Toute écriture = commit GitHub. Pas de duplication locale. |
| **P2** — Mobile-first | ✅ PASS | Interface chat responsive, input accessible mobile. |
| **P3** — TDD strict | ✅ PASS | Plan structuré red→green→refactor. Tests avant code. |
| **P4** — Sécurité des secrets | ✅ PASS | Clé API chiffrée PBKDF2+AES-GCM dans IndexedDB. Jamais en localStorage. |
| **P5** — Pas de backend | ✅ PASS | Appels directs aux APIs LLM depuis le navigateur. |
| **P6** — Simplicité | ✅ PASS | Feature justifiée : utilisée quotidiennement pour organiser des idées. |
| **P7** — Stack stable et connue | ✅ PASS | openai/anthropic SDKs : >10k stars, MIT, actifs. |
| **P8** — Versioning | ✅ PASS | Chaque modification = commit avec message descriptif. |

**GATE PASSED** ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-agent-chat/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (LLM tool schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (additions to existing repo)

```text
src/
├── lib/
│   ├── llm-client.ts          # Abstract LLM interface + provider factory
│   ├── llm-openai.ts          # OpenAI provider (streaming + function calling)
│   ├── llm-anthropic.ts       # Anthropic provider (streaming + tool use)
│   ├── agent-tools.ts         # Tool definitions + executors (list/read/update/create)
│   ├── agent-loop.ts          # Agent orchestration loop (max 10 calls)
│   └── context-builder.ts     # System prompt builder (arborescence + headings)
├── hooks/
│   ├── useAgent.ts            # React hook: agent loop + state management
│   └── useLLMKey.ts           # React hook: encrypt/decrypt/store LLM API key
├── stores/
│   └── chat.ts                # Zustand store: messages, streaming state, token counter
├── pages/
│   └── Chat.tsx               # Chat page with message list + input
├── components/
│   ├── ChatBubble.tsx         # Message bubble (user/assistant/tool)
│   ├── ChatInput.tsx          # Text input + send button
│   ├── ToolCallIndicator.tsx  # "Reading todo.md…" visual feedback
│   └── LLMSetup.tsx           # API key configuration form
└── tests/
    ├── unit/
    │   ├── llm-client.test.ts
    │   ├── agent-tools.test.ts
    │   ├── agent-loop.test.ts
    │   ├── context-builder.test.ts
    │   └── useLLMKey.test.ts
    ├── integration/
    │   ├── Chat.test.tsx
    │   └── LLMSetup.test.tsx
    └── e2e/
        └── agent-chat.spec.ts
```

**Structure Decision**: Extension du monolith SPA existant. Pas de nouveau package — les nouveaux fichiers s'intègrent dans l'arborescence `src/` existante sous les mêmes conventions (lib/, hooks/, stores/, pages/, components/).

## TDD Strategy

### Phase order (red → green → refactor)

**Phase A — LLM Key Storage (sécurité d'abord)**
1. **Test**: `useLLMKey.test.ts` — encrypt/store/retrieve/decrypt round-trip
2. **Code**: `hooks/useLLMKey.ts` + extension `lib/storage.ts`
3. **Test**: `LLMSetup.test.tsx` — UI flow (saisie clé + provider)
4. **Code**: `components/LLMSetup.tsx`

**Phase B — Tool Definitions & Executors**
1. **Test**: `agent-tools.test.ts` — list_files, read_file, update_file, create_file against mock GitHub client
2. **Code**: `lib/agent-tools.ts`

**Phase C — LLM Client (abstraction + providers)**
1. **Test**: `llm-client.test.ts` — sendMessage with streaming mock, tool call parsing
2. **Code**: `lib/llm-client.ts`, `lib/llm-openai.ts`, `lib/llm-anthropic.ts`

**Phase D — Agent Loop**
1. **Test**: `agent-loop.test.ts` — full loop mock (LLM→tool→LLM→response), max 10 cap, error recovery
2. **Code**: `lib/agent-loop.ts`

**Phase E — Context Builder**
1. **Test**: `context-builder.test.ts` — builds system prompt from file tree + headings, token limit
2. **Code**: `lib/context-builder.ts`

**Phase F — Chat UI**
1. **Test**: `Chat.test.tsx` — render messages, send message triggers agent, streaming display
2. **Code**: `pages/Chat.tsx`, `components/ChatBubble.tsx`, `components/ChatInput.tsx`, `components/ToolCallIndicator.tsx`, `stores/chat.ts`

**Phase G — Integration & Polish**
1. **Test**: E2E `agent-chat.spec.ts` — full flow with intercepted API
2. **Code**: Route /chat, nav update, token counter, error states

## Complexity Tracking

> No constitution violations. Table not needed.
