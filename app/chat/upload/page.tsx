'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setResponse(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/scan', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResponse(data.analysis);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Upload Seller File</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        style={{ marginLeft: 10 }}
      >
        {loading ? 'Analyzing...' : 'Scan File'}
      </button>
      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>AI Analysis:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
}
