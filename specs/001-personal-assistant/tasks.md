# Tasks: Personal Assistant PWA

**Input**: Design documents from `/specs/001-personal-assistant/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Included — Constitution P3 mandates TDD (red → green → refactor).

**Organization**: Tasks grouped by user story (US-1 to US-4 for v1). US-5 deferred to v1.2, US-6 deferred to v1.5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (PWA)**: `src/`, `tests/` at repository root
- Structure follows plan.md architecture section

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, CI/CD

- [ ] T001 Initialize Vite 5 + React 18 + TypeScript 5 strict project with `npm create vite@latest . -- --template react-ts`
- [ ] T002 Install core dependencies: tailwindcss, @headlessui/react, react-router-dom, zustand, dexie, @octokit/rest, react-markdown, remark-gfm
- [ ] T003 [P] Configure Tailwind CSS in tailwind.config.ts and src/index.css
- [ ] T004 [P] Configure Vitest + @testing-library/react + jsdom in vitest.config.ts
- [ ] T005 [P] Configure Playwright in playwright.config.ts
- [ ] T006 [P] Configure vite-plugin-pwa with manifest.json (name, icons, theme_color, start_url)
- [ ] T007 [P] Create GitHub Actions CI workflow in .github/workflows/ci.yml (lint + typecheck + test)
- [ ] T008 [P] Create GitHub Actions deploy workflow in .github/workflows/deploy.yml (build + deploy to GitHub Pages)
- [ ] T009 Create base project structure: src/pages/, src/components/, src/hooks/, src/lib/, src/stores/, src/tests/

**Checkpoint**: Project builds, tests run (empty), CI green, PWA manifest valid

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on — crypto, storage, GitHub client, app shell

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (write FIRST, must FAIL)

- [ ] T010 [P] Unit test for encrypt/decrypt round-trip in src/tests/unit/crypto.test.ts
- [ ] T011 [P] Unit test for Dexie storage read/write encrypted token in src/tests/unit/storage.test.ts
- [ ] T012 [P] Unit test for GitHub client (mock Octokit): read file, list dir, write file in src/tests/unit/github-client.test.ts

### Implementation

- [ ] T013 Implement PBKDF2 + AES-GCM encrypt/decrypt in src/lib/crypto.ts
- [ ] T014 Implement Dexie schema and storage queries in src/lib/storage.ts
- [ ] T015 Implement Octokit wrapper (read file, list dir, write file with SHA, detect 401/403 and throw typed `AuthError` for forced re-auth) in src/lib/github-client.ts
- [ ] T015b Implement `useGitHub` React hook wrapping github-client with auth store integration in src/hooks/useGitHub.ts
- [ ] T016 [P] Create Zustand auth store in src/stores/auth.ts
- [ ] T017 [P] Create Zustand files store in src/stores/files.ts
- [ ] T018 [P] Create Zustand settings store in src/stores/settings.ts
- [ ] T019 Create App shell with React Router layout in src/App.tsx (routes: /auth, /todo, /editor, /inbox)
- [ ] T020 [P] Create base responsive layout with mobile bottom nav in src/components/Layout.tsx

**Checkpoint**: Foundation ready — crypto tested, GitHub client tested, app shell renders, stores initialized

---

## Phase 3: User Story 1 — Authentification (Priority: P1) 🎯 MVP

**Goal**: User enters password to decrypt stored GitHub token and access repo. First-time setup flow included.

**Independent Test**: Can be fully tested by launching app, entering token + password (first use) or password only (return), and verifying GitHub API connectivity.

### Tests for User Story 1

> **Write FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US1] Unit test for useAuth hook (happy path, 5 failed attempts wipe) in src/tests/unit/useAuth.test.ts
- [ ] T022 [P] [US1] Component test for Auth page (first-time flow + return flow) in src/tests/integration/Auth.test.tsx

### Implementation for User Story 1

- [ ] T023 [US1] Implement useAuth hook (setup, unlock, lockout logic, handle `AuthError` from github-client → wipe session and redirect to /auth) in src/hooks/useAuth.ts
- [ ] T024 [US1] Implement Auth page UI (token input, password input, error states) in src/pages/Auth.tsx
- [ ] T025 [US1] Add route guard: redirect to /auth if not authenticated in src/App.tsx
- [ ] T026 [US1] Add logout/lock functionality and session management (token in memory only, cleared on refresh)

**Checkpoint**: US-1 fully functional — user can setup token, unlock with password, gets locked out after 5 failures

---

## Phase 4: User Story 2 — Vue Todo (Priority: P2)

**Goal**: Display `assistant/todo.md` as interactive task list grouped by section, with toggle and add capabilities.

**Independent Test**: Can be fully tested by loading todo.md from GitHub, viewing grouped tasks, toggling a checkbox (verifying commit), and adding a new task.

### Tests for User Story 2

> **Write FIRST, ensure they FAIL before implementation**

- [ ] T027 [P] [US2] Unit test for markdown-parser (parse sections, checkboxes, tags) in src/tests/unit/markdown-parser.test.ts
- [ ] T028 [P] [US2] Unit test for useTodos hook (read, toggle, add via mock GitHub) in src/tests/unit/useTodos.test.ts
- [ ] T029 [P] [US2] Component test for Todo page (render sections, toggle, add) in src/tests/integration/Todo.test.tsx

### Implementation for User Story 2

- [ ] T030 [US2] Implement markdown task parser (sections, checkboxes, tags extraction) in src/lib/markdown-parser.ts
- [ ] T031 [US2] Implement useTodos hook (fetch todo.md, parse, toggle, add, commit) in src/hooks/useTodos.ts
- [ ] T032 [P] [US2] Create TodoItem component (checkbox, description, tag badges with color mapping: #urgent=red, #admin=blue, custom=gray) in src/components/TodoItem.tsx
- [ ] T033 [P] [US2] Create TaskInput component (quick add to section) in src/components/TaskInput.tsx
- [ ] T034 [US2] Implement Todo page (grouped sections, toggle commits, add task) in src/pages/Todo.tsx
- [ ] T035 [US2] Add section move functionality (move task between sections via menu) in src/pages/Todo.tsx

**Checkpoint**: US-2 fully functional — todo.md rendered as interactive list, toggles commit, tasks addable

---

## Phase 5: User Story 3 — Inbox / Capture rapide (Priority: P3)

**Goal**: Floating "+" button opens modal for quick note capture, appends to `inbox/YYYY-MM-DD.md` and commits.

**Independent Test**: Can be fully tested by tapping "+", typing a note, saving, and verifying the commit to inbox file.

### Tests for User Story 3

> **Write FIRST, ensure they FAIL before implementation**

- [ ] T036 [P] [US3] Unit test for useInbox hook (append to dated file, create if not exists) in src/tests/unit/useInbox.test.ts
- [ ] T037 [P] [US3] Component test for Inbox modal (open, type, save, close) in src/tests/integration/Inbox.test.tsx

### Implementation for User Story 3

- [ ] T038 [US3] Implement useInbox hook (append mode write to inbox/YYYY-MM-DD.md, create/commit) in src/hooks/useInbox.ts
- [ ] T039 [US3] Create floating action button component (visible on all pages) in src/components/FloatingActionButton.tsx
- [ ] T040 [US3] Create Inbox modal (textarea, destination dropdown, save/cancel) in src/pages/Inbox.tsx
- [ ] T041 [US3] Integrate FAB + Inbox modal into Layout component in src/components/Layout.tsx

**Checkpoint**: US-3 fully functional — "+" opens modal, note saved to inbox/YYYY-MM-DD.md via commit

---

## Phase 6: User Story 4 — Édition de fichiers (Priority: P4)

**Goal**: Browse `assistant/` directory, open any .md, edit in textarea with preview, save via commit.

**Independent Test**: Can be fully tested by opening file tree, selecting a .md file, editing content, saving, and verifying commit with correct SHA.

### Tests for User Story 4

> **Write FIRST, ensure they FAIL before implementation**

- [ ] T042 [P] [US4] Unit test for useFile hook (load, dirty state, save with SHA check) in src/tests/unit/useFile.test.ts
- [ ] T043 [P] [US4] Component test for Editor page (load file, edit, preview toggle, save) in src/tests/integration/Editor.test.tsx

### Implementation for User Story 4

- [ ] T044 [US4] Implement useFile hook (fetch file, track dirty state, save with SHA, conflict detection) in src/hooks/useFile.ts
- [ ] T045 [US4] Create FileTree component (list assistant/ directory, navigate subfolders) in src/components/FileTree.tsx
- [ ] T046 [US4] Create MarkdownPreview component (render with react-markdown + remark-gfm) in src/components/MarkdownPreview.tsx
- [ ] T047 [US4] Implement Editor page (split view desktop, toggle mobile, textarea + preview, save button with optional commit message input field) in src/pages/Editor.tsx
- [ ] T048 [US4] Add unsaved changes indicator and confirm-before-leave guard in src/pages/Editor.tsx
- [ ] T049 [US4] Handle SHA conflict: alert user, offer reload or force-push in src/hooks/useFile.ts

**Checkpoint**: US-4 fully functional — files browsable, editable, saveable with conflict detection

---

## Phase 7: PWA Hardening & E2E

**Purpose**: Ensure PWA installability, offline read, Lighthouse scores, E2E tests on critical flows

- [ ] T050 [P] E2E test: first-time setup flow (token + password → home) in src/tests/e2e/auth-setup.spec.ts
- [ ] T051 [P] E2E test: return flow (password only → home) in src/tests/e2e/auth-return.spec.ts
- [ ] T052 [P] E2E test: toggle checkbox in todo.md → commit in src/tests/e2e/todo-toggle.spec.ts
- [ ] T053 [P] E2E test: inbox capture → inbox/YYYY-MM-DD.md created in src/tests/e2e/inbox-capture.spec.ts
- [ ] T054 [P] E2E test: edit file and save → commit in src/tests/e2e/editor-save.spec.ts
- [ ] T055 Configure service worker caching strategy (stale-while-revalidate for .md files) in vite.config.ts
- [ ] T056 Add maskable + apple-touch icons (192x192, 512x512) in public/icons/
- [ ] T057 Test PWA install prompt on Android Chrome and iOS Safari
- [ ] T058 Run Lighthouse audit, fix issues until PWA ≥ 90, Performance ≥ 80, A11y ≥ 90

**Checkpoint**: App installable, offline-read works, all E2E green, Lighthouse targets met

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, UX polish, documentation

- [ ] T059 [P] Implement global error boundary with user-friendly error display in src/components/ErrorBoundary.tsx
- [ ] T060 [P] Add loading skeletons for file/todo loading states in src/components/Skeleton.tsx
- [ ] T061 Implement rate limit handling: display reset countdown, block writes in src/lib/github-client.ts
- [ ] T062 Implement offline detection: show banner, disable write operations in src/components/Layout.tsx
- [ ] T063 [P] Add dark/light/auto theme support via Tailwind + settings store in src/stores/settings.ts
- [ ] T064 Write README.md with setup instructions, architecture overview, and development guide
- [ ] T065 Create CHANGELOG.md with v1.0.0 entries
- [ ] T066 Final bundle size check (target < 300 KB gzip) and optimization if needed

**Checkpoint**: Production-ready v1 — polished, documented, performant

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US-1 Auth (Phase 3)**: Depends on Foundational — BLOCKS US-2, US-3, US-4 (need auth to access GitHub)
- **US-2 Todo (Phase 4)**: Depends on US-1 (needs authenticated GitHub client)
- **US-3 Inbox (Phase 5)**: Depends on US-1 (needs authenticated GitHub client) — can run in PARALLEL with US-2
- **US-4 Editor (Phase 6)**: Depends on US-1 (needs authenticated GitHub client) — can run in PARALLEL with US-2, US-3
- **PWA Hardening (Phase 7)**: Depends on US-1 through US-4 being complete
- **Polish (Phase 8)**: Can partially overlap with Phase 7

### User Story Dependencies

- **US-1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US-2 (P2)**: Depends on US-1 for auth. Independent of US-3, US-4
- **US-3 (P3)**: Depends on US-1 for auth. Independent of US-2, US-4
- **US-4 (P4)**: Depends on US-1 for auth. Independent of US-2, US-3

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Hooks/logic before UI components
- Components before page integration
- Story complete before moving to next priority (or parallel if capacity allows)

### Parallel Opportunities

- Setup tasks T003–T009 all parallelizable
- Foundational tests T010–T012 parallelizable
- After US-1 complete: US-2, US-3, US-4 can proceed in parallel
- All E2E tests (T050–T054) parallelizable
- Polish tasks T059–T063 partially parallelizable

---

## Parallel Example: After US-1 Complete

```bash
# Once auth works, three stories can start in parallel:

# Stream A: User Story 2 (Todo)
Task T027: "Unit test for markdown-parser in src/tests/unit/markdown-parser.test.ts"
Task T028: "Unit test for useTodos in src/tests/unit/useTodos.test.ts"
Task T030: "Implement markdown-parser in src/lib/markdown-parser.ts"
...

# Stream B: User Story 3 (Inbox)
Task T036: "Unit test for useInbox in src/tests/unit/useInbox.test.ts"
Task T038: "Implement useInbox in src/hooks/useInbox.ts"
...

# Stream C: User Story 4 (Editor)
Task T042: "Unit test for useFile in src/tests/unit/useFile.test.ts"
Task T044: "Implement useFile in src/hooks/useFile.ts"
...
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Auth)
4. **STOP and VALIDATE**: App opens, token encrypted, password unlocks access
5. Deploy to GitHub Pages — minimal but functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US-1 (Auth) → Test independently → Deploy (MVP!)
3. Add US-2 (Todo) → Test independently → Deploy
4. Add US-3 (Inbox) → Test independently → Deploy
5. Add US-4 (Editor) → Test independently → Deploy
6. PWA hardening + Polish → Final v1 release

### Single Developer Strategy (recommended)

Sequential priority order with TDD discipline:
1. Phase 1 → Phase 2 → Phase 3 (MVP at this point)
2. Phase 4 → Phase 5 → Phase 6 (full v1 features)
3. Phase 7 → Phase 8 (production-ready)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Constitution P3 mandates TDD: all tests written and failing before implementation
- US-5 (Calendar) deferred to v1.2 — not included in this task list
- US-6 (Notifications) deferred to v1.5 — not included
- Commit after each task or logical group (Constitution P8)
- Each checkpoint is a deployable increment
