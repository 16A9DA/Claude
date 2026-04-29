# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (Vitest)
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx  # Run a single test file
npm run db:reset     # Reset SQLite database (destructive)
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already wired into npm scripts) due to Node.js/Next.js compatibility shims.

## Architecture

### Virtual File System
The core data model is `VirtualFileSystem` (`src/lib/file-system.ts`) — an in-memory tree of `FileNode` objects. No generated code is ever written to disk. The VFS is serialized to JSON to cross the client/server boundary and persisted in the `Project.data` column (SQLite) for authenticated users.

### AI Pipeline
`/api/chat` (`src/app/api/chat/route.ts`) accepts the current VFS state and chat messages, streams a response via Vercel AI SDK, and applies two tools server-side and client-side:
- `str_replace_editor` — create/str_replace/insert operations on VFS files
- `file_manager` — rename/delete operations

The model is `claude-haiku-4-5` (`src/lib/provider.ts`). When `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` is used instead, returning static component code.

### Live Preview
`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders generated components inside a sandboxed `<iframe>` using `srcdoc`. The JSX transformer (`src/lib/transform/jsx-transformer.ts`) uses `@babel/standalone` to compile each file client-side, creates blob URLs, and wires them together with an ES module import map. Third-party packages are resolved via `https://esm.sh/`. Tailwind CSS is injected via CDN script tag in the preview HTML.

### Context Hierarchy
```
FileSystemProvider   ← owns VirtualFileSystem instance, handles tool call mutations
  └─ ChatProvider    ← wraps Vercel AI SDK useChat, passes serialized VFS in request body
       └─ UI components (ChatInterface, PreviewFrame, CodeEditor, FileTree)
```

`FileSystemContext` exposes `handleToolCall` which intercepts AI tool calls streamed from the server and applies them to the local VFS instance, triggering a `refreshTrigger` increment that re-renders the preview.

### Auth
JWT-based session stored in an HTTP-only cookie (`auth-token`). Server actions live in `src/actions/`. Passwords hashed with bcrypt. The `server-only` package ensures auth utilities never bundle client-side.

### Database
Prisma with SQLite (`prisma/dev.db`). Client is generated to `src/generated/prisma` (not `node_modules`). Schema has two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings.

### Testing
Vitest with jsdom and React Testing Library. Tests are colocated in `__tests__` directories next to the files they test.
