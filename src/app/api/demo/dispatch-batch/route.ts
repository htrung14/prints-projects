import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Update = { orderId: string; carrier: string; trackingNumber: string };

export async function POST(req: Request) {
  await new Promise((r) => setTimeout(r, 800));
  const body = (await req.json()) as { updates?: Update[] };
  const updates = body.updates ?? [];
  return NextResponse.json({
    succeeded: updates.map((u) => u.orderId),
    failed: [],
  });
}
