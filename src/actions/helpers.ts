import "server-only";
import { refresh } from "next/cache";
import type { ActionResult, Player, Trip } from "@/lib/types";
import { getMe } from "@/lib/session";
import { getStore, NotFoundError } from "@/lib/store";
import { InputError } from "@/lib/validate";

export class AuthError extends Error {}

export async function needMe(admin = false): Promise<Player> {
  const me = await getMe();
  if (!me) throw new AuthError("로그인이 필요해요. 다시 로그인해 주세요.");
  if (admin && !me.admin) throw new AuthError("관리자만 할 수 있어요.");
  return me;
}

/** 서버 액션 공통 처리: 에러를 한국어 메시지로 바꾸고, 성공하면 화면을 새로고침해요. */
export async function run(job: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const id = await job();
    refresh();
    return { ok: true, id: id || undefined };
  } catch (e) {
    if (e instanceof InputError || e instanceof AuthError) return { ok: false, error: e.message };
    if (e instanceof NotFoundError) return { ok: false, error: "이미 삭제됐거나 찾을 수 없어요. 새로고침해 주세요." };
    console.error(e);
    return { ok: false, error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}

export const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

/** 여행 문서를 트랜잭션으로 고쳐요. version 을 올려서 다른 가족 화면이 바뀐 걸 알아채게 해요. */
export async function mutateTrip(tripId: string, me: Player, fn: (t: Trip, now: number) => void) {
  const store = await getStore();
  await store.update<Trip>("trips", tripId, (t) => {
    const now = Date.now();
    fn(t, now);
    t.version = (t.version ?? 0) + 1;
    t.updatedAt = now;
    t.updatedBy = me.id;
    return t;
  });
}
