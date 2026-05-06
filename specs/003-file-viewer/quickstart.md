# Quickstart — File Viewer (003)

**Date**: 2026-05-06

## Prerequisites

- Features 001 and 002 implemented and working
- GitHub auth flow functional (token stored, password unlocks)
- `npm run dev` serves the app on localhost
- react-markdown + remark-gfm already installed

## Setup for Development

```bash
# Switch to feature branch
git checkout 003-file-viewer

# No new dependencies needed — all already installed

# Run tests (TDD — write tests first)
npm test

# Dev server
npm run dev
```

## New Dependencies

None — all required packages are already in the project.

## Key Files to Create/Modify (in TDD order)

1. `src/tests/unit/useFile.test.ts` (EXTEND) → then `src/hooks/useFile.ts` (add `loadTree`)
2. `src/tests/integration/Editor.test.tsx` (REWRITE) → then components + page:
   - `src/components/FileTree.tsx`
   - `src/components/FileBreadcrumb.tsx`
   - `src/components/MarkdownView.tsx`
   - `src/pages/Editor.tsx` (full rewrite)

## Testing Strategy

- **Unit tests**: Mock GitHubClient, test `loadTree()` returns correct 2-level tree structure, filters non-.md files, handles errors
- **Integration tests**: Mock GitHub API responses, test full flow: tree renders → click file → Markdown displays → toggle edit → save
- **No E2E for v1**: Manual verification sufficient given integration test coverage

## Quick Verification

After implementation, verify:

1. Open app → navigate to /edit (same route as before)
2. Sidebar shows file tree with directories (e.g., `areas/`) expandable
3. Click a nested file (e.g., `areas/gifts.md`) → content renders as Markdown
4. Breadcrumb shows "areas / gifts.md"
5. Click "Modifier" → textarea with raw content
6. Edit and click "Save" → commit on GitHub, back to Markdown view
7. Click "Annuler" → back to Markdown view without saving
