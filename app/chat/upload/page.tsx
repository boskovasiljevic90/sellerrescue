// app/chat/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    if (res.ok) {
      setResult(json.result);
    } else {
      setResult(json.error || 'Unexpected error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload PDF for Analysis</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Analyzing…' : 'Upload & Analyze'}
        </button>
      </form>
      {result && (
        <pre className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {result}
        </pre>
      )}
    </div>
  );
}