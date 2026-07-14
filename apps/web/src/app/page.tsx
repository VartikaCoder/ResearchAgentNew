'use client';

import { useState } from 'react';

export default function Home() {
  const [goal, setGoal] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startResearch = async () => {
    if (!goal) return;

    setIsLoading(true);
    setOutput('');

    const eventSource = new EventSource(
      `https://researchagentnew-2.onrender.com/research?goal=${encodeURIComponent(goal)}`
    );

    eventSource.onmessage = (event) => {
      setOutput((prev) => prev + event.data);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsLoading(false);
    };

    eventSource.onopen = () => {
      setOutput('Starting research...\n\n');
    };
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Research Agent</h1>

      <div className="mb-6">
        <textarea
          className="w-full h-24 p-4 border rounded-lg"
          placeholder="Enter your research goal..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <button
          onClick={startResearch}
          disabled={isLoading}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Researching...' : 'Start Research'}
        </button>
      </div>

      {output && (
        <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono whitespace-pre-wrap overflow-auto max-h-96">
          {output}
        </div>
      )}
    </div>
  );
}
