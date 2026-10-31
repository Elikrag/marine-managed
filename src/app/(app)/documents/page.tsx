import Link from "next/link";
import { getDocuments, requireBoat } from "@/lib/data";
import { DOC_KINDS, shortDate } from "@/lib/format";
import { Empty, Field, FilterLink, Input, PageHeader, Select } from "@/components/ui";
import { uploadDocument } from "./actions";
import { attachOptions } from "./attach-options";

function size(n: number | null) {
  if (!n) return "";
  return n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`;
}

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const sp = await searchParams;
  const boat = await requireBoat();
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const rows = await getDocuments(boat.id, { kind: kind || undefined, q: q || undefined });
  const options = sp.new ? await attachOptions() : [];

  return (
    <>
      <PageHeader eyebrow="Documents" title="Documents" actions={<Link href="/documents?new=1" className="btn primary">Upload</Link>}>
        Manuals, receipts, policies, photos. PDFs and text files get their text extracted so Claude can search inside them.
      </PageHeader>

      {sp.new && (
        <form action={uploadDocument} className="card mb-4 max-w-3xl p-5" encType="multipart/form-data">
          {sp.error && <p className="mb-2 text-sm text-crit">Pick a file first.</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="File" className="sm:col-span-3"><input type="file" name="file" id="file" required className="input" /></Field>
            <Field label="Title"><Input name="title" placeholder="defaults to file name" /></Field>
            <Field label="Kind"><Select name="kind" value="manual" options={DOC_KINDS} /></Field>
            <Field label="Attach to"><Select name="attach" value={typeof sp.attach === "string" ? sp.attach : ""} allowEmpty="— nothing —" options={options} /></Field>
          </div>
          <div className="mt-3 flex gap-2"><button className="btn primary">Upload</button><Link href="/documents" className="btn">Cancel</Link></div>
        </form>
      )}

      <form action="/documents" className="mb-3 flex flex-wrap items-center gap-1.5">
        <FilterLink href="/documents" active={!kind}>all</FilterLink>
        {DOC_KINDS.map((k) => <FilterLink key={k} href={`/documents?kind=${k}`} active={kind === k}>{k}</FilterLink>)}
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="q" defaultValue={q} placeholder="search inside documents…" className="input ml-auto max-w-[220px] py-1 text-xs" />
      </form>

      {rows.length === 0 ? (
        <Empty action={<Link href="/documents?new=1" className="btn">Upload the owner&apos;s manual</Link>}>No documents{q ? " match" : " yet"}.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((d) => (
            <Link key={d.id} href={`/documents/${d.id}`} className="card flex aspect-[4/5] flex-col justify-end p-3 hover:border-accent">
              <div className="mb-auto">
                {d.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${d.id}`} alt="" className="max-h-28 w-full rounded object-cover" />
                ) : (
                  <div className="font-mono text-3xl text-muted/50">{d.filename.split(".").pop()?.toUpperCase()}</div>
                )}
              </div>
              <div className="eyebrow">{d.kind} · {size(d.size)}</div>
              <div className="line-clamp-2 text-sm font-medium">{d.title}</div>
              <div className="text-xs text-muted">{shortDate(d.createdAt.slice(0, 10))}{d.textExtract ? " · text" : ""}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
