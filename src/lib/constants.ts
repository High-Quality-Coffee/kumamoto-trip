import type { Cat, ItemGroup, PlaceCat, PlaceStatus } from "./types";

export const COLORS: { key: string; hex: string; name: string }[] = [
  { key: "c1", hex: "#E8344F", name: "빨강" },
  { key: "c2", hex: "#2F6BFF", name: "파랑" },
  { key: "c3", hex: "#0E9A63", name: "초록" },
  { key: "c4", hex: "#8E44DB", name: "보라" },
  { key: "c5", hex: "#E8730C", name: "주황" },
  { key: "c6", hex: "#0B95A3", name: "청록" },
];
export const colorHex = (key: string) =>
  (COLORS.find((c) => c.key === key) ?? COLORS[0]).hex;

export const CATS: Record<Cat, string> = {
  food: "맛집",
  sight: "관광",
  onsen: "온천",
  shop: "쇼핑",
  move: "이동",
  stay: "숙소·휴식",
};
export const CAT_COLOR: Record<Cat, string> = {
  food: "#E8590C",
  sight: "#2F6BFF",
  onsen: "#C2255C",
  shop: "#7B4DDB",
  move: "#5C677D",
  stay: "#0B8F6A",
};
export const PLACE_CATS: PlaceCat[] = ["food", "sight", "onsen", "shop"];
export const STATUS: Record<PlaceStatus, string> = {
  want: "가고 싶음",
  confirmed: "확정",
  visited: "다녀옴",
};
export const GROUPS: ItemGroup[] = ["서류", "돈·통신", "짐", "예약·할 일"];
export const ROLE_SUGGESTIONS = [
  "운전",
  "총무",
  "사진",
  "길찾기",
  "통역",
  "맛집 탐색",
  "짐 담당",
  "일정 짜기",
];
export const BOOKING_KINDS = [
  "Flight",
  "Hotel",
  "Ryokan",
  "Car",
  "Dinner",
  "Ticket",
  "Etc",
];
export const BOOKING_KIND_NAMES: Record<string, string> = {
  Flight: "항공",
  Hotel: "호텔",
  Ryokan: "료칸",
  Car: "렌터카",
  Dinner: "식당",
  Ticket: "티켓",
  Etc: "기타",
};

/** 일본 비상 연락처 (실제 번호) */
export const EMERGENCY: [string, string][] = [
  ["경찰", "110"],
  ["구급차 · 소방", "119"],
  ["주후쿠오카 대한민국 총영사관", "+81-92-771-0461"],
  ["영사콜센터 (24시간, 한국)", "+82-2-3210-0404"],
];

export const DEFAULT_RATE = 920; // 100엔당 원 (여행 설정에서 바꿀 수 있음)
