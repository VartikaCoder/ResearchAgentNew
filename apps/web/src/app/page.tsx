'use client';

import { useState } from 'react';

export default function ResearchAgent() {
  const [goal, setGoal] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!goal.trim()) return;

    setLoading(true);
    setOutput('Starting research...\n\n');

    const backendUrl = 'https://researchagentnew-2.onrender.com';
    const url = `${backendUrl}/research?goal=${encodeURIComponent(goal)}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setOutput(prev => prev + event.data + '\n');
    };

    eventSource.onerror = () => {
      eventSource.close();
      setLoading(false);
      setOutput(prev => prev + '\n[Connection ended]');
    };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Research Agent</h1>

        <div className="mb-6">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your research goal (e.g. Best AI tools for marketing in 2026)"
            className="w-full h-32 p-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-lg"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !goal.trim()}
            className="mt-4 w-full py-4 bg-white text-black rounded-2xl font-semibold text-lg disabled:opacity-50"
          >
            {loading ? 'Researching...' : 'Start Research'}
          </button>
        </div>

        {output && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 font-mono text-green-400 whitespace-pre-wrap min-h-96">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
