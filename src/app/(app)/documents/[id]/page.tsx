import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument, requireBoat, targetNames } from "@/lib/data";
import { DOC_KINDS, fmtDate } from "@/lib/format";
import { Field, FormActions, Input, PageHeader, Row, Section, Select } from "@/components/ui";
import { deleteDocument, updateDocument } from "../actions";
import { attachOptions } from "../attach-options";

export default async function DocumentPage({ params, searchParams }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const boat = await requireBoat();
  const d = await getDocument(id);
  if (!d) notFound();
  const name = await targetNames(boat.id);
  const attach = d.attachedType ? `${d.attachedType}:${d.attachedId ?? ""}` : "";
  const isImg = d.mimeType?.startsWith("image/");
  const isPdf = d.mimeType?.includes("pdf");

  if (sp.edit) {
    const options = await attachOptions();
    if (attach && !options.some((o) => o.value === attach)) options.push({ value: attach, label: attach });
    return (
      <>
        <PageHeader eyebrow="Document" title="Edit document" />
        <form action={updateDocument} className="card max-w-3xl p-5">
          <input type="hidden" name="id" value={d.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Title"><Input name="title" value={d.title} required /></Field>
            <Field label="Kind"><Select name="kind" value={d.kind} options={DOC_KINDS} /></Field>
            <Field label="Attach to"><Select name="attach" value={attach} allowEmpty="— nothing —" options={options} /></Field>
            <Field label="Extracted text (searchable by Claude)" className="sm:col-span-3"><textarea name="textExtract" defaultValue={d.textExtract ?? ""} className="textarea font-mono text-xs" rows={12} /></Field>
          </div>
          <FormActions cancelHref={`/documents/${id}`} deleteAction={deleteDocument} />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow={`Document · ${d.kind}`} title={d.title} actions={<><a href={`/api/files/${d.id}`} className="btn" target="_blank" rel="noreferrer">Open file</a><Link href={`/documents/${id}?edit=1`} className="btn primary">Edit</Link></>} />
      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <Section title="Facts">
          <Row k="file" v={<span className="font-mono text-xs">{d.filename}</span>} />
          <Row k="type" v={d.mimeType} />
          <Row k="size" v={d.size ? `${Math.round(d.size / 1e3)} KB` : null} />
          <Row k="uploaded" v={fmtDate(d.createdAt.slice(0, 10))} />
          <Row k="attached to" v={d.attachedType ? `${d.attachedType.replace("_", " ")} · ${name(d.attachedType, d.attachedId)}` : null} />
          <Row k="text" v={d.textExtract ? `${d.textExtract.length.toLocaleString()} chars extracted` : "none"} />
        </Section>
        <Section title="Preview">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${d.id}`} alt={d.title} className="max-h-[70vh] rounded" />
          ) : isPdf ? (
            <iframe src={`/api/files/${d.id}`} title={d.title} className="h-[70vh] w-full rounded border border-line" />
          ) : d.textExtract ? (
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap font-mono text-xs">{d.textExtract.slice(0, 20000)}</pre>
          ) : (
            <p className="text-sm text-muted">No preview. Open the file.</p>
          )}
        </Section>
      </div>
    </>
  );
}
