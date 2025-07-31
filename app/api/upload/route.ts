// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// simple splitter by characters to stay under token limits
function splitTextIntoChunks(text: string, maxChars = 4000): string[] {
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + maxChars));
    cursor += maxChars;
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    let extractedText = "";

    if (name.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (
      name.endsWith(".csv") ||
      name.endsWith(".txt") ||
      name.endsWith(".log")
    ) {
      extractedText = await file.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, CSV, or text." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "Extracted content is empty." },
        { status: 400 }
      );
    }

    const chunks = splitTextIntoChunks(extractedText, 4000);
    const partialSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a concise Amazon seller report analyst. From the provided chunk, extract key issues, anomalies, trends, and actionable insights. Label them clearly.",
          },
          {
            role: "user",
            content: `Chunk ${i + 1} content:\n${chunk}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 800,
      } as any);

      const summary = res.choices?.[0]?.message?.content;
      if (summary) partialSummaries.push(summary);
    }

    const aggregatedPrompt = `
I have these per-chunk analyses from an Amazon seller report. Combine into a single coherent prioritized summary. Deduplicate, surface top 5 critical problems, quick-win opportunities, and ordered next steps.
Chunk summaries:
${partialSummaries
  .map((s, idx) => `--- Chunk ${idx + 1} ---\n${s}`)
  .join("\n\n")}
`;

    const finalRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are the senior Amazon seller account analyst. Merge chunk-level summaries into a final actionable report.",
        },
        {
          role: "user",
          content: aggregatedPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    } as any);

    const finalSummary = finalRes.choices?.[0]?.message?.content;

    return NextResponse.json({
      result: finalSummary,
      perChunk: partialSummaries,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong." },
      { status: 500 }
    );
  }
}