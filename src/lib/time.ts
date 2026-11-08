import type { Quest } from "./types";

/** 한국과 일본은 같은 시간대(UTC+9, 서머타임 없음)라 Asia/Seoul 하나로 계산해요. */
export const TZ = "Asia/Seoul";
const DOW = "일월화수목금토";

const FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export type NowParts = { date: string; hm: string; hms: string };

export function nowParts(ms = Date.now()): NowParts {
  const o: Record<string, string> = {};
  for (const p of FMT.formatToParts(new Date(ms))) o[p.type] = p.value;
  return {
    date: `${o.year}-${o.month}-${o.day}`,
    hm: `${o.hour}:${o.minute}`,
    hms: `${o.hour}:${o.minute}:${o.second}`,
  };
}

export const isDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5,
  );
}

export function addDays(date: string, n: number) {
  const d = new Date(Date.parse(date + "T00:00:00Z") + n * 864e5);
  return d.toISOString().slice(0, 10);
}

export type Day = { date: string; label: string; dow: string; index: number };

export function tripDays(start: string, end: string): Day[] {
  const n = daysBetween(start, end);
  if (!(n >= 0)) return [];
  return Array.from({ length: Math.min(n, 60) + 1 }, (_, i) => {
    const date = addDays(start, i);
    const d = new Date(date + "T00:00:00Z");
    return {
      date,
      label: date.slice(5).replace("-", "."),
      dow: DOW[d.getUTCDay()],
      index: i,
    };
  });
}

export const mins = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

export const duration = (m: number) =>
  m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}`;

export function dday(start: string, end: string, today: string) {
  const i = daysBetween(start, today);
  if (i < 0) return `D${i}`;
  if (i <= daysBetween(start, end)) return `DAY ${i + 1}`;
  return "CLEAR";
}

export const sortQuests = (qs: Quest[]) =>
  [...qs].sort((a, b) => a.time.localeCompare(b.time));

export function currentQuest(quests: Quest[], start: string, end: string, now: NowParts) {
  const index = daysBetween(start, now.date);
  const total = daysBetween(start, end) + 1;
  if (index < 0 || index >= total) return { index, cur: null, next: null };
  const list = sortQuests(quests.filter((q) => q.date === now.date));
  let cur: Quest | null = null;
  let next: Quest | null = null;
  for (const q of list) {
    if (q.time <= now.hm) cur = q;
    else {
      next = q;
      break;
    }
  }
  return { index, cur, next };
}

export const fmtRange = (start: string, end: string) =>
  `${start.replaceAll("-", ".")} – ${end.slice(5).replace("-", ".")}`;

export const nightsLabel = (start: string, end: string) => {
  const n = daysBetween(start, end);
  return `${n}박 ${n + 1}일`;
};
