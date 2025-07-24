import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${nanoid()}-${file.name}`;
  const filePath = path.join('/tmp', fileName); // Vercel koristi /tmp za privremeno skladištenje

  await writeFile(filePath, buffer);

  return NextResponse.json({
    message: 'File uploaded successfully',
    name: file.name,
    size: file.size,
    path: filePath
  });
}
