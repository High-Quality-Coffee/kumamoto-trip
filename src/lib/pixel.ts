import type { Cat } from "./types";

/** 픽셀 그림 팔레트. 'a'는 그리는 쪽에서 넘겨주는 색(가족 색)으로 칠해요. */
export const PIX: Record<string, string> = {
  k: "#16182F",
  w: "#FFFFFF",
  s: "#C9CDE0",
  r: "#E8344F",
  b: "#3E8EF7",
  c: "#A9D6FF",
  g: "#2FA866",
  o: "#9A6A3A",
  m: "#9AA0B5",
  y: "#FFB627",
  n: "#F3D27A",
  e: "#FFE08A",
  p: "#FF9FB2",
};

export const AVATARS: Record<string, { name: string; rows: string[] }> = {
  bear: { name: "곰", rows: [".kk....kk.", "kaakkkkaak", "kaaaaaaaak", "kakaaaakak", "kaaawwaaak", "kpawkkwapk", "kaaawwaaak", ".kaaaaaak.", "..kkkkkk.."] },
  cat: { name: "고양이", rows: ["k........k", "kk......kk", "kakkkkkkak", "kaaaaaaaak", "kakaaaakak", "kaaakkaaak", "kpaaaaaapk", ".kaaaaaak.", "..kkkkkk.."] },
  rabbit: { name: "토끼", rows: ["..k....k..", ".kak..kak.", ".kpk..kpk.", ".kak..kak.", "kkaakkaakk", "kakaaaakak", "kaaakkaaak", "kpaaaaaapk", ".kkkkkkkk."] },
  fox: { name: "여우", rows: ["k........k", "kak....kak", "kaakkkkaak", "kaaaaaaaak", "kakaaaakak", "kwwaaaawwk", ".kwwkkwwk.", "..kwwwwk..", "...kkkk..."] },
  penguin: { name: "펭귄", rows: ["...kkkk...", "..kkkkkk..", ".kkwwwwkk.", ".kwkwwkwk.", ".kwwyywwk.", "kkwwwwwwkk", "kaaaaaaaak", ".kwwwwwwk.", "..yy..yy.."] },
  chick: { name: "병아리", rows: ["....kk....", "...kaak...", "..kaaaak..", ".kakaakak.", ".kaayyaak.", "kaaaaaaaak", "kpaaaaaapk", ".kaaaaaak.", "..yy..yy.."] },
  robot: { name: "로봇", rows: ["....kk....", "....yy....", ".kkkkkkkk.", ".kaaaaaak.", ".kawaawak.", ".kaaaaaak.", ".kakkkkak.", ".kaaaaaak.", ".kkkkkkkk."] },
};

export const ART: Record<string, string[]> = {
  ramen: ["..s...s...s.", "...s...s...s", "kkkkkkkkkkkk", "kneenngnnnnk", ".krrrrrrrrk.", ".krwrrwrrwk.", "..krrrrrrk..", "...kkkkkk...", "....kkkk...."],
  don: ["............", "...rrrrrr...", "..rrwrrwrrr.", "kkkkkkkkkkkk", ".kbbbbbbbbk.", ".kbwbbwbbwk.", "..kbbbbbbk..", "...kkkkkk...", "....kkkk...."],
  bun: ["............", "....oooo....", "...oyyyyo...", "..oyyyyyyo..", "..oyynnyyo..", "..oyyyyyyo..", "...oooooo...", "kkkkkkkkkkkk", ".kwwwwwwwwk."],
  castle: [".....kk.....", "....kkkk....", "...kwwwwk...", "..kkkkkkkk..", ".kwwwkkwwwk.", "kkkkkkkkkkkk", ".kwwwwwwwwk.", ".kwkwwwwkwk.", "kmmmmmmmmmmk", "mmmmmmmmmmmm"],
  onsen: ["..s..s..s...", ".s..s..s....", "..s..s..s...", ".s..s..s....", "............", "kkkkkkkkkkkk", "kbbbbbbbbbbk", "kbcbbbbcbbbk", "kbbbbbbbbbbk", "kkkkkkkkkkkk"],
  mountain: ["...s.s......", "....s.......", ".....kk.....", "....kook....", "...kooook...", "..kggooggk..", ".kggggggggk.", "kggggggggggk", "gggggggggggg"],
  waterfall: ["ggggbbbbgggg", "gggobcbbbogg", "ggoobbbcboog", "gooobcbbbooo", "ooobbcbbbooo", "oo.bbbbcb.oo", "...bcbbbb...", ".ssbbbbbbss.", "bbbbbbbbbbbb", "bcbbbcbbbcbb"],
  garden: ["...gggg.....", "..gggggg....", ".gggggggg...", "..gggggg....", "....oo......", "....oo......", "gggggggggggg", "ggbbbbbbbggg", "gbbcbbbbbbgg", "ggbbbbbbbggg"],
  bag: ["....kkkk....", "...k....k...", "...k....k...", ".kkkkkkkkkk.", ".krrrrrrrrk.", ".krrwwwwrrk.", ".krrwrrwrrk.", ".krrwwwwrrk.", ".krrrrrrrrk.", ".kkkkkkkkkk."],
  plane: ["............", "kk..........", "kwk.........", "kwwkkkkkkkk.", "kwwwwwbwbwwk", ".kkkwwwwwkk.", "....kwwk....", ".....kk.....", "............"],
  car: ["............", "............", "...kkkkk....", "..kbbkbbk...", ".kkkkkkkkkk.", "krrrrrrrrrrk", "krrwrrrrrwrk", "kkkkkkkkkkkk", "..kk....kk.."],
  bed: ["............", "............", "k...........", "k.ww........", "kkwwrrrrrrrk", "kkkkkkkkkkkk", "k..........k", "............"],
};

export const ART_NAMES: Record<string, string> = {
  ramen: "라멘",
  don: "덮밥",
  bun: "간식",
  castle: "성",
  onsen: "온천",
  mountain: "산",
  waterfall: "폭포",
  garden: "정원",
  bag: "쇼핑",
  plane: "비행기",
  car: "자동차",
  bed: "숙소",
};

export const CAT_ART: Record<Cat, string> = {
  food: "don",
  sight: "mountain",
  onsen: "onsen",
  shop: "bag",
  move: "car",
  stay: "bed",
};

/** 같은 색이 이어지는 칸은 하나의 사각형으로 합쳐요. */
export function spriteRects(rows: string[], a: string) {
  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < row.length && row[x + n] === ch) n++;
      rects.push({ x, y, w: n, fill: ch === "a" ? a : PIX[ch] });
      x += n;
    }
  });
  return { rects, w: rows[0].length, h: rows.length };
}
