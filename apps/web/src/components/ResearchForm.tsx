"use client";

import { useResearchStore } from "@/store/research-store";

const EXAMPLES = [
  "Compare solid-state battery approaches and commercial timelines",
  "What are the tradeoffs of multi-agent systems built with LangGraph?",
  "Summarize recent advances in retrieval-augmented generation evaluation",
];

export function ResearchForm() {
  const goal = useResearchStore((s) => s.goal);
  const status = useResearchStore((s) => s.status);
  const setGoal = useResearchStore((s) => s.setGoal);
  const startResearch = useResearchStore((s) => s.startResearch);
  const stopResearch = useResearchStore((s) => s.stopResearch);
  const reset = useResearchStore((s) => s.reset);

  const streaming = status === "streaming";

  return (
    <section className="compose-panel" aria-labelledby="goal-heading">
      <div className="panel-heading">
        <p className="eyebrow">Brief</p>
        <h2 id="goal-heading">What should we research?</h2>
        <p className="panel-copy">
          Describe the question clearly. The agent will plan steps, search the
          web, and return a structured report.
        </p>
      </div>

      <label className="sr-only" htmlFor="research-goal">
        Research goal
      </label>
      <textarea
        id="research-goal"
        className="goal-input"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g. Map the leading approaches to agent memory and when to use each…"
        rows={5}
        disabled={streaming}
        maxLength={2000}
      />

      <div className="example-row" aria-label="Example goals">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="example-chip"
            disabled={streaming}
            onClick={() => setGoal(example)}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-btn"
          onClick={startResearch}
          disabled={streaming || goal.trim().length < 3}
        >
          {streaming ? (
            <>
              <span className="pulse-dot" aria-hidden />
              Researching…
            </>
          ) : (
            "Start Research"
          )}
        </button>

        {streaming ? (
          <button type="button" className="ghost-btn" onClick={stopResearch}>
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="ghost-btn"
            onClick={reset}
            disabled={status === "idle" && !goal}
          >
            Clear
          </button>
        )}

        <span className="char-count">{goal.length}/2000</span>
      </div>
    </section>
  );
}
