// app/api/upload/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "upload route reachable (GET)" });
}

export async function POST(req: Request) {
  return NextResponse.json({ status: "upload route reachable (POST)" });
}