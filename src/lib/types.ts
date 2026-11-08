export type Cat = "food" | "sight" | "onsen" | "shop" | "move" | "stay";
export type PlaceCat = "food" | "sight" | "onsen" | "shop";
export type PlaceStatus = "want" | "confirmed" | "visited";
export type ItemGroup = "서류" | "돈·통신" | "짐" | "예약·할 일";

/** 화면에 보여줘도 되는 가족 정보 (비밀번호 해시 없음) */
export type Player = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  roles: string[];
  admin: boolean;
};

/** DB에 저장되는 가족 정보 */
export type PlayerRecord = Player & {
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

type Authored = {
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
};

export type Quest = Authored & {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  cat: Cat;
  title: string;
  memo: string;
  placeId: string;
  mapLink: string;
  mapQuery: string;
  art: string;
  done: boolean;
  doneBy: string;
};

export type Wish = { by: string; text: string };

export type Place = Authored & {
  id: string;
  name: string;
  cat: PlaceCat;
  area: string;
  note: string;
  mapLink: string;
  mapQuery: string;
  imageUrl: string;
  status: PlaceStatus;
  art: string;
  wishes: Wish[];
};

export type Item = Authored & {
  id: string;
  text: string;
  group: ItemGroup;
  owner: string; // player id 또는 "all"
  got: boolean;
};

export type Expense = Authored & {
  id: string;
  date: string;
  title: string;
  amount: number; // 엔
  paidBy: string;
};

export type Booking = Authored & {
  id: string;
  kind: string;
  title: string;
  detail: string;
  code: string;
};

export type DayMeta = { title: string; area: string; weather: string };

export type Trip = Authored & {
  id: string;
  title: string;
  start: string;
  end: string;
  budget: number; // 엔
  rate: number; // 100엔당 원
  dayMeta: Record<string, DayMeta>;
  quests: Quest[];
  places: Place[];
  items: Item[];
  expenses: Expense[];
  bookings: Booking[];
  version: number;
};

export type TripSummary = Pick<
  Trip,
  "id" | "title" | "start" | "end" | "createdAt"
> & { questCount: number; doneCount: number };

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
