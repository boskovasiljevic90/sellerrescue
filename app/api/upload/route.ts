import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    console.log('👉 Request received');

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      console.log('❌ No file found or file is string');
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ File converted to buffer');

    const parsed = await pdfParse(buffer);
    const text = parsed.text;
    console.log('✅ PDF parsed successfully');

    const shortText = text.slice(0, 12000); // avoid token overflow
    console.log('📤 Sending to OpenAI, length:', shortText.length);

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
          content: shortText,
        },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response from AI.';
    console.log('✅ OpenAI responded');

    return NextResponse.json({ result: aiResponse });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}