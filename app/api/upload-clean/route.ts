// app/api/upload-clean/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ status: 'upload-clean route reachable (POST)' });
}