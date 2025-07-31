import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

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

    const parsed = await pdfParse(buffer);
    const fullText = parsed.text;

    // Step 1: Summarize the PDF to avoid token limits
    const summarization = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Summarize the key contents of the following Amazon seller PDF report within 1000 tokens.',
        },
        {
          role: 'user',
          content: fullText.slice(0, 15000), // prevent 3.5-turbo overload
        },
      ],
    });

    const summary = summarization.choices[0].message.content || '';

    // Step 2: Analyze the summarized content using GPT-4
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Amazon Seller Account AI Analyst. Based on the following summarized content, provide actionable insights, warnings, and suggestions for account improvement.',
        },
        {
          role: 'user',
          content: summary,
        },
      ],
    });

    const finalResponse = analysis.choices[0].message.content;
    return NextResponse.json({ message: finalResponse });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: String(error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}