import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = buffer.toString('utf-8');

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Amazon seller account health diagnostics. Analyze the uploaded file and explain any issues or opportunities in the data.',
        },
        {
          role: 'user',
          content: `Analyze this file content:\n\n${content}`,
        },
      ],
    });

    const result = chatResponse.choices[0].message.content;
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Upload analysis error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
