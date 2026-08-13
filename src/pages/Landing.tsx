import { Link } from "react-router-dom";
import { Logomark } from "../Logomark";

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

const STACK = ["Claude", "Amazon Bedrock", "ChromaDB", "Docker", "FastAPI", "React"];

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
      <div className="landing-hero-bg">
        <header className="landing-nav">
          <Link to="/" className="landing-brand">
            <Logomark size={28} />
            Debug Agent
          </Link>
          <nav className="landing-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#stack">Built with</a>
          </nav>
          <div className="landing-nav-actions">
            <a href={FRONTEND_REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link to="/app" className="landing-nav-cta">
              Launch dashboard
            </Link>
          </div>
        </header>

        <section className="landing-hero">
          <Logomark size={56} />
          <h1>
            Don't just explain the bug.
            <br />
            Prove the fix works.
          </h1>
          <p className="landing-subhead">
            Debug Agent retrieves the relevant documentation, reasons about the
            root cause, proposes a fix, and verifies it by actually running it
            in an isolated sandbox — before it tells you the bug is solved.
          </p>
          <div className="landing-cta-row">
            <Link to="/app" className="landing-cta-primary">
              Launch the dashboard
            </Link>
          </div>

          <div className="landing-trust">
            <p>Built with</p>
            <div className="landing-trust-row">
              {STACK.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="landing-section" id="how-it-works">
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

      <section className="landing-section landing-section-alt" id="features">
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

      <footer className="landing-footer" id="stack">
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
