import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { parse } from 'csv-parse/sync';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = '';

    if (file.name.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      content = parsed.text;
    } else if (file.name.endsWith('.csv')) {
      const records = parse(buffer.toString(), {
        columns: true,
        skip_empty_lines: true,
      });
      content = JSON.stringify(records, null, 2);
    } else {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    // Truncate if over token limit
    const tokenLimit = 8000;
    if (content.length > tokenLimit * 4) {
      content = content.slice(0, tokenLimit * 4);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an Amazon Seller Account Analyst. You provide revenue insights, refund analysis, product suggestions, and trend detection based on uploaded reports (CSV or PDF).',
        },
        { role: 'user', content },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return NextResponse.json({ result: aiResponse });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}