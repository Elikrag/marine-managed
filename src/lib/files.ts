import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");

export async function saveUpload(id: string, file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).toLowerCase().slice(0, 10);
  const filename = `${id}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  return { filename, buf };
}

export async function readUpload(filename: string) {
  return readFile(path.join(UPLOAD_DIR, path.basename(filename)));
}

export async function removeUpload(filename: string) {
  try {
    await unlink(path.join(UPLOAD_DIR, path.basename(filename)));
  } catch {}
}

/** Best-effort text extraction so manuals and receipts are searchable by Claude. */
export async function extractText(buf: Buffer, mime: string | null, name: string): Promise<string | null> {
  try {
    if (mime?.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
      const mod = await import("pdf-parse");
      const PDFParse = (mod as unknown as { PDFParse?: new (o: { data: Buffer }) => { getText(): Promise<{ text: string }> } }).PDFParse;
      if (PDFParse) {
        const parser = new PDFParse({ data: buf });
        const r = await parser.getText();
        return r.text?.trim() || null;
      }
      const legacy = (mod as unknown as { default?: (b: Buffer) => Promise<{ text: string }> }).default;
      if (legacy) return (await legacy(buf)).text?.trim() || null;
      return null;
    }
    if (mime?.startsWith("text/") || /\.(txt|md|csv)$/i.test(name)) return buf.toString("utf8").slice(0, 2_000_000);
  } catch (e) {
    console.warn("extractText failed", e);
  }
  return null;
}
