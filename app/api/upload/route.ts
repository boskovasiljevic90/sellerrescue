// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // pobrini se da je u Vercel env var postavljeno
});

function chunkText(text: string, maxChars = 8000): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    // pokušaj da presečeš na novi red ako može (ne mora strogo)
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > start) end = lastNewline;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // podržava PDF i CSV (samo čita tekstualno za CSV)
    const filename = file.name.toLowerCase();
    let extractedText = '';

    if (filename.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || '';
    } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
      extractedText = await file.text();
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Only PDF, CSV, TXT allowed.' }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'File had no extractable text.' }, { status: 400 });
    }

    // chunkuj ako je preveliko da ne prelazi rate limit / token limit
    const chunks = chunkText(extractedText, 6000); // grubo da ostane ispod token limita

    let combinedAnalysis = '';

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = `
You are an expert Amazon Seller Account analyst. Analyze the following part (${i + 1}/${chunks.length}) of the user-uploaded report. 
Provide concise actionable insights, note anomalies, and if context is missing request clarifying follow-up questions.

Content:
${chunk}
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You help Amazon sellers understand their reports and identify problems/opportunities.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const part = completion.choices?.[0]?.message?.content || '';
      combinedAnalysis += `--- Part ${i + 1} Analysis ---\n${part}\n\n`;
    }

    return NextResponse.json({ result: combinedAnalysis.trim() });
  } catch (err: any) {
    console.error('Upload error:', err);
    const msg = err?.message || String(err);
    return NextResponse.json({ error: 'Something went wrong: ' + msg }, { status: 500 });
  }
}