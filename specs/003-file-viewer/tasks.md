# Tasks: File Viewer

**Input**: Design documents from `/specs/003-file-viewer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: TDD is required per project constitution (P3). Tests are written first, must fail, then implementation makes them pass.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies needed. Ensure branch is ready and existing tests still pass.

- [X] T001 Verify branch `003-file-viewer` is checked out and all existing 93 tests pass with `npm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend useFile hook with tree loading capability — required by ALL user stories.

**⚠️ CRITICAL**: The `loadTree()` method must be complete before any UI work can begin.

### Tests

- [X] T002 Write unit tests for `loadTree()` in `src/tests/unit/useFile.test.ts` — test cases: builds 2-level FileTreeNode[], filters non-.md files, excludes empty dirs, handles listDir error
- [X] T003 Write FileTreeNode type definition in `src/hooks/useFile.ts` — export `FileTreeNode` interface (name, path, type, children)

### Implementation

- [X] T004 Implement `loadTree(rootFolder)` in `src/hooks/useFile.ts` — calls listDir(root), iterates dirs to call listDir(root/dir), builds FileTreeNode[], filters .md only, excludes empty dirs
- [X] T005 Add `tree`, `treeLoading`, `treeError` state fields to `useFile` hook return in `src/hooks/useFile.ts`

**Checkpoint**: `loadTree()` returns correct tree. Unit tests green. No UI yet.

---

## Phase 3: User Story 1 — Browse files in nested directories (Priority: P1) 🎯 MVP

**Goal**: Sidebar shows 2-level collapsible file tree. User can see all .md files including in subdirectories.

**Independent Test**: Open /edit → sidebar shows root files + expandable directories with nested .md files.

### Tests

- [X] T006 [US1] Rewrite integration test `src/tests/integration/Editor.test.tsx` — test: page renders file tree with root files and directories, directories are collapsible, clicking directory toggles children visibility, empty state shows message

### Implementation

- [X] T007 [P] [US1] Create `src/components/FileTree.tsx` — props: `tree: FileTreeNode[]`, `currentPath: string`, `onSelect: (path: string) => void`. Renders collapsible tree with `expanded: Set<string>` state, highlights selected file, filters by .md
- [X] T008 [US1] Rewrite `src/pages/Editor.tsx` — replace flat file list with FileTree component in sidebar, call `loadTree(rootFolder)` on mount, pass tree to FileTree, handle file selection via `openFile(path)`, show loading/empty states

**Checkpoint**: User Story 1 complete — sidebar shows full 2-level tree with collapsible directories. Clicking a file loads its content (as raw text for now).

---

## Phase 4: User Story 2 — View file content as rendered Markdown (Priority: P1)

**Goal**: Clicking a file renders its content as formatted Markdown instead of raw text.

**Independent Test**: Click a file in sidebar → content shows as rendered Markdown with proper headings, lists, links.

### Tests

- [X] T009 [US2] Add integration tests in `src/tests/integration/Editor.test.tsx` — test: clicking file renders Markdown (headings rendered as h1/h2), placeholder shown when no file selected, loading indicator during file fetch

### Implementation

- [X] T010 [P] [US2] Create `src/components/MarkdownView.tsx` — props: `content: string`. Uses react-markdown + remarkGfm, styled with Tailwind prose classes for readable typography
- [X] T011 [US2] Update `src/pages/Editor.tsx` content area — replace textarea with MarkdownView component when `viewMode === 'read'`, show placeholder when no file selected, show Skeleton during loading

**Checkpoint**: User Stories 1+2 complete — full read-only file browser. Users can navigate and read all their .md files with proper formatting.

---

## Phase 5: User Story 3 — Breadcrumb navigation (Priority: P2)

**Goal**: Display the current file path as a breadcrumb above the content.

**Independent Test**: Open `areas/gifts.md` → breadcrumb shows "areas / gifts.md".

### Tests

- [X] T012 [P] [US3] Add integration test in `src/tests/integration/Editor.test.tsx` — test: breadcrumb shows path segments for nested file, breadcrumb shows filename only for root file, no breadcrumb when no file selected

### Implementation

- [X] T013 [P] [US3] Create `src/components/FileBreadcrumb.tsx` — props: `path: string`. Splits path on `/`, renders segments separated by chevron, last segment is bold/current
- [X] T014 [US3] Add FileBreadcrumb to `src/pages/Editor.tsx` — render above content area when `currentPath` is set

**Checkpoint**: User Story 3 complete — user always sees which file is open.

---

## Phase 6: User Story 4 — Edit mode with save (Priority: P2)

**Goal**: "Modifier" button switches to textarea editor, "Save" commits, "Annuler" discards.

**Independent Test**: Click "Modifier" → textarea with raw content → edit → Save → commit on GitHub → back to Markdown view.

### Tests

- [X] T015 [US4] Add integration tests in `src/tests/integration/Editor.test.tsx` — test: "Modifier" button shows textarea with content, "Annuler" returns to Markdown view, "Save" calls writeFile and returns to read mode, save error shows message and preserves edits

### Implementation

- [X] T016 [US4] Add `viewMode` state and edit UI to `src/pages/Editor.tsx` — state `viewMode: 'read' | 'edit'`, "Modifier" button toggles to edit, textarea with draft state, "Save" button calls `save(draft)` then sets viewMode='read', "Annuler" button resets to read, error display preserves draft, switching files resets to read mode

**Checkpoint**: User Story 4 complete — full read/write workflow without needing the AI chat.

---

## Phase 7: User Story 5 — Error and empty states (Priority: P3)

**Goal**: Clear error messages and empty states for all failure scenarios.

**Independent Test**: Simulate network error → error message with retry. Empty folder → helpful message.

### Tests

- [X] T017 [P] [US5] Add integration tests in `src/tests/integration/Editor.test.tsx` — test: tree load error shows message with retry button, file read 404 shows "File not found", retry button calls loadTree again

### Implementation

- [X] T018 [US5] Add error/retry UI to `src/pages/Editor.tsx` — error banner for tree load failure with "Réessayer" button, file-level error message in content area, retry calls loadTree(rootFolder)

**Checkpoint**: User Story 5 complete — robust error handling for all scenarios.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation.

- [X] T019 [P] Remove unused imports and dead code from old Editor.tsx implementation
- [X] T020 Run `npm test` — all tests must pass (existing 93 + new tests)
- [X] T021 Run quickstart.md manual verification (7-step checklist)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all UI work
- **Phase 3 (US1 - Tree)**: Depends on Phase 2 (needs loadTree)
- **Phase 4 (US2 - Markdown)**: Depends on Phase 3 (needs file selection working)
- **Phase 5 (US3 - Breadcrumb)**: Depends on Phase 3 (needs currentPath set). Can run in PARALLEL with Phase 4.
- **Phase 6 (US4 - Edit)**: Depends on Phase 4 (needs read view to toggle from)
- **Phase 7 (US5 - Errors)**: Depends on Phase 3 (needs basic tree). Can run in PARALLEL with Phase 4-6.
- **Phase 8 (Polish)**: Depends on all desired phases complete

### Parallel Execution Opportunities

```
Phase 2 (loadTree) ─────────────────────────┐
                                             ▼
Phase 3 (FileTree + page) ──────────────────┐
                                             ├──▶ Phase 4 (MarkdownView)
                                             ├──▶ Phase 5 (Breadcrumb) [PARALLEL with 4]
                                             └──▶ Phase 7 (Errors) [PARALLEL with 4,5,6]
                                                   
Phase 4 (MarkdownView) ─────────────────────▶ Phase 6 (Edit mode)
                                                       │
                                                       ▼
                                              Phase 8 (Polish)
```

### Within Each User Story

Tests → Type definitions → Implementation → Integration verification

---

## Implementation Strategy

**MVP (minimum viable)**: Phases 1–4 (T001–T011) — gives a working read-only file browser with 2-level tree and Markdown rendering.

**Full feature**: All phases (T001–T021) — complete file viewer with edit, breadcrumb, and error states.

**Suggested order for single developer**: Sequential P1→P2→P3 since it's a small feature (~21 tasks).
