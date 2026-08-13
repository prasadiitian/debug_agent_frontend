// Mirrors debug_agent/interface/schemas.py exactly — one vocabulary end to
// end. If the backend's wire schema changes, this is the file to update.

export type StepType =
  | "session_start"
  | "reasoning"
  | "tool_call"
  | "tool_result"
  | "verification"
  | "error";

export interface FileAttachment {
  path: string;
  content: string;
}

// Must match debug_agent/interface/schemas.py's MAX_FILES / MAX_FILE_BYTES /
// MAX_TOTAL_BYTES — checked client-side too so a rejection is instant
// instead of a round trip to the server.
export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 500_000;
export const MAX_TOTAL_BYTES = 2_000_000;

export interface DebugRequestMessage {
  type: "debug_request";
  error: string;
  context?: string;
  request_id?: string;
  files?: FileAttachment[];
}

export interface CancelMessage {
  type: "cancel";
}

export interface PingMessage {
  type: "ping";
}

export interface AckMessage {
  type: "ack";
  request_id: string;
  timestamp: string;
}

export interface StepMessage {
  type: "step";
  request_id: string;
  timestamp: string;
  step_type: StepType;
  content: string;
  detail: Record<string, unknown>;
}

export interface ResultPayload {
  error_input: string;
  root_cause: string;
  proposed_fix: string;
  verification: string;
  sources: string[];
  verified: boolean;
  attempts_used: number;
  final_answer: string;
  duration_seconds: number;
  error: string | null;
}

export interface CompleteMessage {
  type: "complete";
  request_id: string;
  timestamp: string;
  result: ResultPayload;
}

export interface ErrorMessage {
  type: "error";
  request_id: string;
  timestamp: string;
  message: string;
  fatal: boolean;
}

export interface PongMessage {
  type: "pong";
  timestamp: string;
}

export type ServerMessage =
  | AckMessage
  | StepMessage
  | CompleteMessage
  | ErrorMessage
  | PongMessage;

export interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  model: string;
  indexed_chunks: number;
  active_sessions: number;
  detail: string;
}
