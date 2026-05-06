# Feature Specification: File Viewer

**Feature Branch**: `003-file-viewer`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Remplacer la page Edit par un File Viewer avec arborescence 2 niveaux, rendu Markdown readonly, et mode édition toggle"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse files in nested directories (Priority: P1)

As a user, I want to see all my markdown files including those in subdirectories (e.g., `areas/gifts.md`, `areas/projects.md`) in a sidebar tree view, so I can navigate my entire file structure without guessing paths.

**Why this priority**: Without file discovery, no other feature works. Users currently cannot see files in subdirectories at all.

**Independent Test**: Can be fully tested by opening the Files page and verifying that both root-level files (todo.md, inbox.md) and subdirectory files (areas/gifts.md) appear in the sidebar tree.

**Acceptance Scenarios**:

1. **Given** the user opens the Files page, **When** the page loads, **Then** the sidebar displays root-level .md files AND directories with their contents (2 levels deep)
2. **Given** a directory `areas/` contains 3 .md files, **When** the page loads, **Then** `areas/` appears as a collapsible group containing those 3 files
3. **Given** a directory is displayed, **When** the user clicks the directory name, **Then** it toggles between expanded and collapsed states
4. **Given** the root folder is empty, **When** the page loads, **Then** a "No files found" message is shown

---

### User Story 2 - View file content as rendered Markdown (Priority: P1)

As a user, I want to click on a file and see its content rendered as formatted Markdown (headings, lists, links, tables), so I can read my notes comfortably without raw syntax.

**Why this priority**: Reading files is the primary use case — most users browse more often than they edit.

**Independent Test**: Can be fully tested by clicking a file in the sidebar and verifying the content renders with proper Markdown formatting (headings, bold, lists).

**Acceptance Scenarios**:

1. **Given** the user clicks a .md file in the sidebar, **When** the file loads, **Then** its content is rendered as formatted Markdown (not raw text)
2. **Given** a file contains headings, lists, and links, **When** displayed, **Then** all Markdown elements render correctly (react-markdown + remark-gfm)
3. **Given** the user has no file selected, **When** viewing the page, **Then** a placeholder message invites them to select a file
4. **Given** a file is loading, **When** the request is in progress, **Then** a loading indicator is shown

---

### User Story 3 - Breadcrumb navigation (Priority: P2)

As a user, I want to see the current file's path as a breadcrumb (e.g., "areas / gifts.md"), so I always know which file I'm viewing.

**Why this priority**: Provides orientation context but isn't blocking for core read/write functionality.

**Independent Test**: Can be fully tested by opening a nested file and verifying the breadcrumb displays the correct path segments.

**Acceptance Scenarios**:

1. **Given** the user opens `areas/gifts.md`, **When** the file is displayed, **Then** a breadcrumb shows "areas / gifts.md"
2. **Given** the user opens `todo.md` (root-level), **When** the file is displayed, **Then** the breadcrumb shows "todo.md"

---

### User Story 4 - Edit mode with save (Priority: P2)

As a user, I want a "Modifier" button that switches from Markdown view to a textarea editor, so I can make quick changes and save them back to GitHub.

**Why this priority**: Editing is secondary to viewing, but essential for a complete workflow without switching to the chat.

**Independent Test**: Can be fully tested by clicking "Modifier", changing text, clicking "Save", and verifying the commit appears on GitHub.

**Acceptance Scenarios**:

1. **Given** a file is displayed in read mode, **When** the user clicks "Modifier", **Then** the view switches to a textarea pre-filled with the raw Markdown content
2. **Given** the user is in edit mode, **When** they modify text and click "Save", **Then** the file is committed to GitHub and a success confirmation appears
3. **Given** the user is in edit mode, **When** they click "Annuler" (cancel), **Then** the view returns to rendered Markdown without saving
4. **Given** a save fails (e.g., conflict), **When** the error occurs, **Then** an error message is displayed and the user's edits are preserved

---

### User Story 5 - Error and empty states (Priority: P3)

As a user, I want clear feedback when something goes wrong (network error, file not found) or when there are no files.

**Why this priority**: Edge case handling for robustness, not core functionality.

**Independent Test**: Can be tested by simulating a network error and verifying an error message appears.

**Acceptance Scenarios**:

1. **Given** the GitHub API returns an error, **When** listing files, **Then** an error message is displayed with a retry option
2. **Given** a file read fails with 404, **When** trying to open it, **Then** a "File not found" message appears
3. **Given** the root folder contains no .md files, **When** the page loads, **Then** a helpful empty state message is shown

---

### Edge Cases

- What happens when a directory has more than 2 levels of nesting? Only 2 levels are displayed.
- What happens if a file is deleted on GitHub while the user is viewing it? Save returns a conflict error; user sees error message.
- What happens when the user switches files while in edit mode with unsaved changes? The edit is discarded (no unsaved-changes warning in v1).
- What happens on slow network? Loading indicators appear for both sidebar and content area.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a sidebar tree listing all .md files in the root folder and one level of subdirectories
- **FR-002**: Directories in the sidebar MUST be collapsible/expandable with a toggle click
- **FR-003**: Clicking a file MUST display its content rendered as Markdown using react-markdown and remark-gfm
- **FR-004**: System MUST display a breadcrumb showing the current file's path segments
- **FR-005**: A "Modifier" button MUST switch the view from Markdown rendering to a textarea editor
- **FR-006**: In edit mode, a "Save" button MUST commit the file content to GitHub via writeFile
- **FR-007**: In edit mode, a "Cancel" button MUST discard changes and return to Markdown view
- **FR-008**: System MUST show loading indicators during file listing and file reading operations
- **FR-009**: System MUST display user-friendly error messages when API calls fail
- **FR-010**: The currently selected file MUST be visually highlighted in the sidebar
- **FR-011**: System MUST reuse the existing `/edit` route (replace Editor.tsx implementation)
- **FR-012**: Directories with zero .md files MUST be hidden from the tree

### Key Entities

- **FileTreeEntry**: Represents a file or directory in the sidebar — name, path, type (file/dir), children (for directories)
- **ViewMode**: The current display state — "read" (Markdown rendered) or "edit" (textarea)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can browse and open any .md file within 2 levels of the root folder in under 3 seconds
- **SC-002**: Users can read file content in formatted Markdown without any raw syntax visible
- **SC-003**: Users can edit and save a file in under 5 clicks (select file → Modifier → edit → Save)
- **SC-004**: 100% of subdirectory files (e.g., areas/gifts.md) are visible and accessible from the sidebar
- **SC-005**: Error states provide clear, actionable feedback within 1 second of failure

## Assumptions

- The root folder is configured in settings (reuse `settings.rootFolder`)
- Maximum nesting depth supported is 2 levels (root + one subdirectory) — deeper structures are not displayed
- Only `.md` files are shown; other file types are hidden
- react-markdown and remark-gfm are already installed and used in the Todo page
- The existing `useFile` hook, `github-client.ts` listDir/readFile/writeFile are available for reuse
- No unsaved-changes confirmation dialog in v1 (switching files discards edits)
- Mobile-responsive layout is not required in v1 (desktop sidebar + content layout)
- The existing `/edit` route stays; only the page component implementation changes
