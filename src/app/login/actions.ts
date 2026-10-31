"use server";
import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "@/lib/auth";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const pw = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  if (!checkPassword(pw)) return { error: "Wrong password." };
  await createSession();
  redirect(next.startsWith("/") ? next : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
