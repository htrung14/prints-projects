/**
 * POST /api/admin/photos/[id]/publish
 *
 * Body: { isPublished: boolean }
 *
 * Flips a photo's `is_published` flag. Called from the admin photos list and
 * the edit page. Writes an audit entry.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { updatePhotoAdmin, getPhotoForAdmin } from "@/app/admin/_data";
import { audit } from "@/lib/supabase/queries/audit";

const Body = z.object({ isPublished: z.boolean() });

export async function POST(request: Request, ctx: RouteContext<"/api/admin/photos/[id]/publish">) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "invalid body" },
      { status: 400 }
    );
  }

  const photo = await getPhotoForAdmin(id);
  if (!photo) {
    return NextResponse.json({ error: "photo not found" }, { status: 404 });
  }

  await updatePhotoAdmin(id, { is_published: body.isPublished });
  await audit({
    orderId: null,
    actor: session.email,
    action: body.isPublished ? "photo_published" : "photo_unpublished",
    meta: { photoId: id },
  });

  return NextResponse.json({ ok: true, isPublished: body.isPublished });
}
