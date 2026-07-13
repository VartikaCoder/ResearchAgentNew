"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { parseFinalResearchOutput, resultToMarkdown } from "@/lib/parse-result";
import { useResearchStore } from "@/store/research-store";

type ViewMode = "formatted" | "markdown" | "json";

export function ResultsPanel() {
  const rawResult = useResearchStore((s) => s.result);
  const status = useResearchStore((s) => s.status);
  const [view, setView] = useState<ViewMode>("formatted");

  const result = useMemo(
    () => (rawResult ? parseFinalResearchOutput(rawResult) : null),
    [rawResult],
  );

  if (!result) {
    return (
      <section
        className="compose-panel results-panel is-empty"
        aria-labelledby="results-heading"
      >
        <div className="panel-heading">
          <p className="eyebrow">Report</p>
          <h2 id="results-heading">Structured output</h2>
          <p className="panel-copy">
            When the run finishes, the title, key findings, and sources will
            land here as formatted markdown and JSON.
          </p>
        </div>
        <div className="results-placeholder">
          {status === "streaming"
            ? "Compiling the final report…"
            : "No report yet"}
        </div>
      </section>
    );
  }

  const markdown = resultToMarkdown(result);
  const json = JSON.stringify(result, null, 2);

  return (
    <section className="compose-panel results-panel" aria-labelledby="results-heading">
      <div className="panel-heading row-between">
        <div>
          <p className="eyebrow">Report</p>
          <h2 id="results-heading">{result.title}</h2>
        </div>
        <div className="view-toggle" role="tablist" aria-label="Result view">
          {(
            [
              ["formatted", "Formatted"],
              ["markdown", "Markdown"],
              ["json", "JSON"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={view === id ? "is-active" : ""}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "formatted" ? (
        <div className="results-grid">
          <div>
            <h3>Summary</h3>
            <div className="markdown-body">
              <ReactMarkdown>{result.summary || "_No summary provided._"}</ReactMarkdown>
            </div>

            <h3 className="spaced">Key findings</h3>
            <ul className="findings-list">
              {result.key_findings.map((finding) => (
                <li key={finding}>
                  <ReactMarkdown>{finding}</ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Sources</h3>
            <ul className="sources-list">
              {result.sources.map((source) => (
                <li key={source.url || source.title}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title || source.url}
                    </a>
                  ) : (
                    <strong>{source.title}</strong>
                  )}
                  {source.snippet ? <p>{source.snippet}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {view === "markdown" ? (
        <pre className="code-block" aria-label="Markdown report">
          {markdown}
        </pre>
      ) : null}

      {view === "json" ? (
        <pre className="code-block" aria-label="JSON report">
          {json}
        </pre>
      ) : null}
    </section>
  );
}
