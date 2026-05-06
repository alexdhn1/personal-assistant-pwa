# Quickstart — AI Agent Chat (002)

**Date**: 2026-05-06

## Prerequisites

- Feature 001-personal-assistant fully implemented and working
- GitHub auth flow functional (token stored, password unlocks)
- `npm run dev` serves the app on localhost

## Setup for Development

```bash
# Switch to feature branch
git checkout 002-ai-agent-chat

# Install new dependencies
npm install openai @anthropic-ai/sdk

# Run tests (TDD — write tests first)
npm test

# Dev server
npm run dev
```

## New Dependencies

| Package | Purpose | Size |
|---|---|---|
| `openai` | OpenAI API SDK (streaming, function calling) | ~91 KB min |
| `@anthropic-ai/sdk` | Anthropic API SDK (streaming, tool use) | ~60 KB min |

## Key Files to Create (in TDD order)

1. `src/tests/unit/agent-tools.test.ts` → then `src/lib/agent-tools.ts`
2. `src/tests/unit/llm-client.test.ts` → then `src/lib/llm-client.ts`
3. `src/tests/unit/agent-loop.test.ts` → then `src/lib/agent-loop.ts`
4. `src/tests/unit/context-builder.test.ts` → then `src/lib/context-builder.ts`
5. `src/tests/unit/useLLMKey.test.ts` → then `src/hooks/useLLMKey.ts`
6. `src/tests/integration/Chat.test.tsx` → then `src/pages/Chat.tsx`
7. `src/tests/integration/LLMSetup.test.tsx` → then `src/components/LLMSetup.tsx`

## Testing Strategy

- **Unit tests**: Mock both LLM SDKs and GitHub client. Test tool execution, agent loop logic, context building.
- **Integration tests**: Mock LLM responses (intercept fetch), test full chat flow with rendering.
- **E2E tests**: Intercept real API calls via Playwright, test complete user journey.

## Environment Variables (for E2E only)

```bash
# Only needed for E2E tests (never in client code)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Quick Verification

After implementation, verify:

1. Open app → navigate to /chat
2. First time: prompted for API key + provider
3. Type "Ajoute 'acheter du pain' dans ma todo section Today"
4. Agent calls read_file(todo.md), modifies content, calls update_file
5. Confirmation message appears with commit SHA
6. Check GitHub repo — commit is visible
