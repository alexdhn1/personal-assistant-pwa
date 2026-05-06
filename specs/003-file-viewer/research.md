# Research — File Viewer (003)

**Date**: 2026-05-06

## R1: Best approach for 2-level recursive file listing

**Decision**: Extend `useFile` hook with a new `loadTree()` method that calls `listDir(root)` then iterates directories to call `listDir(root/dir)` for each.

**Rationale**: 
- The GitHub Contents API already supports listing directory contents
- `github-client.ts` `listDir` already works perfectly
- No new API calls needed, just sequential listDir calls (one per subdirectory)
- Max depth = 2 → bounded number of API calls (1 + N directories)
- Same pattern already used in `useAgent.ts` context builder (proven)

**Alternatives considered**:
- Git Trees API (`GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`): Would get all levels in one call but returns blobs/trees, needs SHA resolution, more complex parsing. Overkill for 2 levels.
- Single flat call: Only gets 1 level, doesn't solve the problem.

---

## R2: File tree component pattern (collapsible directories)

**Decision**: Simple state-driven component with `expanded: Set<string>` tracking which directories are open. Toggle on click.

**Rationale**:
- At most ~10 directories with ~5 files each = trivial state
- No need for virtualization or lazy loading at this scale
- Native `<details>/<summary>` HTML was considered but gives less styling control with Tailwind

**Alternatives considered**:
- Third-party tree component (react-arborist, rc-tree): Too heavy for 50 items, violates P7 (no new deps)
- Headless UI Disclosure: Could work but adds complexity for a simple toggle

---

## R3: Markdown rendering in read mode

**Decision**: Use existing `react-markdown` + `remark-gfm` (already in package.json). Same pattern as used in `ChatBubble.tsx`.

**Rationale**:
- Already installed and configured
- Supports GFM (tables, strikethrough, task lists)
- Zero new dependencies

**Alternatives considered**:
- marked + DOMPurify: Manual sanitization needed, more code, less React-idiomatic
- @mdx-js/react: Overkill for display-only rendering

---

## R4: Edit mode toggle pattern

**Decision**: Local state `viewMode: 'read' | 'edit'` in the page component. Toggle button switches between MarkdownView and textarea.

**Rationale**:
- Simple, no global state needed
- Edit mode is ephemeral (lost on navigation, per spec)
- Reuses existing `save()` from `useFile` hook

**Alternatives considered**:
- Separate route (/edit/:path vs /view/:path): Adds routing complexity for no benefit
- Modal editor: Bad UX on mobile

---

## R5: Impact on existing Editor.tsx tests

**Decision**: Rewrite `Editor.test.tsx` completely for new File Viewer behavior. Old tests become irrelevant.

**Rationale**:
- The page is being fully replaced (same route, different implementation)
- Old tests test textarea-only behavior which no longer applies
- Integration test should cover: tree rendering, file selection, Markdown view, edit toggle, save

**Alternatives considered**:
- Keep old tests and add new ones: Old tests would all fail, pointless to maintain both
