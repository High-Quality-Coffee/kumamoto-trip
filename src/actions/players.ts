"use server";

import bcrypt from "bcryptjs";
import type { ActionResult, PlayerRecord } from "@/lib/types";
import { getStore } from "@/lib/store";
import { InputError, password, playerInput } from "@/lib/validate";
import { AuthError, needMe, newId, run } from "./helpers";

/** 관리자는 모든 가족을, 다른 가족은 자기 정보만 고칠 수 있어요. 새 가족 추가는 관리자만. */
export async function savePlayer(raw: Record<string, unknown>): Promise<ActionResult> {
  return run(async () => {
    const id = raw.id ? String(raw.id) : "";
    const me = await needMe(!id);
    if (id && !me.admin && me.id !== id) throw new AuthError("내 정보만 고칠 수 있어요.");
    const data = playerInput(raw);
    const pw = password(raw.password, !id);
    const store = await getStore();
    const all = await store.list<PlayerRecord>("players");
    if (all.some((p) => p.name === data.name && p.id !== id))
      throw new InputError(`'${data.name}' 이름은 이미 있어요. 한 사람당 계정은 하나예요.`);
    const now = Date.now();
    if (id) {
      await store.update<PlayerRecord>("players", id, (cur) => ({
        ...cur,
        ...data,
        ...(pw ? { passwordHash: bcrypt.hashSync(pw, 10) } : {}),
        updatedAt: now,
      }));
      return id;
    }
    const nid = newId();
    await store.set<PlayerRecord>("players", nid, {
      id: nid,
      ...data,
      admin: false,
      passwordHash: await bcrypt.hash(pw, 10),
      createdAt: now,
      updatedAt: now,
    });
    return nid;
  });
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe(true);
    if (id === me.id) throw new InputError("관리자 본인은 삭제할 수 없어요.");
    await (await getStore()).remove("players", String(id));
  });
}
