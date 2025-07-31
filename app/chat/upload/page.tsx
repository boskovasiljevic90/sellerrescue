'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text(); // prvo uzmi raw text
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        // pokaži šta je došlo ako nije validan JSON
        throw new Error(`Failed to parse JSON response. Raw response: ${text}`);
      }

      if (!res.ok) {
        setError(data.error || 'Upload failed.');
      } else {
        setAnalysis(data.message || JSON.stringify(data));
      }
    } catch (err: any) {
      setError(err.message || String(err));
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
            accept=".pdf,.csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
        </label>
        <div>{file?.name}</div>
        <button
          type="submit"
          disabled={!file || loading}
          className="ml-auto bg-blue-600 text-white px-6 py-3 rounded"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      <div className="bg-gray-100 p-4 rounded min-h-[200px]">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {analysis && (
          <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
        )}
        {!analysis && !error && !loading && <div>Upload a report and get insights.</div>}
      </div>
    </div>
  );
}