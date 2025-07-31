import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (name.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  // CSV or plain text fallback: decode as utf-8 string
  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content-type, expected multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const extractedText = await extractTextFromFile(file);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Failed to extract any usable text from the uploaded file." },
        { status: 422 }
      );
    }

    const systemPrompt = `
You are an expert Amazon Seller Account AI Analyst. 
Analyze the provided report content and give actionable insights, problems, and prioritized recommendations.
If the content is raw or partially structured, explain what could be improved for better data quality.
Keep answer concise but specific.
`;

    const userMessage = extractedText;

    // Force any to satisfy SDK typing quirk
    const messages: any[] = [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: userMessage },
    ];

    let completion: any;

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.3,
        max_tokens: 1200,
      } as any);
    } catch (err: any) {
      console.warn("GPT-4 failed, falling back to gpt-3.5-turbo:", err.message);
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.3,
        max_tokens: 1200,
      } as any);
    }

    const answer = completion?.choices?.[0]?.message?.content || "";

    if (!answer) {
      return NextResponse.json(
        { error: "OpenAI returned empty response." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: answer });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}