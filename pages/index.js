import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    setLoading(false);

    if (data.result) {
      setResult(data.result);
    } else {
      setResult('Something went wrong.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>SellerRescue AI Agent</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="6"
          style={{ width: '100%' }}
          placeholder="Enter your seller account issue here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '2rem', whiteSpace: 'pre-wrap' }}>
          <h3>AI Suggestion:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
