import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  await new Promise((r) => setTimeout(r, 600));
  return NextResponse.json({ ok: true });
}
