// app/api/upload/route.ts
import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { parse as csvParse } from "csv-parse/sync";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Simple chunking to avoid too-large requests
function chunkText(text: string, maxChars = 7000): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    // Expect a multipart/form-data with field "file"
    const formData = await (req as any).formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    const name = (file as any).name || "";
    const type = (file as any).type || "";

    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (
      type === "text/csv" ||
      name.toLowerCase().endsWith(".csv")
    ) {
      const str = buffer.toString("utf-8");
      const records = csvParse(str, { columns: true, skip_empty_lines: true });
      extractedText = JSON.stringify(records, null, 2);
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "File parsed to empty content." }, { status: 400 });
    }

    const chunks = chunkText(extractedText, 6000);
    let aggregated = "";

    for (const chunk of chunks) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert Amazon Seller Account analyst. Provide concise actionable insights based on the content.",
          },
          {
            role: "user",
            content: chunk,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const part = completion.choices?.[0]?.message?.content || "";
      aggregated += part + "\n\n---\n\n";
    }

    return NextResponse.json({ result: aggregated.trim() });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Server error." }, { status: 500 });
  }
}