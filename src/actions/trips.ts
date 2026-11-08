"use server";

import { redirect } from "next/navigation";
import type { ActionResult, PlayerRecord, Trip } from "@/lib/types";
import { DEFAULT_RATE, STATUS } from "@/lib/constants";
import { buildSampleTrip } from "@/lib/sample";
import { getStore } from "@/lib/store";
import {
  bookingInput, dayMetaInput, expenseInput, InputError, itemInput, placeInput, questInput, str, tripInput, date,
} from "@/lib/validate";
import { needMe, newId, mutateTrip, run } from "./helpers";
import type { PlaceStatus } from "@/lib/types";

type Raw = Record<string, unknown>;

export async function createTrip(raw: Raw): Promise<ActionResult> {
  const res = await run(async () => {
    const me = await needMe();
    const data = tripInput({ rate: DEFAULT_RATE, ...raw });
    const id = newId();
    const now = Date.now();
    const trip: Trip = {
      id, ...data, dayMeta: {}, quests: [], places: [], items: [], expenses: [], bookings: [], version: 1,
      createdBy: me.id, updatedBy: me.id, createdAt: now, updatedAt: now,
    };
    await (await getStore()).set("trips", id, trip);
    return id;
  });
  if (res.ok) redirect(`/trips/${res.id}`);
  return res;
}

export async function updateTrip(tripId: string, raw: Raw): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    const data = tripInput(raw);
    await mutateTrip(tripId, me, (t) => Object.assign(t, data));
  });
}

export async function deleteTrip(tripId: string): Promise<ActionResult> {
  const res = await run(async () => {
    await needMe(true);
    await (await getStore()).remove("trips", String(tripId));
  });
  if (res.ok) redirect("/");
  return res;
}

export async function loadSampleTrip(): Promise<ActionResult> {
  const res = await run(async () => {
    const me = await needMe(true);
    const store = await getStore();
    const players = (await store.list<PlayerRecord>("players")).sort(
      (a, b) => Number(b.admin) - Number(a.admin) || a.createdAt - b.createdAt,
    );
    const id = newId();
    await store.set("trips", id, buildSampleTrip(id, players.map((p) => p.id), me.id, Date.now()));
    return id;
  });
  if (res.ok) redirect(`/trips/${res.id}`);
  return res;
}

export async function saveDay(tripId: string, day: string, raw: Raw): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    const d = date(day);
    const meta = dayMetaInput(raw);
    await mutateTrip(tripId, me, (t) => {
      t.dayMeta = { ...(t.dayMeta ?? {}), [d]: meta };
    });
  });
}

/* ---------- 일정 · 장소 · 준비물 · 경비 · 예약 ---------- */
const KINDS = {
  quest: { key: "quests", input: questInput },
  place: { key: "places", input: placeInput },
  item: { key: "items", input: itemInput },
  expense: { key: "expenses", input: expenseInput },
  booking: { key: "bookings", input: bookingInput },
} as const;
export type EntityKind = keyof typeof KINDS;

function checkInRange(t: Trip, d: string) {
  if (d < t.start || d > t.end) throw new InputError("여행 날짜 안에서 골라 주세요.");
}

export async function saveEntity(tripId: string, kind: EntityKind, id: string | null, raw: Raw): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    const spec = KINDS[kind];
    if (!spec) throw new InputError("알 수 없는 항목이에요.");
    const data = spec.input(raw) as Record<string, unknown>;
    const newKey = newId();
    await mutateTrip(tripId, me, (t, now) => {
      if ("date" in data) checkInRange(t, String(data.date));
      if (kind === "quest" && data.placeId && !t.places.some((p) => p.id === data.placeId)) data.placeId = "";
      const list = (t[spec.key] ?? []) as unknown as Record<string, unknown>[];
      if (id) {
        const cur = list.find((x) => x.id === id);
        if (!cur) throw new InputError("이미 삭제된 항목이에요. 새로고침해 주세요.");
        Object.assign(cur, data, { updatedBy: me.id, updatedAt: now });
      } else {
        const extra: Record<string, unknown> =
          kind === "quest" ? { art: "", done: false, doneBy: "" }
          : kind === "place" ? { wishes: str(raw.wish, 120) ? [{ by: me.id, text: str(raw.wish, 120) }] : [] }
          : kind === "item" ? { got: false }
          : {};
        list.push({ id: newKey, ...extra, ...data, createdBy: me.id, updatedBy: me.id, createdAt: now, updatedAt: now });
        (t as unknown as Record<string, unknown>)[spec.key] = list;
      }
    });
    return id ?? newKey;
  });
}

export async function deleteEntity(tripId: string, kind: EntityKind, id: string): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    const spec = KINDS[kind];
    if (!spec) throw new InputError("알 수 없는 항목이에요.");
    await mutateTrip(tripId, me, (t) => {
      const rec = t as unknown as Record<string, { id: string }[]>;
      rec[spec.key] = (rec[spec.key] ?? []).filter((x) => x.id !== id);
      if (kind === "place") t.quests.forEach((q) => { if (q.placeId === id) q.placeId = ""; });
    });
  });
}

export async function setQuestDone(tripId: string, id: string, done: boolean): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    await mutateTrip(tripId, me, (t, now) => {
      const q = t.quests.find((x) => x.id === id);
      if (!q) throw new InputError("이미 삭제된 일정이에요.");
      Object.assign(q, { done: !!done, doneBy: done ? me.id : "", updatedBy: me.id, updatedAt: now });
    });
  });
}

export async function setItemGot(tripId: string, id: string, got: boolean): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    await mutateTrip(tripId, me, (t, now) => {
      const i = t.items.find((x) => x.id === id);
      if (!i) throw new InputError("이미 삭제된 준비물이에요.");
      Object.assign(i, { got: !!got, updatedBy: me.id, updatedAt: now });
    });
  });
}

export async function setPlaceStatus(tripId: string, id: string, status: PlaceStatus): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    if (!(status in STATUS)) throw new InputError("알 수 없는 상태예요.");
    await mutateTrip(tripId, me, (t, now) => {
      const p = t.places.find((x) => x.id === id);
      if (!p) throw new InputError("이미 삭제된 장소예요.");
      Object.assign(p, { status, updatedBy: me.id, updatedAt: now });
    });
  });
}

/** 내 "하고 싶은 것". 빈 글이면 지워요. */
export async function setWish(tripId: string, placeId: string, text: string): Promise<ActionResult> {
  return run(async () => {
    const me = await needMe();
    const body = str(text, 120);
    await mutateTrip(tripId, me, (t) => {
      const p = t.places.find((x) => x.id === placeId);
      if (!p) throw new InputError("이미 삭제된 장소예요.");
      const wishes = p.wishes ?? [];
      const mine = wishes.find((w) => w.by === me.id);
      if (!body) p.wishes = wishes.filter((w) => w.by !== me.id);
      else if (mine) mine.text = body;
      else p.wishes = [...wishes, { by: me.id, text: body }];
    });
  });
}
