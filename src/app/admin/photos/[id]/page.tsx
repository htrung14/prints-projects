/**
 * /admin/photos/[id] - edit a single photo.
 *
 * Renders a plain `<form>` whose action is a server action defined in this
 * file. All fields on the `photos` table except id/created_at are editable.
 *
 * Image upload is out of scope for v1 (see Track E spec): `image_url` is a
 * plain text field. The seed pipeline + a future admin upload workflow will
 * replace this with an actual uploader.
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getPhotoForAdmin, updatePhotoAdmin } from "@/app/admin/_data";
import { audit } from "@/lib/supabase/queries/audit";

export const dynamic = "force-dynamic";

function str(f: FormData, key: string): string {
  const v = f.get(key);
  return typeof v === "string" ? v : "";
}

function numOrThrow(f: FormData, key: string): number {
  const v = str(f, key);
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Field "${key}" must be a number.`);
  }
  return n;
}

/**
 * Parse a "description" textarea where each non-empty line becomes one
 * paragraph string. Mirrors how the fixture seeds paragraphs.
 */
function parseDescription(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parse a JSON text area back into an array of objects. Used for sizes/papers
 * since v1 has no structured editor for these.
 */
function parseJsonArray(raw: string, label: string): unknown[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw new Error(
      `Field "${label}" is not valid JSON: ${e instanceof Error ? e.message : "parse error"}`
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`Field "${label}" must be a JSON array.`);
  }
  return parsed;
}

async function savePhoto(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = str(formData, "id");
  if (!id) throw new Error("Missing photo id.");

  const patch = {
    slug: str(formData, "slug"),
    reference_number: str(formData, "referenceNumber"),
    title: str(formData, "title"),
    title_italic: str(formData, "titleItalic") || null,
    subtitle: str(formData, "subtitle") || null,
    year: numOrThrow(formData, "year"),
    description: parseDescription(str(formData, "description")),
    image_url: str(formData, "imageUrl"),
    image_alt: str(formData, "imageAlt"),
    base_price_cents: numOrThrow(formData, "basePriceCents"),
    sizes: parseJsonArray(str(formData, "sizes"), "sizes"),
    papers: parseJsonArray(str(formData, "papers"), "papers"),
    edition_total: numOrThrow(formData, "editionTotal"),
    edition_sold: numOrThrow(formData, "editionSold"),
    is_published: str(formData, "isPublished") === "on",
    sort_order: numOrThrow(formData, "sortOrder"),
    print_file_key: str(formData, "printFileKey") || null,
  };

  await updatePhotoAdmin(id, patch);
  await audit({
    orderId: null,
    actor: session.email,
    action: "photo_updated",
    meta: { photoId: id },
  });

  revalidatePath("/admin/photos");
  revalidatePath(`/admin/photos/${id}`);
  redirect(`/admin/photos/${id}?saved=1`);
}

export default async function EditPhotoPage({
  params,
  searchParams,
}: PageProps<"/admin/photos/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/photos/${id}`);
  const photo = await getPhotoForAdmin(id);
  if (!photo) notFound();

  const q = await searchParams;
  const justSaved = q.saved === "1";

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/admin/photos" className="text-xs text-ink-faint underline underline-offset-4">
          ← Photos
        </Link>
        <h1 className="h-display">Edit {photo.title}</h1>
        {justSaved ? (
          <p className="text-sm" style={{ color: "rgba(0, 100, 0, 0.85)" }}>
            Saved.
          </p>
        ) : null}
      </header>

      <form action={savePhoto} className="flex flex-col gap-5 text-sm">
        <input type="hidden" name="id" defaultValue={photo.id} />

        <Field label="Slug" name="slug" defaultValue={photo.slug} required />
        <Field
          label="Reference number"
          name="referenceNumber"
          defaultValue={photo.referenceNumber}
          required
        />
        <Field label="Title" name="title" defaultValue={photo.title} required />
        <Field label="Title (italic)" name="titleItalic" defaultValue={photo.titleItalic ?? ""} />
        <Field label="Subtitle" name="subtitle" defaultValue={photo.subtitle ?? ""} />
        <Field label="Year" name="year" type="number" defaultValue={String(photo.year)} required />

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-faint">Description (one paragraph per line)</span>
          <textarea
            name="description"
            rows={6}
            defaultValue={photo.description.join("\n")}
            className="border border-ink-line bg-transparent px-2 py-1.5 text-ink-strong outline-none focus:border-ink-strong"
          />
        </label>

        <Field
          label="Image URL"
          name="imageUrl"
          defaultValue={photo.imageUrl}
          required
          hint="TODO: replace with an uploader once image-upload is in scope."
        />
        <Field label="Image alt" name="imageAlt" defaultValue={photo.imageAlt} required />

        <Field
          label="Base price (cents)"
          name="basePriceCents"
          type="number"
          defaultValue={String(photo.basePriceCents)}
          required
        />

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-faint">
            Sizes (JSON array of {"{id, label, multiplier}"})
          </span>
          <textarea
            name="sizes"
            rows={4}
            defaultValue={JSON.stringify(photo.sizes ?? [], null, 2)}
            className="border border-ink-line bg-transparent px-2 py-1.5 font-mono text-xs text-ink-strong outline-none focus:border-ink-strong"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-faint">
            Papers (JSON array of {"{id, name, surchargeCents}"})
          </span>
          <textarea
            name="papers"
            rows={4}
            defaultValue={JSON.stringify(photo.papers ?? [], null, 2)}
            className="border border-ink-line bg-transparent px-2 py-1.5 font-mono text-xs text-ink-strong outline-none focus:border-ink-strong"
          />
        </label>

        <Field
          label="Edition total"
          name="editionTotal"
          type="number"
          defaultValue={String(photo.editionTotal)}
          required
        />
        <Field
          label="Edition sold"
          name="editionSold"
          type="number"
          defaultValue={String(photo.editionSold)}
          required
          hint="Normally assigned by the webhook. Edit with care."
        />
        <Field
          label="Sort order"
          name="sortOrder"
          type="number"
          defaultValue={String(photo.sortOrder)}
          required
        />
        <Field
          label="Print file key (R2 object key)"
          name="printFileKey"
          defaultValue={photo.printFileKey ?? ""}
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={photo.isPublished} />
          <span>Published</span>
        </label>

        <div className="flex gap-3">
          <button type="submit" className="btn-ghost self-start">
            Save
          </button>
          <Link
            href="/admin/photos"
            className="self-start border border-ink-line px-3 py-1.5 text-sm hover:bg-bg-soft"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-faint">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="border-b border-ink-line bg-transparent py-1.5 text-ink-strong outline-none focus:border-ink-strong"
      />
      {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
}
