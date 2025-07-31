// app/chat/upload/page.tsx
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading');

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const err = await res.json();
        setOutput(JSON.stringify(err));
        setStatus('error');
        return;
      }
      const json = await res.json();
      if (json.result) {
        setOutput(json.result);
      } else if (json.error) {
        setOutput('Error: ' + json.error);
      } else {
        setOutput('Unexpected response.');
      }
      setStatus('done');
    } catch (e) {
      setOutput('Fetch failed: ' + (e as any).toString());
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Upload your Amazon store report</h1>
      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-6">
        <label className="border px-4 py-2 rounded cursor-pointer">
          <input
            type="file"
            accept=".pdf,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
          {file ? file.name : 'Select file'}
        </label>
        <button
          type="submit"
          disabled={!file || status === 'uploading'}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {status === 'uploading' ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
      <div className="bg-gray-100 p-4 rounded min-h-[200px] whitespace-pre-wrap font-mono text-sm">
        {output || 'Results will appear here.'}
      </div>
    </div>
  );
}