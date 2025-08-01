// app/api/upload/route.ts
import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { parse as csvParse } from "csv-parse/sync";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text: string, maxChars = 8000): string[] {
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
    const formData = await (req as any).formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    const contentType = file.type;

    if (contentType === "application/pdf") {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (
      contentType === "text/csv" ||
      file.name.toLowerCase().endsWith(".csv")
    ) {
      const str = buffer.toString("utf-8");
      const records = csvParse(str, { columns: true, skip_empty_lines: true });
      extractedText = JSON.stringify(records, null, 2);
    } else {
      // fallback: raw text
      extractedText = buffer.toString("utf-8");
    }

    // Split into manageable chunks to avoid rate/size limits
    const chunks = chunkText(extractedText, 8000); // adjust chunk size if needed
    let aggregatedResponse = "";

    for (const chunk of chunks) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert Amazon Seller Account AI Analyst. Analyze the following content and provide concise actionable insights.",
          },
          {
            role: "user",
            content: chunk,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const aiText = completion.choices[0].message.content;
      aggregatedResponse += aiText + "\n\n---\n\n";
    }

    return NextResponse.json({ result: aggregatedResponse.trim() });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}