// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { checkFreemium } from '../../lib/subscription';

export const config = {
  api: {
    bodyParser: false,  // onemogući Next.js-ov JSON parser
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function parseForm(req: NextApiRequest): Promise<formidable.Files> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!checkFreemium(req, res)) return;

  try {
    const files = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !('filepath' in file)) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // učitaj bytes fajla
    const data = fs.readFileSync(file.filepath);
    const parsed = await pdfParse(data);
    const text = parsed.text;

    // pošalji OpenAI-ju
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Amazon Seller Account AI Analyst. Analyze the following extracted content from a user-uploaded PDF file and provide helpful insights and suggestions for improvements.',
            'You are SellerRescue, an expert Amazon seller problem solver. Analyze the following extracted content from a user-uploaded PDF file and provide helpful insights and suggestions for improvements.',
        },
        { role: 'user', content: text },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return res.status(200).json({ result: aiResponse });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}