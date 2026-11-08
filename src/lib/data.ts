import "server-only";
import type { PlayerRecord, Trip, TripSummary } from "./types";
import { getStore } from "./store";
import { toPlayer } from "./session";

export async function listPlayers() {
  const store = await getStore();
  const recs = await store.list<PlayerRecord>("players");
  return recs
    .sort((a, b) => Number(b.admin) - Number(a.admin) || a.createdAt - b.createdAt)
    .map(toPlayer);
}

export async function hasAnyPlayer() {
  return (await (await getStore()).list<PlayerRecord>("players")).length > 0;
}

export async function listTrips(): Promise<TripSummary[]> {
  const trips = await (await getStore()).list<Trip>("trips");
  return trips
    .sort((a, b) => a.start.localeCompare(b.start) || a.createdAt - b.createdAt)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: t.start,
      end: t.end,
      createdAt: t.createdAt,
      questCount: t.quests?.length ?? 0,
      doneCount: (t.quests ?? []).filter((q) => q.done).length,
    }));
}

export async function getTrip(id: string) {
  return (await getStore()).get<Trip>("trips", id);
}
