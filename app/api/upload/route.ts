import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export const runtime = 'nodejs'; // force Node.js runtime so pdf-parse/fs rade kako treba

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // parse PDF sadržaj
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    // pošalji OpenAI-u
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Amazon Seller Account AI Analyst. Analyze the following extracted content from a user-uploaded PDF file and provide helpful insights and suggestions for improvements.',
        },
        { role: 'user', content: text },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ result: aiResponse });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}