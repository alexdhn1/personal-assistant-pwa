# Data Model — File Viewer (003)

**Date**: 2026-05-06

## Entities

### FileTreeNode

Represents a node in the sidebar file tree.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Display name (e.g., "gifts.md", "areas") |
| path | string | Full relative path from root (e.g., "areas/gifts.md") |
| type | 'file' \| 'dir' | Node type |
| children | FileTreeNode[] | Sub-entries (only for type='dir', max 1 level) |

**Validation rules**:
- `name` is derived from the last segment of `path`
- `path` never starts with `/` (relative to rootFolder)
- `children` is empty array for files, populated for directories
- Only `.md` files are included (non-md filtered out)
- Empty directories (no .md children) are excluded

### ViewMode

The display state for the content area.

| Value | Description |
|-------|-------------|
| 'read' | Markdown content rendered via react-markdown |
| 'edit' | Raw content in textarea, with Save/Cancel buttons |

**State transitions**:
- `null → 'read'`: User clicks a file in the tree
- `'read' → 'edit'`: User clicks "Modifier" button
- `'edit' → 'read'`: User clicks "Annuler" or save succeeds
- `'read' → 'read'`: User clicks a different file (resets edit state)
- `'edit' → 'read'`: User clicks a different file (discards edits)

### Extended useFile hook state

| Field | Type | Description |
|-------|------|-------------|
| tree | FileTreeNode[] | 2-level file tree (root entries) |
| treeLoading | boolean | True while loading directory tree |
| files | FileEntry[] | (existing) flat file list from current listDir |
| content | string | (existing) current file content |
| currentPath | string | (existing) path of opened file |
| sha | string | (existing) SHA for optimistic locking |
| loading | boolean | (existing) file content loading |
| error | string \| null | (existing) error state |

## Relationships

```
FileTreeNode (root)
  └── FileTreeNode (dir: "areas")
        ├── FileTreeNode (file: "areas/gifts.md")
        ├── FileTreeNode (file: "areas/projects.md")
        └── FileTreeNode (file: "areas/health.md")
  └── FileTreeNode (file: "todo.md")
  └── FileTreeNode (file: "inbox.md")
```

The `currentPath` from useFile maps to a single `FileTreeNode.path`, establishing the "selected" state for sidebar highlighting.
