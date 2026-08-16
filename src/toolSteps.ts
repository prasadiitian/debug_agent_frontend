import type { LogEntry } from "./useDebugSession";

export type RenderItem =
  | { kind: "entry"; key: string; entry: LogEntry }
  | { kind: "tool"; key: string; call: LogEntry; result: LogEntry | null };

/**
 * Pairs a tool_call with its matching tool_result/verification (matched by
 * detail.tool_use_id) into one unit, so the transcript reads as a clean
 * narrative — reasoning prose with collapsible tool steps — instead of
 * interleaving raw tool arguments and result dumps between paragraphs.
 */
export function groupEntries(entries: LogEntry[]): RenderItem[] {
  const items: RenderItem[] = [];
  const toolIndexById = new Map<string, number>();

  for (const entry of entries) {
    const toolUseId =
      typeof entry.detail.tool_use_id === "string" ? entry.detail.tool_use_id : "";

    if (entry.stepType === "tool_call" && toolUseId) {
      toolIndexById.set(toolUseId, items.length);
      items.push({ kind: "tool", key: entry.id, call: entry, result: null });
      continue;
    }

    if ((entry.stepType === "tool_result" || entry.stepType === "verification") && toolUseId) {
      const index = toolIndexById.get(toolUseId);
      const existing = index !== undefined ? items[index] : undefined;
      if (existing?.kind === "tool") {
        items[index!] = { ...existing, result: entry };
        continue;
      }
    }

    // No matching call (or no tool_use_id at all) — render standalone
    // rather than silently dropping it.
    items.push({ kind: "entry", key: entry.id, entry });
  }

  return items;
}
