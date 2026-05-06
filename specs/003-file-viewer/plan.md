# Implementation Plan: File Viewer

**Branch**: `003-file-viewer` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-file-viewer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the existing Editor page (flat file list + textarea) with a File Viewer featuring a 2-level directory tree sidebar with collapsible directories, rendered Markdown view (react-markdown), breadcrumb navigation, and a toggle to switch to edit mode with save functionality. Reuses existing `useFile` hook (extended for recursive listing) and `github-client.ts`.

## Technical Context

**Language/Version**: TypeScript 6.0.2 strict, React 19.2.5  
**Primary Dependencies**: react-markdown ^10.1.0 + remark-gfm (existing), Tailwind CSS v4 (existing)  
**Storage**: GitHub API via @octokit/rest (existing github-client.ts)  
**Testing**: Vitest 4 + React Testing Library (existing)  
**Target Platform**: PWA — browser (desktop + mobile)
**Project Type**: Web application (client-side SPA)  
**Performance Goals**: File tree loads <3s, file content renders <1s  
**Constraints**: Offline-tolerant (read), write requires connection, 2-level depth max  
**Scale/Scope**: Single user, <100 files in repo typically

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| P1 — Source de vérité unique : GitHub | ✅ PASS | All reads/writes go through GitHub API. No local persistence. |
| P2 — Mobile-first, offline-tolerant | ✅ PASS | Responsive layout, read-only from cache acceptable |
| P3 — TDD strict | ✅ PASS | Tests written before implementation per spec constraints |
| P4 — Sécurité des secrets | ✅ PASS | No new secrets introduced; reuses existing auth flow |
| P5 — Pas de backend serveur | ✅ PASS | 100% client-side, API calls from browser |
| P6 — Simplicité avant fonctionnalités | ✅ PASS | Replaces existing page with better UX, justified by daily use |
| P7 — Stack stable et connue | ✅ PASS | No new dependencies; uses react-markdown already installed |
| P8 — Versioning et observabilité | ✅ PASS | Commits via writeFile with descriptive messages |

**GATE RESULT**: All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-file-viewer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── FileTree.tsx          # NEW — sidebar tree component
│   ├── FileBreadcrumb.tsx    # NEW — breadcrumb path display
│   └── MarkdownView.tsx      # NEW — rendered markdown content
├── hooks/
│   └── useFile.ts            # MODIFIED — add loadTree() for 2-level listing
├── pages/
│   └── Editor.tsx            # REPLACED — full rewrite as File Viewer
└── tests/
    ├── unit/
    │   └── useFile.test.ts   # EXTENDED — tests for loadTree
    └── integration/
        └── Editor.test.tsx   # REWRITTEN — tests for new File Viewer
```

**Structure Decision**: Single project, web application. All new code goes into existing `src/` structure. 3 new components, 1 modified hook, 1 rewritten page, corresponding tests.

## Complexity Tracking

No violations — no tracking needed.
