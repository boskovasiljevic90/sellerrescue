// app/chat/upload/page.tsx
"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setError(null);
    setLoading(true);
    setResponse(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error(`Server error ${res.status}: ${text}`);
        }
        throw new Error(parsed.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload your Amazon store report</h1>
      <form onSubmit={handleSubmit} className="flex gap-4 items-center mb-4">
        <label className="border rounded px-4 py-2 cursor-pointer">
          <span>{file ? file.name : "Select file"}</span>
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
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
      <div className="bg-gray-100 p-4 rounded min-h-[150px]">
        {error && <div className="text-red-600">{"Error: " + error}</div>}
        {response && (
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
        {!error && !response && !loading && (
          <div className="text-gray-500">Upload a PDF/CSV or text report to get insights.</div>
        )}
      </div>
    </div>
  );
}