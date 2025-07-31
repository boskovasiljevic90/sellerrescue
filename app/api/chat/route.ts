import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Limiti input kako ne bi prešao token granicu
    const limitedMessages = messages.map((msg: any) => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content.slice(0, 5000) : msg.content,
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: limitedMessages,
      stream: false,
    });

    return NextResponse.json({
      message: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error('API error: ', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}