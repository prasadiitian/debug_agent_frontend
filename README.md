# Debug Agent — Frontend

React + Vite + TypeScript UI for [debug_agent](https://github.com/prasadiitian/debug_agent)'s
WebSocket interface. Submits an error/stack trace and streams the agent's
reasoning, tool calls, and sandbox verification live, exactly as the CLI does
— same wire protocol, different renderer.

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
(`src/useDebugSession.ts`). Submitting the form sends a `debug_request`
frame; the hook normalises the resulting `step`/`complete`/`error` frames
into React state — merging consecutive `reasoning` deltas into one entry the
same way the CLI does, so the wire protocol only needs to be understood once.

The wire types in `src/types.ts` are a hand-kept mirror of
`debug_agent/interface/schemas.py` in the backend repo. If that schema
changes, update both.

## Status

`npm run build`, `npm run lint`, and the Vite dev server all run clean. The
message-handling logic in `useDebugSession.ts` (the `appendStep`/
`handleMessage` reducer) has been round-tripped against a real live session
on the real backend — a script outside this repo drove the actual
`/ws/debug` endpoint through a full session and fed every real frame through
a copy of that same reducer logic, confirming all five step types
(`session_start`, `reasoning`, `tool_call`, `tool_result`, `verification`)
parse correctly and reasoning deltas merge as intended, with no unrecognised
frame types.

What that verification does **not** cover: the app has not been opened in an
actual browser, so the JSX/CSS rendering itself — layout, whether the form
actually re-enables after a session, whether `<details>` expands — is
unconfirmed. The state-management logic is proven against real data; the DOM
output built from that state is not yet eyeballed.

## Layout

```
src/
├── types.ts             # wire schema, mirrors schemas.py
├── useDebugSession.ts    # WebSocket connection + state normalisation
├── App.tsx               # form, live step log, final report
├── index.css
└── main.tsx
```
