'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Please select a file.');

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json.result);
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload PDF for Analysis</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Analyzing...' : 'Upload & Analyze'}
        </button>
      </form>
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">AI Response:</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}