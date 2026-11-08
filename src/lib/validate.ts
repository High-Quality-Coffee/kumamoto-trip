import { AVATARS, ART } from "./pixel";
import { BOOKING_KINDS, CATS, COLORS, GROUPS, PLACE_CATS, STATUS } from "./constants";
import type { Cat, ItemGroup, PlaceCat, PlaceStatus } from "./types";
import { isDate, isTime } from "./time";

/** 클라이언트에서 온 값은 믿지 않고 여기서 모양을 맞춰요. 문제가 있으면 한국어 메시지로 throw 해요. */
export class InputError extends Error {}

type Raw = Record<string, unknown>;

export const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export function required(v: unknown, label: string, max = 200) {
  const s = str(v, max);
  if (!s) throw new InputError(`${label}을(를) 입력해 주세요.`);
  return s;
}

export function url(v: unknown, label: string) {
  const s = str(v, 2000);
  if (!s) return "";
  if (!/^https?:\/\/\S+$/i.test(s)) throw new InputError(`${label}는 https:// 로 시작해야 해요.`);
  return s;
}

export function oneOf<T extends string>(v: unknown, list: readonly T[], fallback: T): T {
  return (list as readonly string[]).includes(String(v)) ? (v as T) : fallback;
}

export function date(v: unknown, label = "날짜") {
  const s = str(v, 10);
  if (!isDate(s)) throw new InputError(`${label}를 확인해 주세요.`);
  return s;
}

export function time(v: unknown) {
  const s = str(v, 5);
  if (!isTime(s)) throw new InputError("시간을 확인해 주세요. (예: 09:30)");
  return s;
}

export function money(v: unknown, label: string, allowZero = false) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0))
    throw new InputError(`${label}을(를) 0보다 큰 숫자로 입력해 주세요.`);
  if (n > 100_000_000) throw new InputError(`${label}이(가) 너무 커요.`);
  return n;
}

const CAT_KEYS = Object.keys(CATS) as Cat[];

export const questInput = (r: Raw) => ({
  date: date(r.date),
  time: time(r.time),
  cat: oneOf<Cat>(r.cat, CAT_KEYS, "sight"),
  title: required(r.title, "할 일", 80),
  memo: str(r.memo, 500),
  placeId: str(r.placeId, 40),
  mapLink: url(r.mapLink, "구글 지도 링크"),
  mapQuery: str(r.mapQuery, 120),
});

export const placeInput = (r: Raw) => ({
  name: required(r.name, "이름", 80),
  cat: oneOf<PlaceCat>(r.cat, PLACE_CATS, "food"),
  area: str(r.area, 60),
  note: str(r.note, 500),
  mapLink: url(r.mapLink, "구글 지도 링크"),
  mapQuery: str(r.mapQuery, 120),
  imageUrl: url(r.imageUrl, "사진 링크"),
  status: oneOf<PlaceStatus>(r.status, Object.keys(STATUS) as PlaceStatus[], "want"),
  art: oneOf(r.art, Object.keys(ART), "") || "",
});

export const itemInput = (r: Raw) => ({
  text: required(r.text, "준비물", 100),
  group: oneOf<ItemGroup>(r.group, GROUPS, "짐"),
  owner: str(r.owner, 40) || "all",
});

export const expenseInput = (r: Raw) => ({
  date: date(r.date),
  title: required(r.title, "항목", 80),
  amount: money(r.amount, "금액"),
  paidBy: required(r.paidBy, "낸 사람", 40),
});

export const bookingInput = (r: Raw) => ({
  kind: oneOf(r.kind, BOOKING_KINDS, "Etc"),
  title: required(r.title, "이름", 80),
  detail: str(r.detail, 1000),
  code: str(r.code, 60),
});

export const dayMetaInput = (r: Raw) => ({
  title: str(r.title, 40),
  area: str(r.area, 60),
  weather: str(r.weather, 60),
});

export function tripInput(r: Raw) {
  const start = date(r.start, "출발일");
  const end = date(r.end, "도착일");
  if (end < start) throw new InputError("도착일이 출발일보다 빨라요.");
  if (Date.parse(end) - Date.parse(start) > 30 * 864e5)
    throw new InputError("여행은 31일까지 만들 수 있어요.");
  return {
    title: required(r.title, "여행 이름", 60),
    start,
    end,
    budget: money(r.budget ?? 0, "예산", true),
    rate: money(r.rate ?? 920, "환율"),
  };
}

export function playerInput(r: Raw) {
  const roles = Array.isArray(r.roles)
    ? [...new Set(r.roles.map((x) => str(x, 20)).filter(Boolean))].slice(0, 10)
    : [];
  return {
    name: required(r.name, "이름", 20),
    avatar: oneOf(r.avatar, Object.keys(AVATARS), "chick"),
    color: oneOf(r.color, COLORS.map((c) => c.key), "c1"),
    roles,
  };
}

export function password(v: unknown, requiredPw: boolean) {
  const s = String(v ?? "");
  if (!s) {
    if (requiredPw) throw new InputError("비밀번호를 정해 주세요.");
    return "";
  }
  if (s.length < 4) throw new InputError("비밀번호는 4글자 이상으로 해 주세요.");
  if (s.length > 64) throw new InputError("비밀번호가 너무 길어요.");
  return s;
}
