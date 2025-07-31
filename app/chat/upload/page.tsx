'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setResponse(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = reader.result?.toString();
        if (!content) {
          setError('Could not read file.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: nanoid(),
            messages: [
              {
                role: 'user',
                content: `Analyze this file content and provide actionable insights:\n\n${content}`,
              },
            ],
          }),
        });

        const data = await res.text();
        setResponse(data);
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Upload failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload File for Analysis</h1>
      <input
        type="file"
        accept="*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-black text-white rounded"
        disabled={loading || !file}
      >
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>

      {error && (
        <div className="mt-4 text-red-500 font-semibold">{error}</div>
      )}

      {response && (
        <div className="mt-6 bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm font-mono">
          {response}
        </div>
      )}
    </div>
  );
}
