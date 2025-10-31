import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({
    ok: hasUrl && hasKey,
    NEXT_PUBLIC_SUPABASE_URL: hasUrl ? "present" : "missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasKey ? "present" : "missing",
    env: process.env.NODE_ENV,
  });
}
