'use client';

import { useState } from 'react';

type ResearchResult = Record<string, unknown>;

export default function ResearchAgent() {
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResearch = async () => {
    if (!goal) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('https://researchagentnew-2.onrender.com/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      const data = (await res.json()) as ResearchResult;
      setResult(data);
    } catch {
      setResult({ error: 'Failed to connect to backend' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Research Agent</h1>

        <div className="mb-8">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your research goal..."
            className="w-full h-32 p-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-lg"
          />
          <button
            onClick={handleResearch}
            disabled={loading || !goal}
            className="mt-4 w-full py-4 bg-white text-black rounded-2xl font-semibold text-lg disabled:opacity-50"
          >
            {loading ? 'Researching...' : 'Start Research'}
          </button>
        </div>

        {result && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
            <pre className="whitespace-pre-wrap text-green-400 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
