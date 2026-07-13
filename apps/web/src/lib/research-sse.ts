import {
  isResearchAgentEvent,
  type ResearchAgentEvent,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export type ResearchStreamHandlers = {
  onEvent: (event: ResearchAgentEvent) => void;
  onConnectionError?: (message: string) => void;
};

/**
 * Connect to the NestJS research SSE endpoint with native EventSource.
 * Uses GET /research?goal=... because EventSource only supports GET.
 */
export function connectResearchStream(
  goal: string,
  handlers: ResearchStreamHandlers,
): () => void {
  const url = `${API_URL}/research?goal=${encodeURIComponent(goal)}`;
  const source = new EventSource(url);
  let closed = false;

  const handlePayload = (raw: MessageEvent<string>) => {
    try {
      const parsed: unknown = JSON.parse(raw.data);
      if (!isResearchAgentEvent(parsed)) {
        return;
      }
      handlers.onEvent(parsed);
      if (parsed.type === "done" || parsed.type === "error") {
        close();
      }
    } catch {
      // Ignore malformed chunks
    }
  };

  const eventTypes = ["status", "node", "result", "error", "done"] as const;
  for (const type of eventTypes) {
    source.addEventListener(type, handlePayload as EventListener);
  }

  // Fallback if the server sends unnamed message events
  source.onmessage = handlePayload;

  source.onerror = () => {
    if (closed) {
      return;
    }
    // EventSource reconnects by default; close on hard failure after open attempt
    if (source.readyState === EventSource.CLOSED) {
      handlers.onConnectionError?.(
        "Lost connection to the research API. Is the NestJS server running on port 3001?",
      );
      close();
      return;
    }
    // If still connecting/open and we get errors without useful data, surface once
    if (source.readyState === EventSource.CONNECTING) {
      handlers.onConnectionError?.(
        "Unable to connect to the research stream. Check that the API is running.",
      );
      close();
    }
  };

  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    source.close();
  };

  return close;
}
