"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Report for Analysis</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <label className="border rounded px-3 py-2 cursor-pointer flex-1">
            <span>{file ? file.name : "Choose file (PDF or CSV)"}</span>
            <input
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) setFile(e.target.files[0]);
              }}
            />
          </label>
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </form>
      <div className="mt-6 bg-gray-100 p-4 rounded">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {result && (
          <div>
            <h2 className="font-semibold mb-2">Analysis Result:</h2>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        {!result && !error && !loading && (
          <div className="text-gray-500">Upload a PDF or CSV to get insights.</div>
        )}
      </div>
    </div>
  );
}