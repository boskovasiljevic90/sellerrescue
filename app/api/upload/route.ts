import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse to avoid using it during build time
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Amazon Seller Account AI Analyst. Analyze the following extracted content from a user-uploaded PDF file and provide helpful insights and suggestions for improvements.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
