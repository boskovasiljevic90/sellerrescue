import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { checkFreemiumApp } from '../../../lib/subscription';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const limit = checkFreemiumApp(req);
  if (limit) return limit;

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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are SellerRescue, an expert Amazon seller problem solver. Provide precise, actionable guidance for any issue.'
        },
        ...limitedMessages
      ],
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
}