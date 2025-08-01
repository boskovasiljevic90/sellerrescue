// app/chat/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Status ${res.status}`);
      }

      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Unexpected response');
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload PDF for Analysis</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
          }}
        />
        <button
          type="submit"
          disabled={!file || loading}
          style={{ marginLeft: '8px' }}
        >
          {loading ? 'Analyzing...' : 'Upload & Analyze'}
        </button>
      </form>
      {error && (
        <div style={{ marginTop: '16px', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            background: '#f9f9f9',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h2 className="font-semibold">AI Analysis:</h2>
          <div>{result}</div>
        </div>
      )}
    </div>
  );
}