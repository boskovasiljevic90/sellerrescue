// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Utility to truncate long text to roughly limit tokens.
 * This is naive: ~4 characters per token average, so cap length.
 */
function truncateForModel(text: string, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Truncated remaining content due to size limits]';
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let textContent = '';

    // Handle multipart/form-data upload (PDF or CSV)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
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
        // other file types: try to read as plain text
        const arrayBuffer = await file.arrayBuffer();
        textContent = Buffer.from(arrayBuffer).toString('utf-8');
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type. Use multipart/form-data with a file.' }, { status: 400 });
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: 'Uploaded file contained no extractable text.' }, { status: 400 });
    }

    // Truncate to safe size to avoid hitting token limits
    const safeText = truncateForModel(textContent, 14000);

    const systemPrompt = `
You are an expert Amazon Seller Account Analyst. The user uploaded a report (PDF or CSV) containing store performance data.
Analyze the content and return:
1. Key issues or anomalies (returns, sales drop, high refund rate, pricing mismatches, etc.).
2. Suggestions for immediate actionable improvements.
3. If data is incomplete or appears malformed, explain what is missing or how to get better data.
Keep answer concise but specific.`;

    const userPrompt = `
Here is the extracted content from the uploaded file (possibly truncated if too large):

${safeText}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000, // limit output size
    });

    const aiResponse = completion.choices?.[0]?.message?.content || 'No response from AI.';
    return NextResponse.json({ message: aiResponse });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
  }
}