/**
 * POST /api/admin/photos/[id]/publish
 *
 * Body: { isPublished: boolean }
 *
 * Flips a photo's `is_published` flag. Called from the admin photos list and
 * the edit page. Writes an audit entry.
 */

import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { updatePhotoAdmin, getPhotoForAdmin } from "@/app/admin/_data";
import { audit } from "@/lib/supabase/queries/audit";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

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

  let photo;
  try {
    photo = await getPhotoForAdmin(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`photos/${id}/publish getPhotoForAdmin failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `POST /api/admin/photos/${id}/publish photo lookup (actor=${session.email})`,
            msg
          )
        )
        .catch((alertErr) => {
          console.error(`photos/${id}/publish: alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load photo. Please retry." }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "photo not found" }, { status: 404 });
  }

  try {
    await updatePhotoAdmin(id, { is_published: body.isPublished });
    await audit({
      orderId: null,
      actor: session.email,
      action: body.isPublished ? "photo_published" : "photo_unpublished",
      meta: { photoId: id },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `photos/${id}/publish db failure (actor=${session.email}, isPublished=${body.isPublished}):`,
      err
    );
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `POST /api/admin/photos/${id}/publish (actor=${session.email}, isPublished=${body.isPublished})`,
            msg
          )
        )
        .catch((alertErr) => {
          console.error(`photos/${id}/publish: alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json(
      { error: "Failed to update publish state. Please retry." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, isPublished: body.isPublished });
}
