import { useEffect, useRef, useState } from "react";
import type { LogEntry } from "./useDebugSession";
import { useDebugSession } from "./useDebugSession";
import { useHealth } from "./useHealth";
import type { RecentSession } from "./useRecentSessions";
import { useRecentSessions } from "./useRecentSessions";
import type { StepType } from "./types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:8000/ws/debug";
const HEALTH_URL = deriveHealthUrl(WS_URL);

function deriveHealthUrl(wsUrl: string): string {
  try {
    const url = new URL(wsUrl);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    url.pathname = "/health";
    return url.toString();
  } catch {
    return "http://127.0.0.1:8000/health";
  }
}

const STEP_LABEL: Record<StepType, { marker: string; className: string }> = {
  session_start: { marker: "▶", className: "step-session" },
  tool_call: { marker: "→", className: "step-tool-call" },
  tool_result: { marker: "←", className: "step-tool-result" },
  verification: { marker: "⚙", className: "step-verification" },
  error: { marker: "✗", className: "step-error" },
  reasoning: { marker: "", className: "step-reasoning" },
};

export default function App() {
  const { status, entries, result, serverError, busy, submit, cancel } =
    useDebugSession(WS_URL);
  const { health, reachable } = useHealth(HEALTH_URL);
  const { sessions, record } = useRecentSessions();

  const [errorText, setErrorText] = useState("");
  const [context, setContext] = useState("");
  const lastRequestRef = useRef({ errorText: "", context: "" });

  const canSubmit = status === "open" && !busy && errorText.trim().length > 0;

  useEffect(() => {
    if (!result) return;
    record({
      errorText: lastRequestRef.current.errorText,
      context: lastRequestRef.current.context,
      verified: result.error ? null : result.verified,
    });
    // Only re-run when a new result actually lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    lastRequestRef.current = { errorText, context };
    submit(errorText, context);
  };

  const restore = (session: RecentSession) => {
    if (busy) return;
    setErrorText(session.errorText);
    setContext(session.context);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Debug Agent</h1>
        <span className={`status-badge status-${status}`}>{status}</span>
        <div className="stat-strip">
          <StatChip label="model" value={health?.model ?? "—"} degraded={!reachable} />
          <StatChip
            label="index"
            value={health ? `${health.indexed_chunks.toLocaleString()} chunks` : "—"}
            degraded={!reachable || health?.status === "degraded"}
          />
          <StatChip
            label="sessions"
            value={health ? String(health.active_sessions) : "—"}
            degraded={!reachable}
          />
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="panel">
            <form className="request-form" onSubmit={handleSubmit}>
              <label htmlFor="error-input">Error / stack trace</label>
              <textarea
                id="error-input"
                rows={9}
                value={errorText}
                onChange={(event) => setErrorText(event.target.value)}
                placeholder="Traceback (most recent call last): ..."
                disabled={busy}
              />

              <label htmlFor="context-input">Context (optional)</label>
              <input
                id="context-input"
                type="text"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="FastAPI 0.115, Python 3.11"
                disabled={busy}
              />

              <div className="form-actions">
                <button type="submit" disabled={!canSubmit}>
                  {busy ? "Running…" : "Debug"}
                </button>
                <button type="button" onClick={cancel} disabled={!busy}>
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className="recent-header">Recent sessions</div>
            {sessions.length === 0 ? (
              <p className="recent-empty">Nothing yet — sessions you run appear here.</p>
            ) : (
              <div className="recent-list">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="recent-item"
                    onClick={() => restore(session)}
                    disabled={busy}
                  >
                    <span
                      className={`dot ${session.verified === true ? "verified" : "unverified"}`}
                    />
                    <span className="preview">{session.preview || "(empty)"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="session-panel">
          {serverError && (
            <div className={`banner ${serverError.fatal ? "banner-fatal" : "banner-warning"}`}>
              {serverError.message}
            </div>
          )}

          <div className="log">
            {entries.length === 0 && (
              <p className="log-empty">
                Submit an error to start a session — steps stream here live.
              </p>
            )}
            {entries.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
          </div>

          {result && <ResultPanel result={result} />}
        </section>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  degraded,
}: {
  label: string;
  value: string;
  degraded?: boolean;
}) {
  return (
    <div className={`stat-chip ${degraded ? "degraded" : ""}`}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const { marker, className } = STEP_LABEL[entry.stepType];

  if (entry.stepType === "reasoning") {
    return <p className={className}>{entry.content}</p>;
  }

  if (entry.stepType === "tool_call") {
    const tool = String(entry.detail.tool ?? "?");
    const input = entry.detail.input;
    return (
      <p className={className}>
        <span className="marker">{marker}</span> <strong>{tool}</strong>{" "}
        <code>{typeof input === "string" ? input : JSON.stringify(input)}</code>
      </p>
    );
  }

  const preview = entry.content.trim().split("\n")[0] ?? "";
  return (
    <p className={className}>
      <span className="marker">{marker}</span> {preview}
    </p>
  );
}

function ResultPanel({ result }: { result: import("./types").ResultPayload }) {
  if (result.error) {
    return (
      <section className="result result-failed">
        <h2>Session failed</h2>
        <p>{result.error}</p>
      </section>
    );
  }

  return (
    <section className="result">
      <h2>
        {result.verified ? "✅ Verified" : "⚠️ Not verified"} —{" "}
        {result.attempts_used} sandbox attempt(s) ·{" "}
        {result.duration_seconds.toFixed(1)}s
      </h2>

      {result.root_cause && (
        <div>
          <h3>Root cause</h3>
          <p>{result.root_cause}</p>
        </div>
      )}

      {result.proposed_fix && (
        <div>
          <h3>Fix</h3>
          <p className="pre">{result.proposed_fix}</p>
        </div>
      )}

      {result.verification && (
        <div>
          <h3>Verification</h3>
          <p className="pre">{result.verification}</p>
        </div>
      )}

      {result.sources.length > 0 && (
        <div>
          <h3>Sources</h3>
          <ul>
            {result.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary>Full report</summary>
        <p className="pre">{result.final_answer}</p>
      </details>
    </section>
  );
}
