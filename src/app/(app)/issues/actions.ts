"use server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, issues, issueNotes } from "@/db";
import { requireAuth } from "@/lib/auth";
import { splitTarget } from "@/lib/data";
import { str } from "@/lib/format";
import { addIssueNote, createIssue, updateIssue } from "@/lib/writes";

function fields(form: FormData) {
  const { targetType, targetId } = splitTarget(str(form.get("target")));
  return {
    title: str(form.get("title")) ?? "Untitled issue",
    status: str(form.get("status")) ?? "open",
    severity: str(form.get("severity")) ?? "med",
    targetType,
    targetId,
    firstNoticed: str(form.get("firstNoticed")),
    symptoms: str(form.get("symptoms")),
    suspectedCause: str(form.get("suspectedCause")),
    estCost: str(form.get("estCost")),
    resolution: str(form.get("resolution")),
    resolvedOn: str(form.get("resolvedOn")),
  };
}

export async function createIssueAction(form: FormData) {
  await requireAuth();
  const row = await createIssue(fields(form), "user");
  redirect(`/issues/${row.id}`);
}

export async function updateIssueAction(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await updateIssue(id, fields(form), "user");
  redirect(`/issues/${id}`);
}

export async function setStatus(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const status = str(form.get("status")) ?? "open";
  await updateIssue(id, { status }, "user");
  redirect(`/issues/${id}`);
}

export async function addNote(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  const body = str(form.get("body"));
  if (body) await addIssueNote(id, body, "user");
  redirect(`/issues/${id}`);
}

export async function deleteNote(form: FormData) {
  await requireAuth();
  const id = str(form.get("noteId"))!;
  const issueId = str(form.get("id"))!;
  await db.delete(issueNotes).where(eq(issueNotes.id, id));
  redirect(`/issues/${issueId}`);
}

export async function deleteIssue(form: FormData) {
  await requireAuth();
  const id = str(form.get("id"))!;
  await db.delete(issueNotes).where(eq(issueNotes.issueId, id));
  await db.delete(issues).where(eq(issues.id, id));
  redirect("/issues");
}
