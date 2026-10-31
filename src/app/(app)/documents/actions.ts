"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, documents } from "@/db";
import { requireAuth } from "@/lib/auth";
import { getDocument, logActivity, requireBoat } from "@/lib/data";
import { extractText, removeUpload, saveUpload } from "@/lib/files";
import { str } from "@/lib/format";

export async function uploadDocument(form: FormData) {
  await requireAuth();
  const boat = await requireBoat();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/documents?new=1&error=nofile");
  const id = crypto.randomUUID();
  const { filename, buf } = await saveUpload(id, file);
  const text = await extractText(buf, file.type || null, file.name);
  const attach = str(form.get("attach"));
  const [attachedType, attachedId] = attach ? attach.split(":") : [null, null];
  await db.insert(documents).values({
    id,
    boatId: boat.id,
    title: str(form.get("title")) ?? file.name,
    kind: str(form.get("kind")) ?? "other",
    filename,
    mimeType: file.type || null,
    size: file.size,
    textExtract: text,
    attachedType: attachedType || null,
    attachedId: attachedId || null,
  });
  await logActivity({ actor: "user", action: "write", entityType: "document", entityId: id, summary: `Document uploaded: ${str(form.get("title")) ?? file.name}` });
  redirect(`/documents/${id}`);
}

export async function updateDocument(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const attach = str(form.get("attach"));
  const [attachedType, attachedId] = attach ? attach.split(":") : [null, null];
  await db.update(documents).set({ title: str(form.get("title")) ?? "Untitled", kind: str(form.get("kind")) ?? "other", attachedType: attachedType || null, attachedId: attachedId || null, textExtract: str(form.get("textExtract")) }).where(eq(documents.id, id));
  redirect(`/documents/${id}`);
}

export async function deleteDocument(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const d = await getDocument(id);
  if (d) {
    await removeUpload(d.filename);
    await db.delete(documents).where(eq(documents.id, id));
  }
  redirect("/documents");
}
