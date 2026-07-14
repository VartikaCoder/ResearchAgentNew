'use client';

import { useState } from 'react';

export default function Home() {
  const [goal, setGoal] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startResearch = () => {
    if (!goal) return;

    setIsLoading(true);
    setOutput('Starting research...\n\n');

    const eventSource = new EventSource(
      `https://researchagentnew-2.onrender.com/research?goal=${encodeURIComponent(goal)}`
    );

    eventSource.onmessage = (event) => {
      setOutput((prev) => prev + event.data + '\n');
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsLoading(false);
      setOutput((prev) => prev + '\n[Connection closed]');
    };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Research Agent</h1>

        <div className="mb-8">
          <textarea
            className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            placeholder="Enter your research goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <button
            onClick={startResearch}
            disabled={isLoading || !goal}
            className="mt-4 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl text-lg font-medium w-full"
          >
            {isLoading ? 'Researching...' : 'Start Research'}
          </button>
        </div>

        {output && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 font-mono whitespace-pre-wrap text-green-400 min-h-96 overflow-auto">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
