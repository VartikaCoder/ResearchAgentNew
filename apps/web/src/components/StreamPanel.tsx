"use client";

import { useEffect, useRef } from "react";
import { useResearchStore } from "@/store/research-store";

const NODE_LABELS: Record<string, string> = {
  planner: "Planner",
  researcher: "Researcher",
  summarizer: "Summarizer",
  final_output: "Final output",
};

export function StreamPanel() {
  const logs = useResearchStore((s) => s.logs);
  const status = useResearchStore((s) => s.status);
  const error = useResearchStore((s) => s.error);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [logs]);

  return (
    <section className="compose-panel stream-panel" aria-labelledby="stream-heading">
      <div className="panel-heading row-between">
        <div>
          <p className="eyebrow">Live stream</p>
          <h2 id="stream-heading">Agent thinking</h2>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="stream-scroll" ref={scrollerRef} role="log" aria-live="polite">
        {logs.length === 0 ? (
          <div className="stream-empty">
            <p>Waiting for a run.</p>
            <p className="muted">
              Steps from planner → researcher → summarizer → final output will
              appear here in real time.
            </p>
          </div>
        ) : (
          <ol className="stream-list">
            {logs.map((item) => (
              <li key={item.id} className={`stream-item kind-${item.kind}`}>
                <div className="stream-meta">
                  <span className="stream-kind">
                    {item.node
                      ? NODE_LABELS[item.node] ?? item.node
                      : item.kind}
                  </span>
                  <time dateTime={new Date(item.at).toISOString()}>
                    {new Date(item.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </div>
                <p className="stream-title">{item.title}</p>
                {item.detail ? (
                  <pre className="stream-detail">{item.detail}</pre>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}

function StatusBadge({
  status,
}: {
  status: "idle" | "streaming" | "complete" | "error";
}) {
  const label =
    status === "streaming"
      ? "Streaming"
      : status === "complete"
        ? "Complete"
        : status === "error"
          ? "Error"
          : "Idle";

  return <span className={`status-badge status-${status}`}>{label}</span>;
}
