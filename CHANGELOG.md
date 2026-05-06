# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-01

### Added

#### Core Infrastructure
- Vite 8 + React 19 + TypeScript 6 project scaffold
- Tailwind CSS v4 with dark mode support
- PWA configuration (vite-plugin-pwa + Workbox) with service worker caching
- CI/CD pipelines (GitHub Actions: lint/test on PR, deploy to Pages on main)
- Vitest + React Testing Library for unit/integration tests
- Playwright for E2E tests (Chromium + Mobile Chrome Pixel 5)

#### Security
- `src/lib/crypto.ts` — PBKDF2 (250,000 iterations, SHA-256) + AES-GCM-256 token encryption
- `src/lib/storage.ts` — Dexie IndexedDB schema; encrypted blob stored under `auth` table
- Lockout after 5 failed unlock attempts (blob wiped)

#### GitHub Integration
- `src/lib/github-client.ts` — Octokit-based client with `readFile`, `listDir`, `writeFile`
- Dependency injection pattern for testability (5th arg to `createGitHubClient`)
- `AuthError` thrown on 401/403 responses

#### Authentication (US-1)
- `src/hooks/useAuth.ts` — setup (first time) + unlock (return) + lockout logic
- `src/pages/Auth.tsx` — dual-mode form: token+password (first time) or password only (return)
- Route guard (`RequireAuth`) redirects unauthenticated users to `/auth`
- Lock button in Layout clears session memory and redirects

#### Todo (US-2)
- `src/lib/markdown-parser.ts` — parse `## sections` + `- [x]/[ ] tasks` + `#tags`
- `src/hooks/useTodos.ts` — load, toggle, add, move tasks with GitHub commits
- `src/components/TodoItem.tsx` — checkbox with tag badges (#urgent=red, #admin=blue)
- `src/components/TaskInput.tsx` — quick-add input per section
- `src/pages/Todo.tsx` — full todo UI with section grouping and move menu

#### Inbox (US-3)
- `src/hooks/useInbox.ts` — append to daily `inbox/YYYY-MM-DD.md`, create if missing
- `src/pages/Inbox.tsx` — FAB button + modal capture form
- Floating action button (fixed bottom-right, violet)

#### Editor (US-4)
- `src/hooks/useFile.ts` — load file list, open, save with SHA tracking
- `src/pages/Editor.tsx` — file sidebar + textarea editor + save button

#### PWA & Polish
- `src/components/ErrorBoundary.tsx` — global error boundary with retry
- `src/components/Skeleton.tsx` — loading skeleton component
- Offline detection banner in Layout
- Dark/light/auto theme via Tailwind `dark:` classes + `useSettingsStore`
- SVG app icons (192×192 and 512×512) in violet brand color

### Architecture Notes
- No backend — all data stored in GitHub via API
- Token never touches localStorage — Zustand in-memory + IndexedDB encrypted blob
- All features follow TDD: tests written first (failing), then implementation
