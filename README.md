# Debug Agent — Frontend

React + Vite + TypeScript UI for [debug_agent](https://github.com/prasadiitian/debug_agent)'s
WebSocket interface. Submit an error/stack trace (optionally with attached
source files), and watch the agent's retrieval, tool use, and sandbox
verification stream in live — same wire protocol the CLI uses, different
renderer.

- `/` — landing page
- `/app` — the dashboard: sidebar with session history, a live transcript,
  and a composer that accepts pasted text, drag-and-drop, or attached files

## Setup

```bash
npm install
cp .env.example .env.local   # only needed if the backend isn't on the default host/port
npm run dev
```

The backend must be running separately:

```bash
# in the debug_agent repo
uv run debug-agent serve
```

Then open the Vite dev server URL (printed on `npm run dev`, typically
`http://localhost:5173`).

## How it works

One `WebSocket` connection to `ws://127.0.0.1:8000/ws/debug` per page load
(`src/useDebugSession.ts`). Submitting the composer sends a `debug_request`
frame, optionally carrying attached files as `{path, content}` pairs — the
server has no access to a browser client's filesystem, so this is how the
agent's `read_file` tool gets anything real to read. The hook normalises the
resulting `step`/`complete`/`error` frames into React state, merging
consecutive `reasoning` deltas into one entry and pairing each tool call with
its result (`src/toolSteps.ts`) so the transcript reads as a clean narrative
rather than a raw event log.

The wire types in `src/types.ts` are a hand-kept mirror of
`debug_agent/interface/schemas.py` in the backend repo. If that schema
changes, update both.

## Layout

```
src/
├── pages/
│   ├── Landing.tsx        # marketing page at "/"
│   └── Dashboard.tsx      # the app at "/app"
├── types.ts                # wire schema, mirrors schemas.py
├── useDebugSession.ts       # WebSocket connection + state normalisation
├── toolSteps.ts             # pairs tool_call with its result for rendering
├── attachments.ts           # client-side file-attach validation
├── useHealth.ts             # polls GET /health for the sidebar status line
├── useRecentSessions.ts     # session history, localStorage-backed
├── Markdown.tsx              # renders agent output as real Markdown
├── Logomark.tsx
└── index.css
```
