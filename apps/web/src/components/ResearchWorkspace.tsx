"use client";

import { ResearchForm } from "@/components/ResearchForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { StreamPanel } from "@/components/StreamPanel";

export function ResearchWorkspace() {
  return (
    <main className="shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="brand">Research Agent</p>
          <h1>Ask a question. Watch the investigation unfold.</h1>
          <p className="lede">
            Plan, search, summarize, and deliver a cited report — streamed live
            from the LangGraph agent through NestJS.
          </p>
        </div>
        <div className="hero-orbit" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </header>

      <div className="workspace">
        <ResearchForm />
        <StreamPanel />
        <ResultsPanel />
      </div>
    </main>
  );
}
