// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function truncateForModel(text: string, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Truncated remaining content due to size limits]';
}

export async function POST(req: NextRequest) {
  console.log('[upload] received request');
  try {
    const contentType = req.headers.get('content-type') || '';
    let textContent = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        console.warn('[upload] no file provided');
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      const filename = file.name.toLowerCase();

      if (filename.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await pdfParse(buffer);
        textContent = parsed.text || '';
      } else if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
        const arrayBuffer = await file.arrayBuffer();
        const raw = Buffer.from(arrayBuffer).toString('utf-8');
        textContent = raw;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        textContent = Buffer.from(arrayBuffer).toString('utf-8');
      }
    } else {
      console.warn('[upload] bad content type', contentType);
      return NextResponse.json({ error: 'Unsupported content type. Use multipart/form-data with a file.' }, { status: 400 });
    }

    if (!textContent.trim()) {
      console.warn('[upload] empty extracted text');
      return NextResponse.json({ error: 'Uploaded file contained no extractable text.' }, { status: 400 });
    }

    const safeText = truncateForModel(textContent, 14000);

    const systemPrompt = `
You are an expert Amazon Seller Account Analyst. The user uploaded a report (PDF or CSV) containing store performance data.
Analyze the content and return:
1. Key issues or anomalies.
2. Actionable improvement suggestions.
3. Notes if data is missing or truncated.
Keep it concise.
`;

    const userPrompt = `Extracted content:\n\n${safeText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices?.[0]?.message?.content || 'No response from AI.';
    console.log('[upload] success, returning AI response');
    return NextResponse.json({ message: aiResponse });
  } catch (err: any) {
    console.error('[upload] error caught:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}