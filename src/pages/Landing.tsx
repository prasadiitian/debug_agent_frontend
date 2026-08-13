import { Link } from "react-router-dom";

// The backend repo is private, so it isn't linked from a public page — only
// the frontend is public. Don't claim "open source" here; it would be
// inaccurate while the core agent/retrieval code isn't publicly visible.
const FRONTEND_REPO = "https://github.com/prasadiitian/debug_agent_frontend";

const STEPS = [
  {
    title: "Retrieve",
    body:
      "Hybrid search over your technical docs and past resolved issues — exact " +
      "keyword matches (BM25) fused with semantic search, so both the literal " +
      "error string and its conceptual explanation surface.",
  },
  {
    title: "Reason",
    body:
      "An LLM agent reads the retrieved context and the traceback, forms a root-" +
      "cause hypothesis, and proposes a fix — citing exactly which sources it " +
      "used, not just asserting an answer.",
  },
  {
    title: "Verify",
    body:
      "The proposed fix is executed in a fresh, network-disabled Docker " +
      "container before it's ever shown to you as done. Unverified fixes are " +
      "labelled as such, not hidden.",
  },
];

const FEATURES = [
  {
    title: "Hybrid retrieval, not vector-search-only",
    body:
      "BM25 and dense embeddings are fused with Reciprocal Rank Fusion, with a " +
      "diversity cap so one long page can't crowd out every other source.",
  },
  {
    title: "Real sandbox verification",
    body:
      "Every proposed fix runs in an isolated, throwaway container. \"Verified\" " +
      "means it actually executed successfully — not that the model sounded sure.",
  },
  {
    title: "Model-provider agnostic",
    body:
      "Runs on Claude via Anthropic's API or Amazon Bedrock, switchable by " +
      "config — no code changes to move between them.",
  },
  {
    title: "Live, streamed reasoning",
    body:
      "Watch retrieval, tool calls, and verification happen step by step over " +
      "WebSocket, instead of waiting on a spinner for a black-box answer.",
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Debug Agent</span>
        <div className="landing-nav-links">
          <a href={FRONTEND_REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link to="/app" className="landing-nav-cta">
            Launch dashboard
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <p className="landing-eyebrow">Agentic RAG · Claude on Amazon Bedrock</p>
        <h1>
          Don't just explain the bug.
          <br />
          Prove the fix works.
        </h1>
        <p className="landing-subhead">
          Debug Agent retrieves the relevant documentation, reasons about the
          root cause, proposes a fix, and verifies it by actually running it in
          an isolated sandbox — before it tells you the bug is solved.
        </p>
        <div className="landing-cta-row">
          <Link to="/app" className="landing-cta-primary">
            Launch the dashboard →
          </Link>
          <a
            href={FRONTEND_REPO}
            target="_blank"
            rel="noreferrer"
            className="landing-cta-secondary"
          >
            View frontend source
          </a>
        </div>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <div className="landing-steps">
          {STEPS.map((step, index) => (
            <div className="landing-step" key={step.title}>
              <span className="landing-step-index">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <h2>Built for trust, not just answers</h2>
        <div className="landing-feature-grid">
          {FEATURES.map((feature) => (
            <div className="landing-feature" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-stack">
        <h2>Built with</h2>
        <div className="landing-badges">
          {["Claude", "Amazon Bedrock", "ChromaDB", "Docker", "FastAPI", "React"].map(
            (name) => (
              <span className="landing-badge" key={name}>
                {name}
              </span>
            ),
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          In active development.{" "}
          <a href={FRONTEND_REPO} target="_blank" rel="noreferrer">
            Frontend source
          </a>
        </p>
        <Link to="/app" className="landing-cta-secondary">
          Launch the dashboard →
        </Link>
      </footer>
    </div>
  );
}
