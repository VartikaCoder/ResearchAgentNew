import type { FinalResearchOutput, ResearchSource } from "@/lib/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item)).filter(Boolean);
}

function asSources(value: unknown): ResearchSource[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const source = item as Record<string, unknown>;
      const title = asString(source.title, "Untitled source");
      const url = asString(source.url);
      const snippet = asString(source.snippet);
      if (!title && !url) {
        return null;
      }
      return { title, url, snippet };
    })
    .filter((item): item is ResearchSource => item !== null);
}

/**
 * Normalize/parse the final agent payload into a stable UI shape.
 * Accepts either a plain object or a JSON string.
 */
export function parseFinalResearchOutput(
  value: unknown,
): FinalResearchOutput | null {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  // Some wrappers nest the report under `final_output` or `data`
  const nested =
    (data.final_output && typeof data.final_output === "object"
      ? data.final_output
      : null) ??
    (data.data && typeof data.data === "object" ? data.data : null) ??
    data;

  const report = nested as Record<string, unknown>;
  const title = asString(report.title);
  const summary = asString(report.summary);
  const key_findings = asStringArray(
    report.key_findings ?? report.keyFindings ?? report.findings,
  );
  const sources = asSources(report.sources);

  if (!title && key_findings.length === 0 && !summary) {
    return null;
  }

  return {
    title: title || "Research report",
    summary,
    key_findings,
    sources,
  };
}

export function resultToMarkdown(result: FinalResearchOutput): string {
  const findings = result.key_findings
    .map((finding) => `- ${finding}`)
    .join("\n");
  const sources = result.sources
    .map((source) => {
      const link = source.url ? `[${source.title}](${source.url})` : source.title;
      return source.snippet ? `- ${link} — ${source.snippet}` : `- ${link}`;
    })
    .join("\n");

  return [
    `# ${result.title}`,
    "",
    result.summary,
    "",
    "## Key findings",
    findings || "- No findings provided",
    "",
    "## Sources",
    sources || "- No sources provided",
  ].join("\n");
}
