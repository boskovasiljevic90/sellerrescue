// app/chat/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const fileInput = form.querySelector('input[name="file"]') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Please select a file.');
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Status ${res.status}: ${err}`);
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload PDF for Analysis</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" name="file" accept="application/pdf" required />
        <div className="mt-4">
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Upload & Analyze'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h2 className="font-semibold">AI Analysis:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}