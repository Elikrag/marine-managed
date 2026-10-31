import { isAuthed } from "@/lib/auth";
import { getDocument } from "@/lib/data";
import { readUpload } from "@/lib/files";

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[id]">) {
  if (!(await isAuthed())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const d = await getDocument(id);
  if (!d) return new Response("not found", { status: 404 });
  const buf = await readUpload(d.filename);
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": d.mimeType ?? "application/octet-stream",
      "content-disposition": `inline; filename="${encodeURIComponent(d.title)}"`,
      "cache-control": "private, max-age=3600",
    },
  });
}
