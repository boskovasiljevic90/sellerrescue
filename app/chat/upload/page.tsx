// app/chat/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });

      const dataText = await res.text();
      let data;
      try {
        data = JSON.parse(dataText);
      } catch {
        setError('Failed to parse response JSON.');
        setLoading(false);
        return;
      }

      if (data.error) {
        setError(data.error);
      } else if (data.message) {
        setResult(data.message);
      } else {
        setResult(JSON.stringify(data));
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload your Amazon store report</h1>
      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-6">
        <label className="border px-4 py-2 rounded cursor-pointer">
          <span>Select file</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) setFile(e.target.files[0]);
            }}
          />
        </label>
        <div>{file?.name}</div>
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap font-mono">
          {JSON.stringify({ message: result }, null, 2)}
        </div>
      )}
    </div>
  );
}