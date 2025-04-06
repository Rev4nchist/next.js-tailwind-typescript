'use client';

import { useState } from 'react';

interface TestResult {
  step: string;
  status: 'started' | 'success' | 'error';
  data?: Record<string, unknown>;
}

interface ApiResponse {
  status: string;
  message: string;
  results: TestResult[];
}

export default function MemoryTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const response = await fetch('/api/test-memory');
      const data = await response.json() as ApiResponse;
      
      if (data.status === 'success') {
        setResults(data.results);
      } else {
        setError(data.message || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error running memory test');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">E.V.E. Memory Test</h1>
      
      <button 
        onClick={runTest} 
        disabled={loading}
        className="mb-8 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Running Test...' : 'Run Memory Test'}
      </button>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Test Results</h2>
          
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Step</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{result.step}</td>
                    <td className="p-3">
                      <span 
                        className={`inline-block px-2 py-1 rounded ${
                          result.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : result.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {result.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {result.data ? (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-24">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 