import type { Booking, Cat, Expense, Item, ItemGroup, Place, PlaceCat, PlaceStatus, Quest, Trip } from "./types";
import { DEFAULT_RATE } from "./constants";

/**
 * 구마모토 4박 5일 예시 여행 (2026.11.28 – 12.02).
 * 항공 시간·예약번호·금액·날씨는 지어낸 예시예요. 가족 순서대로 만든 사람/하고 싶은 것을 나눠 넣어요.
 */
export function buildSampleTrip(id: string, playerIds: string[], me: string, now: number): Trip {
  const who = (n: number) => playerIds[n % playerIds.length] ?? me;
  let seq = 0;
  const nid = (p: string) => `${p}${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const authored = (by: string) => ({ createdBy: by, updatedBy: by, createdAt: now, updatedAt: now });

  const P = (
    key: string, name: string, query: string, cat: PlaceCat, art: string, area: string, note: string,
    status: PlaceStatus, by: number, wishes: [number, string][],
  ): Place => ({
    id: key, name, cat, art, area, note, status, mapLink: "", mapQuery: query, imageUrl: "",
    wishes: wishes.map(([w, text]) => ({ by: who(w), text })), ...authored(who(by)),
  });

  const places: Place[] = [
    P("kokutei", "고쿠테이 라멘", "黒亭 本店 熊本", "food", "ramen", "구마모토 시내", "마늘칩과 생계란을 올린 구마모토식 돈코츠 라멘. 웨이팅 20~30분.", "confirmed", 0, [[0, "마늘칩 듬뿍 + 차슈 추가"]]),
    P("suganoya", "스가노야 바사시", "菅乃屋 熊本", "food", "don", "구마모토 시내", "말고기회 코스. 저녁은 예약해야 해요.", "confirmed", 1, [[1, "바사시에 소주 한 잔"], [2, "말고기 처음 먹어보기"]]),
    P("imakin", "이마킨 식당 아카우시동", "いまきん食堂 阿蘇", "food", "don", "아소", "아카우시(붉은 소) 덮밥. 줄이 길어요.", "confirmed", 0, [[0, "아카우시동 곱빼기"]]),
    P("kourantei", "고란테이 타이피엔", "紅蘭亭 下通本店", "food", "ramen", "구마모토 시내", "해산물과 채소가 듬뿍 든 당면 수프.", "confirmed", 2, [[2, "따뜻한 국물로 몸 녹이기"]]),
    P("ikinari", "이키나리당고", "いきなり団子 熊本駅", "food", "bun", "구마모토역", "고구마와 팥을 넣은 찐빵. 선물용으로 좋아요.", "want", 2, [[2, "이웃들 선물용으로 사기"]]),
    P("castle", "구마모토성", "熊本城", "sight", "castle", "구마모토 시내", "천수각 내부 관람 약 2시간.", "confirmed", 1, [[1, "천수각 꼭대기에서 시내 내려다보기"]]),
    P("suizenji", "스이젠지 조주엔", "水前寺成趣園", "sight", "garden", "구마모토 시내", "노면전차로 20분. 단풍은 끝물일 수 있어요.", "confirmed", 2, [[2, "정원 산책하고 말차 마시기"]]),
    P("daikanbo", "다이칸보 전망대", "大観峰", "sight", "mountain", "아소", "아소 칼데라가 한눈에 보여요.", "confirmed", 3, [[3, "파노라마 사진 찍기"]]),
    P("kusasenri", "쿠사센리 · 나카다케 화구", "草千里ヶ浜", "sight", "mountain", "아소", "화구는 화산가스 상황에 따라 통제돼요.", "confirmed", 1, [[1, "화구 연기 직접 보기"]]),
    P("nabe", "나베가타키 폭포", "鍋ヶ滝公園", "sight", "waterfall", "오구니", "폭포 뒤쪽으로 들어가서 볼 수 있어요.", "confirmed", 3, [[3, "폭포 뒤에서 가족사진"]]),
    P("takachiho", "다카치호 협곡", "高千穂峡", "sight", "waterfall", "미야자키현", "편도 약 1시간 30분. 일정에 여유가 생기면.", "want", 1, [[1, "보트 타고 협곡 구경"]]),
    P("kurokawa", "구로카와 온천 마을", "黒川温泉", "onsen", "onsen", "아소 북쪽", "입욕 패스 1장으로 노천탕 3곳 순례.", "confirmed", 2, [[2, "노천탕 3곳 다 가기"], [1, "유카타 입고 산책"]]),
    P("kumamon", "구마몬 스퀘어", "くまモンスクエア", "shop", "bag", "구마모토 시내", "구마몬이 나오는 시간을 확인하세요.", "want", 3, [[3, "구마몬이랑 사진 찍기!"]]),
    P("sakura", "사쿠라마치 구마모토", "SAKURA MACHI Kumamoto", "shop", "bag", "구마모토 시내", "버스터미널 겸 쇼핑몰. 옥상 정원.", "want", 0, [[0, "옥상 정원 구경"]]),
    P("amu", "아뮤플라자 구마모토", "アミュプラザくまもと", "shop", "bag", "구마모토역", "돌아가기 전에 기념품 몰아서 사기.", "confirmed", 2, [[2, "회사 동료 선물 사기"]]),
  ];

  const Q = (date: string, time: string, cat: Cat, title: string, memo: string,
    o: { place?: string; art?: string; query?: string; by?: number } = {}): Quest => ({
    id: nid("q"), date, time, cat, title, memo, placeId: o.place ?? "", mapLink: "", mapQuery: o.query ?? "",
    art: o.art ?? "", done: false, doneBy: "", ...authored(who(o.by ?? 0)),
  });
  const d1 = "2026-11-28", d2 = "2026-11-29", d3 = "2026-11-30", d4 = "2026-12-01", d5 = "2026-12-02";
  const quests: Quest[] = [
    Q(d1, "08:40", "move", "인천공항 출발 → 구마모토 공항", "10:10 도착 · 항공권은 정보 탭에 있어요", { art: "plane", query: "阿蘇くまもと空港" }),
    Q(d1, "10:40", "move", "공항 리무진버스 타기", "사쿠라마치까지 약 50분 · 1인 약 1,000엔", { art: "car" }),
    Q(d1, "11:40", "stay", "시내 호텔에 짐 맡기기", "체크인은 15:00부터"),
    Q(d1, "12:10", "food", "점심: 고쿠테이 라멘", "웨이팅 20~30분", { place: "kokutei" }),
    Q(d1, "13:30", "sight", "구마모토성 · 사쿠라노바바", "천수각 관람 약 2시간 · 계단이 많아 편한 신발", { place: "castle", by: 1 }),
    Q(d1, "16:30", "shop", "시모토리 아케이드 · 구마몬 스퀘어", "지붕 있는 상점가라 비 와도 괜찮아요", { place: "kumamon", by: 3 }),
    Q(d1, "18:30", "food", "저녁: 스가노야 바사시 코스", "18:30 예약", { place: "suganoya", by: 1 }),
    Q(d2, "08:30", "move", "렌터카 픽업", "구마모토역 앞 · 국제운전면허증과 여권 필수", { art: "car", query: "熊本駅", by: 1 }),
    Q(d2, "10:00", "sight", "다이칸보 전망대", "바람이 세서 패딩 필수", { place: "daikanbo", by: 3 }),
    Q(d2, "11:30", "food", "점심: 이마킨 식당 아카우시동", "오픈 전에 도착해서 줄 서기", { place: "imakin" }),
    Q(d2, "13:30", "sight", "쿠사센리 · 나카다케 화구", "화구는 화산가스 상황 따라 통제 · 당일 확인", { place: "kusasenri", by: 1 }),
    Q(d2, "16:00", "move", "구로카와 온천으로 이동", "차로 약 1시간 · 산길이라 천천히", { art: "car", query: "黒川温泉", by: 1 }),
    Q(d2, "17:00", "stay", "료칸 체크인 · 가이세키 저녁", "저녁 18:30 · 유카타 입고 식사", { by: 2 }),
    Q(d2, "20:00", "onsen", "료칸 가족탕", "전세 노천탕 예약", { art: "onsen", by: 2 }),
    Q(d3, "08:00", "stay", "료칸 조식", "", { by: 2 }),
    Q(d3, "09:30", "onsen", "입욕 패스로 노천탕 순례", "패스 1장으로 3곳 · 작은 수건 챙기기", { place: "kurokawa", by: 2 }),
    Q(d3, "11:30", "food", "온천 거리 간식 산책", "만주, 푸딩, 고로케 군것질", { art: "bun", by: 3 }),
    Q(d3, "13:00", "sight", "나베가타키 폭포", "계단이 길어요", { place: "nabe", by: 3 }),
    Q(d3, "15:30", "move", "시내로 돌아와서 렌터카 반납", "반납 전에 기름 가득", { art: "car", by: 1 }),
    Q(d3, "18:30", "food", "저녁: 고란테이 타이피엔", "부모님 입맛에 무난", { place: "kourantei", by: 2 }),
    Q(d4, "09:30", "sight", "스이젠지 조주엔 정원", "노면전차로 약 20분", { place: "suizenji", by: 2 }),
    Q(d4, "11:30", "food", "점심: 가라시렌콘 향토 정식", "겨자 연근 튀김 · 식당 후보 정하기", { by: 1 }),
    Q(d4, "13:30", "shop", "사쿠라마치 · 츠루야 백화점", "면세 받으려면 여권 지참", { place: "sakura" }),
    Q(d4, "16:00", "stay", "호텔에서 쉬기", "부모님 체력 충전 시간"),
    Q(d4, "18:30", "food", "저녁: 이자카야에서 마지막 밤", "자리 예약하기"),
    Q(d5, "09:00", "stay", "호텔 체크아웃", "11:00까지 · 짐은 프런트에 맡기기"),
    Q(d5, "09:30", "shop", "구마모토역 아뮤플라자 기념품", "이키나리당고, 구마몬 굿즈", { place: "amu", by: 2 }),
    Q(d5, "12:00", "move", "리무진버스 타고 공항으로", "출발 2시간 전 도착", { art: "car" }),
    Q(d5, "14:30", "move", "구마모토 → 인천", "16:00 도착 · 모두 수고했어요!", { art: "plane" }),
  ];

  const I = (text: string, group: ItemGroup, owner: number | "all", by: number): Item => ({
    id: nid("i"), text, group, owner: owner === "all" ? "all" : who(owner), got: false, ...authored(who(by)),
  });
  const items: Item[] = [
    I("여권 (남은 기간 6개월 이상)", "서류", "all", 0),
    I("국제운전면허증", "서류", 1, 1),
    I("Visit Japan Web 입국 등록", "서류", 0, 0),
    I("여행자 보험 가입", "서류", 0, 0),
    I("엔화 현금 (료칸·시골 식당은 현금만)", "돈·통신", 2, 2),
    I("해외결제 카드", "돈·통신", 0, 0),
    I("eSIM 또는 로밍", "돈·통신", 3, 3),
    I("변환 플러그 (일본은 110V 11자)", "짐", 3, 2),
    I("방한 패딩·목도리 (아소는 0도 근처)", "짐", "all", 2),
    I("상비약 (멀미약·소화제·밴드)", "짐", 2, 2),
    I("온천용 작은 수건·머리끈", "짐", 2, 2),
    I("보조배터리", "짐", 3, 3),
    I("스가노야 저녁 예약", "예약·할 일", 0, 0),
    I("료칸 가족탕 시간 예약", "예약·할 일", 0, 0),
    I("다카치호 갈지 정하기", "예약·할 일", "all", 1),
  ];

  const E = (date: string, title: string, amount: number, paidBy: number): Expense => ({
    id: nid("e"), date, title, amount, paidBy: who(paidBy), ...authored(who(paidBy)),
  });
  const expenses: Expense[] = [
    E(d1, "시내 호텔 3박 (사전 결제 · 예시 금액)", 96000, 0),
    E(d2, "렌터카 2일 (사전 결제 · 예시 금액)", 22000, 0),
    E(d2, "구로카와 료칸 1박 2식 (사전 결제 · 예시 금액)", 128000, 1),
  ];

  const B = (kind: string, title: string, detail: string, code: string): Booking => ({
    id: nid("b"), kind, title, detail, code, ...authored(me),
  });
  const bookings: Booking[] = [
    B("Flight", "가는 비행기 (예시)", "11.28 (토) 인천 08:40 → 구마모토 10:10\n4명", ""),
    B("Flight", "오는 비행기 (예시)", "12.02 (수) 구마모토 14:30 → 인천 16:00\n4명", ""),
    B("Hotel", "시내 호텔 (예시)", "11.28 1박 · 11.30~12.02 2박\n체크인 15:00 · 체크아웃 11:00", ""),
    B("Ryokan", "구로카와 온천 료칸 (예시)", "11.29 (일) 1박 2식\n가이세키 저녁 · 조식 · 가족탕", ""),
    B("Car", "렌터카 (예시)", "픽업 11.29 08:30 구마모토역 앞\n반납 11.30 16:00 같은 곳", ""),
  ];

  return {
    id,
    title: "구마모토 가족여행",
    start: d1,
    end: d5,
    budget: 450000,
    rate: DEFAULT_RATE,
    dayMeta: {
      [d1]: { title: "구마모토 상륙", area: "구마모토 시내", weather: "" },
      [d2]: { title: "아소 대평원", area: "아소 · 구로카와", weather: "시내보다 5도 이상 추워요" },
      [d3]: { title: "온천 마을 순례", area: "구로카와 → 시내", weather: "" },
      [d4]: { title: "시내 자유 탐험", area: "구마모토 시내", weather: "" },
      [d5]: { title: "귀환", area: "구마모토역 → 공항", weather: "" },
    },
    quests,
    places,
    items,
    expenses,
    bookings,
    version: 1,
    ...authored(me),
  };
}
