"use client";

import React, { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResult({ error: "No file selected." });
      return;
    }

    setStatus("Analyzing...");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    let res: Response;
    try {
      res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    } catch (networkErr) {
      setStatus("");
      setResult({ error: "Network error: " + String(networkErr) });
      return;
    }

    const raw = await res.text();
    let data: any;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      setStatus("");
      setResult({
        error: "Failed to parse response. Raw response: " + raw.slice(0, 1000),
      });
      return;
    }

    if (!res.ok) {
      setStatus("");
      setResult({ error: data.error || `Server error ${res.status}` });
      return;
    }

    setStatus("");
    setResult({ result: data.result || data.message || "No result." });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload your Amazon store report</h1>
      <form onSubmit={handleUpload} className="flex items-center gap-4 mb-6">
        <label className="border rounded px-4 py-2 cursor-pointer">
          <span>{file ? file.name : "Select file"}</span>
          <input
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          type="submit"
          disabled={!file}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium"
        >
          {status ? status : "Analyze"}
        </button>
      </form>

      <div className="bg-gray-100 p-4 rounded min-h-[150px]">
        {result ? (
          result.error ? (
            <pre style={{ color: "crimson" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )
        ) : (
          <div className="text-gray-600">Awaiting upload...</div>
        )}
      </div>
    </div>
  );
}