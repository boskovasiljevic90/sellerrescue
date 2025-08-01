// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// helper: skratiti predugačak tekst da ne bi pucao token limit
function truncateText(text: string, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Truncated due to length]';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // parse PDF (radi samo u Node.js runtime, zato ne sme da bude edge)
    const parsed = await pdfParse(buffer);
    let text = parsed.text || '';
    text = truncateText(text, 15000); // prilagodi ako treba

    const messages = [
      {
        role: 'system',
        content:
          'You are an expert Amazon Seller Account Analyst. Analyze the following extracted content from an uploaded PDF and return concise actionable insights, issues, and recommendations. Output in English.',
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.3,
      max_tokens: 1200,
    });

    const aiResponse = completion.choices?.[0]?.message?.content || '';

    return NextResponse.json({ result: aiResponse });
  } catch (error: any) {
    console.error('Upload error:', error);
    const msg =
      error?.error?.message ||
      error?.message ||
      (typeof error === 'string' ? error : 'Unknown error');
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}