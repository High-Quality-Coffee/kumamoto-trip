"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { ActionResult, PlayerRecord } from "@/lib/types";
import { createSession, destroySession } from "@/lib/session";
import { getStore } from "@/lib/store";
import { InputError, password, playerInput } from "@/lib/validate";
import { newId } from "./helpers";

/** 처음 한 번: 가족이 아무도 없을 때 관리자 계정을 만들어요. */
export async function setupAdmin(raw: Record<string, unknown>): Promise<ActionResult> {
  try {
    const store = await getStore();
    if ((await store.list<PlayerRecord>("players")).length > 0)
      return { ok: false, error: "이미 관리자가 있어요. 로그인 화면으로 가 주세요." };
    const data = playerInput(raw);
    const pw = password(raw.password, true);
    const id = newId();
    const now = Date.now();
    await store.set<PlayerRecord>("players", id, {
      id,
      ...data,
      roles: data.roles.length ? data.roles : ["관리자"],
      admin: true,
      passwordHash: await bcrypt.hash(pw, 10),
      createdAt: now,
      updatedAt: now,
    });
    await createSession(id);
  } catch (e) {
    if (e instanceof InputError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "만들지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  redirect("/");
}

export async function login(playerId: string, pw: string): Promise<ActionResult> {
  try {
    const rec = await (await getStore()).get<PlayerRecord>("players", String(playerId));
    const ok = rec && pw && (await bcrypt.compare(String(pw), rec.passwordHash));
    if (!ok) {
      await new Promise((r) => setTimeout(r, 500));
      return { ok: false, error: "비밀번호가 맞지 않아요. 다시 입력해 주세요." };
    }
    await createSession(rec.id);
  } catch (e) {
    console.error(e);
    return { ok: false, error: "로그인하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
