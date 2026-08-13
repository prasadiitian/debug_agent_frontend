import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { readAttachments, formatBytes } from "../attachments";
import { Logomark } from "../Logomark";
import type { LogEntry } from "../useDebugSession";
import { useDebugSession } from "../useDebugSession";
import { useHealth } from "../useHealth";
import type { RecentSession } from "../useRecentSessions";
import { useRecentSessions } from "../useRecentSessions";
import type { FileAttachment, StepType } from "../types";

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

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const STEP_LABEL: Record<StepType, { marker: string; className: string }> = {
  session_start: { marker: "▶", className: "step-session" },
  tool_call: { marker: "→", className: "step-tool-call" },
  tool_result: { marker: "←", className: "step-tool-result" },
  verification: { marker: "⚙", className: "step-verification" },
  error: { marker: "✗", className: "step-error" },
  reasoning: { marker: "", className: "step-reasoning" },
};

export default function Dashboard() {
  const { status, entries, result, serverError, busy, submit, cancel, clear } =
    useDebugSession(WS_URL);
  const { health, reachable } = useHealth(HEALTH_URL);
  const { sessions, record } = useRecentSessions();

  const [errorText, setErrorText] = useState("");
  const [context, setContext] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastRequestRef = useRef({ errorText: "", context: "" });

  const canSubmit = status === "open" && !busy && errorText.trim().length > 0;
  const hasContent = entries.length > 0 || result !== null;

  const addFiles = async (incoming: FileList | File[]) => {
    const { accepted, error } = await readAttachments(incoming, attachments);
    setAttachError(error);
    if (accepted.length > 0) setAttachments((prev) => [...prev, ...accepted]);
  };

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((f) => f.path !== path));
  };

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

  const doSubmit = () => {
    if (!canSubmit) return;
    lastRequestRef.current = { errorText, context };
    submit(errorText, context, attachments);
    setAttachments([]);
    setAttachError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    doSubmit();
  };

  const restore = (session: RecentSession) => {
    if (busy) return;
    setErrorText(session.errorText);
    setContext(session.context);
  };

  const newSession = () => {
    if (busy) cancel();
    clear();
    setErrorText("");
    setContext("");
    setAttachments([]);
    setAttachError(null);
  };

  return (
    <div className="dash-shell theme-light">
      <aside className="dash-sidebar">
        <Link to="/" className="dash-brand">
          <Logomark size={24} />
          Debug Agent
        </Link>

        <button type="button" className="dash-new-session" onClick={newSession}>
          <span>+</span> New session
        </button>

        <div className="dash-sidebar-label">Recent</div>
        <div className="dash-recent-list">
          {sessions.length === 0 ? (
            <p className="dash-recent-empty">Nothing yet</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className="dash-recent-item"
                onClick={() => restore(session)}
                disabled={busy}
              >
                <span
                  className={`dot ${session.verified === true ? "verified" : "unverified"}`}
                />
                <span className="preview">{session.preview || "(empty)"}</span>
                <span className="time">{formatRelativeTime(session.timestamp)}</span>
              </button>
            ))
          )}
        </div>

        <div className="dash-sidebar-footer">
          <span className={`status-dot status-${status}`} />
          <span className={reachable ? "" : "unreachable"}>
            {health?.model ?? "connecting…"}
            {health ? ` · ${health.indexed_chunks.toLocaleString()} chunks` : ""}
          </span>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-scroll">
          {!hasContent ? (
            <div className="dash-empty">
              <Logomark size={44} />
              <h1>What error should we debug?</h1>
            </div>
          ) : (
            <div className="dash-transcript">
              {serverError && (
                <div
                  className={`banner ${serverError.fatal ? "banner-fatal" : "banner-warning"}`}
                >
                  {serverError.message}
                </div>
              )}

              <div className="log">
                {entries.map((entry) => (
                  <LogLine key={entry.id} entry={entry} />
                ))}
                {busy && entries.length === 0 && (
                  <p className="log-empty">Connecting to the agent…</p>
                )}
              </div>

              {result && <ResultPanel result={result} />}
            </div>
          )}
        </div>

        <div className="dash-composer-wrap">
          <form
            className={`dash-composer ${dragActive ? "drag-active" : ""}`}
            onSubmit={handleSubmit}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              if (!busy && event.dataTransfer.files.length > 0) {
                void addFiles(event.dataTransfer.files);
              }
            }}
          >
            {attachments.length > 0 && (
              <div className="dash-attachments">
                {attachments.map((file) => (
                  <span className="dash-attachment-chip" key={file.path}>
                    {file.path}
                    <span className="size">
                      {formatBytes(new Blob([file.content]).size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.path)}
                      aria-label={`Remove ${file.path}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {attachError && <p className="dash-attach-error">{attachError}</p>}

            <label htmlFor="error-input" className="sr-only">
              Error or stack trace
            </label>
            <textarea
              id="error-input"
              rows={3}
              value={errorText}
              onChange={(event) => setErrorText(event.target.value)}
              placeholder="Paste an error or traceback… (or drop a file)"
              disabled={busy}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  doSubmit();
                }
              }}
            />
            <div className="dash-composer-row">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => {
                  if (event.target.files) void addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="dash-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                title="Attach files"
                aria-label="Attach files"
              >
                📎
              </button>

              <label htmlFor="context-input" className="sr-only">
                Context
              </label>
              <input
                id="context-input"
                type="text"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="Context (optional) — e.g. FastAPI 0.115, Python 3.11"
                disabled={busy}
              />
              {busy ? (
                <button type="button" className="dash-send dash-stop" onClick={cancel}>
                  ■
                </button>
              ) : (
                <button type="submit" className="dash-send" disabled={!canSubmit}>
                  ↑
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
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

function ResultPanel({ result }: { result: import("../types").ResultPayload }) {
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
