import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DebugRequestMessage,
  ErrorMessage,
  ResultPayload,
  ServerMessage,
  StepType,
} from "./types";

export type ConnectionStatus = "connecting" | "open" | "closed";

export interface LogEntry {
  id: string;
  stepType: StepType;
  content: string;
  detail: Record<string, unknown>;
}

interface DebugSessionState {
  status: ConnectionStatus;
  entries: LogEntry[];
  result: ResultPayload | null;
  serverError: ErrorMessage | null;
  busy: boolean;
}

/**
 * One WebSocket connection to `/ws/debug`, normalised into React state.
 *
 * Mirrors the CLI's rendering rule: consecutive `reasoning` deltas merge into
 * the same log entry (append, don't replace) until a different step type
 * interrupts them — same wire contract, same behaviour, different renderer.
 */
export function useDebugSession(wsUrl: string) {
  const [state, setState] = useState<DebugSessionState>({
    status: "connecting",
    entries: [],
    result: null,
    serverError: null,
    busy: false,
  });
  const socketRef = useRef<WebSocket | null>(null);
  const requestIdRef = useRef<string>("");

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setState((prev) => ({ ...prev, status: "open" }));
    });

    socket.addEventListener("close", () => {
      setState((prev) => ({ ...prev, status: "closed", busy: false }));
    });

    socket.addEventListener("message", (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as ServerMessage;
      handleMessage(message, setState);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [wsUrl]);

  const submit = useCallback((error: string, context: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const requestId = crypto.randomUUID();
    requestIdRef.current = requestId;

    setState((prev) => ({
      ...prev,
      entries: [],
      result: null,
      serverError: null,
      busy: true,
    }));

    const request: DebugRequestMessage = {
      type: "debug_request",
      error,
      context,
      request_id: requestId,
    };
    socket.send(JSON.stringify(request));
  }, []);

  const cancel = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "cancel" }));
  }, []);

  return { ...state, submit, cancel };
}

function handleMessage(
  message: ServerMessage,
  setState: React.Dispatch<React.SetStateAction<DebugSessionState>>,
): void {
  switch (message.type) {
    case "ack":
      return;

    case "step":
      setState((prev) => ({
        ...prev,
        entries: appendStep(prev.entries, message.step_type, message.content, message.detail),
      }));
      return;

    case "complete":
      setState((prev) => ({ ...prev, result: message.result, busy: false }));
      return;

    case "error":
      setState((prev) => ({
        ...prev,
        serverError: message,
        busy: message.fatal ? false : prev.busy,
      }));
      return;

    case "pong":
      return;
  }
}

function appendStep(
  entries: LogEntry[],
  stepType: StepType,
  content: string,
  detail: Record<string, unknown>,
): LogEntry[] {
  const last = entries[entries.length - 1];
  if (stepType === "reasoning" && last?.stepType === "reasoning") {
    const merged: LogEntry = { ...last, content: last.content + content };
    return [...entries.slice(0, -1), merged];
  }
  return [...entries, { id: crypto.randomUUID(), stepType, content, detail }];
}
