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

Scaffolded and wired to the real backend protocol, but **not yet run** —
this machine doesn't have Node.js installed, so `npm install` / `npm run dev`
haven't been exercised. Install Node 20+ and run it once before trusting the
UI actually renders correctly; treat this as reviewed-but-unverified code,
not tested code.

## Layout

```
src/
├── types.ts             # wire schema, mirrors schemas.py
├── useDebugSession.ts    # WebSocket connection + state normalisation
├── App.tsx               # form, live step log, final report
├── index.css
└── main.tsx
```
