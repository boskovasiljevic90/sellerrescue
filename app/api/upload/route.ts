// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// helper da skratimo tekst ako je predugačak (jednostavno trimovanje u ovom primeru)
function truncateText(text: string, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Truncated: original content was larger]';
}

export async function POST(req: Request) {
  try {
    // podržava multipart/form-data upload iz browsera
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // uzmi bajtove i parsiraj PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);
    let text = parsed.text || '';

    // trimuj ako je previše dugačko zbog rate limit-a / tokena
    text = truncateText(text, 15000); // prilagodi po potrebi

    // pripremi poruke za OpenAI
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

    // request ka OpenAI (fallback ako je previše tokena možeš kasnije razdvajati)
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
    // specifičan rate / size feedback
    if (error?.error?.message) {
      return NextResponse.json(
        { error: error.error.message || String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}