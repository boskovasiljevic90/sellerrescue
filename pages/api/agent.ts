// pages/api/agent.js
export default async function handler(req, res) {
  const { query } = req.body;
import type { NextApiRequest, NextApiResponse } from 'next';
import { checkFreemium } from '../../lib/subscription';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!checkFreemium(req, res)) return;

  const { query } = req.body as { query?: string };

  if (!query) {
    return res.status(400).json({ error: 'Missing query input.' });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a skilled Amazon account recovery expert. Your job is to analyze seller account suspension reasons and provide precise recovery steps.`
          content: 'You are SellerRescue, an expert Amazon seller problem solver. Provide precise, actionable guidance for any issue.'
        },
        {
          role: 'user',
          content: query
        }
      ]
    })
  });

  const data = await response.json();

  if (data?.choices?.[0]?.message?.content) {
    res.status(200).json({ result: data.choices[0].message.content });
  } else {
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
}