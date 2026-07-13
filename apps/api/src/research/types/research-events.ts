/** Shared research agent / SSE event types */

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface FinalResearchOutput {
  title: string;
  key_findings: string[];
  sources: ResearchSource[];
  summary: string;
}

export type ResearchAgentEvent =
  | {
      type: 'status';
      message: string;
      goal?: string;
    }
  | {
      type: 'node';
      node: 'planner' | 'researcher' | 'summarizer' | 'final_output' | string;
      data: Record<string, unknown>;
    }
  | {
      type: 'result';
      data: FinalResearchOutput;
    }
  | {
      type: 'error';
      message: string;
      detail?: string;
    }
  | {
      type: 'done';
    };

export function isResearchAgentEvent(value: unknown): value is ResearchAgentEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return (
    type === 'status' ||
    type === 'node' ||
    type === 'result' ||
    type === 'error' ||
    type === 'done'
  );
}
