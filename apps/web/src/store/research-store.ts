"use client";

import { create } from "zustand";
import { parseFinalResearchOutput } from "@/lib/parse-result";
import { connectResearchStream } from "@/lib/research-sse";
import type {
  FinalResearchOutput,
  ResearchAgentEvent,
  ResearchStatus,
  StreamLogItem,
} from "@/lib/types";

type ResearchState = {
  goal: string;
  status: ResearchStatus;
  logs: StreamLogItem[];
  result: FinalResearchOutput | null;
  error: string | null;
  setGoal: (goal: string) => void;
  reset: () => void;
  startResearch: () => void;
  stopResearch: () => void;
};

let activeClose: (() => void) | null = null;
let logCounter = 0;

function nextLogId(): string {
  logCounter += 1;
  return `log-${Date.now()}-${logCounter}`;
}

function summarizeNode(node: string, data: Record<string, unknown>): string {
  if (node === "planner" && Array.isArray(data.plan)) {
    return `Planned ${data.plan.length} research steps`;
  }
  if (node === "researcher" && Array.isArray(data.research_notes)) {
    return `Gathered notes for ${data.research_notes.length} steps`;
  }
  if (node === "summarizer" && typeof data.summary === "string") {
    return "Drafted an intermediate summary";
  }
  if (node === "final_output") {
    return "Compiled structured final report";
  }
  return `Completed “${node}”`;
}

function formatNodeDetail(
  node: string,
  data: Record<string, unknown>,
): string | undefined {
  if (node === "planner" && Array.isArray(data.plan)) {
    return data.plan.map((step, i) => `${i + 1}. ${String(step)}`).join("\n");
  }
  if (node === "researcher" && Array.isArray(data.research_notes)) {
    return data.research_notes
      .map((note) => {
        const entry = note as { step?: string; results?: unknown[]; error?: string };
        if (entry.error) {
          return `• ${entry.step ?? "step"} — error: ${entry.error}`;
        }
        const count = Array.isArray(entry.results) ? entry.results.length : 0;
        return `• ${entry.step ?? "step"} — ${count} sources`;
      })
      .join("\n");
  }
  if (node === "summarizer" && typeof data.summary === "string") {
    return data.summary.slice(0, 500);
  }
  return undefined;
}

function eventToLog(event: ResearchAgentEvent): StreamLogItem | null {
  if (event.type === "status") {
    return {
      id: nextLogId(),
      at: Date.now(),
      kind: "status",
      title: event.message,
    };
  }
  if (event.type === "node") {
    return {
      id: nextLogId(),
      at: Date.now(),
      kind: "node",
      node: event.node,
      title: summarizeNode(event.node, event.data),
      detail: formatNodeDetail(event.node, event.data),
    };
  }
  if (event.type === "error") {
    return {
      id: nextLogId(),
      at: Date.now(),
      kind: "error",
      title: event.message,
      detail: event.detail,
    };
  }
  return null;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  goal: "",
  status: "idle",
  logs: [],
  result: null,
  error: null,

  setGoal: (goal) => set({ goal }),

  reset: () => {
    activeClose?.();
    activeClose = null;
    set({
      status: "idle",
      logs: [],
      result: null,
      error: null,
    });
  },

  stopResearch: () => {
    activeClose?.();
    activeClose = null;
    const { status } = get();
    if (status === "streaming") {
      set({
        status: "idle",
        logs: [
          ...get().logs,
          {
            id: nextLogId(),
            at: Date.now(),
            kind: "system",
            title: "Stream stopped",
          },
        ],
      });
    }
  },

  startResearch: () => {
    const goal = get().goal.trim();
    if (goal.length < 3) {
      set({ error: "Enter a research goal with at least 3 characters." });
      return;
    }

    activeClose?.();
    activeClose = null;

    set({
      status: "streaming",
      logs: [
        {
          id: nextLogId(),
          at: Date.now(),
          kind: "system",
          title: "Connecting to research agent…",
        },
      ],
      result: null,
      error: null,
    });

    activeClose = connectResearchStream(goal, {
      onEvent: (event) => {
        const log = eventToLog(event);
        if (log) {
          set((state) => ({ logs: [...state.logs, log] }));
        }

        if (event.type === "result") {
          const parsed = parseFinalResearchOutput(event.data);
          set({
            result: parsed,
            status: parsed ? "complete" : "error",
            error: parsed
              ? null
              : "Received a result event but could not parse the structured report.",
            logs: parsed
              ? [
                  ...get().logs,
                  {
                    id: nextLogId(),
                    at: Date.now(),
                    kind: "system",
                    title: "Final structured report ready",
                  },
                ]
              : get().logs,
          });
          return;
        }

        if (event.type === "error") {
          set({
            status: "error",
            error: event.message,
          });
          return;
        }

        if (event.type === "done") {
          set((state) => ({
            status: state.result ? "complete" : state.status === "error" ? "error" : "complete",
          }));
        }
      },
      onConnectionError: (message) => {
        set((state) => ({
          status: "error",
          error: message,
          logs: [
            ...state.logs,
            {
              id: nextLogId(),
              at: Date.now(),
              kind: "error",
              title: message,
            },
          ],
        }));
      },
    });
  },
}));
