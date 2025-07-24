'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResponse('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setResponse(data.result);
    } else {
      setResponse(`Error: ${data.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Amazon File for Analysis</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded disabled:opacity-50"
        disabled={!file || loading}
      >
        {loading ? 'Analyzing...' : 'Upload and Analyze'}
      </button>

      {response && (
        <div className="mt-6 p-4 bg-gray-100 border rounded">
          <h2 className="font-semibold mb-2">AI Response:</h2>
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}
