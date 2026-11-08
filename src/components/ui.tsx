"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import type { Cat, Player } from "@/lib/types";
import { CAT_COLOR, CATS, colorHex } from "@/lib/constants";
import { ART, AVATARS, CAT_ART, spriteRects } from "@/lib/pixel";
import { nowParts } from "@/lib/time";

/* ---------- 가족 목록 ---------- */
const PlayersCtx = createContext<Record<string, Player>>({});
export function PlayersProvider({ players, children }: { players: Player[]; children: React.ReactNode }) {
  return <PlayersCtx value={Object.fromEntries(players.map((p) => [p.id, p]))}>{children}</PlayersCtx>;
}
export const usePlayerMap = () => useContext(PlayersCtx);

/* ---------- 실시간 시계 (1초마다) ---------- */
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};
const snapshot = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => 0;
export function useNow() {
  const s = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return s ? nowParts(s * 1000) : null;
}

/* ---------- 픽셀 그림 ---------- */
export function Sprite({ rows, a = "#E8344F" }: { rows: string[]; a?: string }) {
  const { rects, w, h } = spriteRects(rows, a);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1.03} fill={r.fill} />
      ))}
    </svg>
  );
}

export function Avatar({ p, size = "s" }: { p?: Pick<Player, "avatar" | "color"> | null; size?: "s" | "m" | "l" }) {
  if (!p) return <span className={`av ${size}`} style={{ "--pc": "#9AA0B5" } as React.CSSProperties} />;
  const hex = colorHex(p.color);
  return (
    <span className={`av ${size}`} style={{ "--pc": hex } as React.CSSProperties}>
      <Sprite rows={(AVATARS[p.avatar] ?? AVATARS.bear).rows} a={hex} />
    </span>
  );
}

export function PlayerTag({ id }: { id: string }) {
  const map = usePlayerMap();
  if (id === "all")
    return (
      <span className="pl">
        <span className="av s all" style={{ "--pc": "#9AA0B5" } as React.CSSProperties}>ALL</span>다 같이
      </span>
    );
  const p = map[id];
  return (
    <span className="pl">
      <Avatar p={p} />
      {p ? p.name : "알 수 없음"}
    </span>
  );
}

export function Byline({ o }: { o: { createdBy?: string; updatedBy?: string } }) {
  if (!o.createdBy) return null;
  const same = !o.updatedBy || o.updatedBy === o.createdBy;
  return (
    <span className="byline">
      <PlayerTag id={o.createdBy} /> 만듦
      {!same && o.updatedBy && (
        <>
          {" · "}
          <PlayerTag id={o.updatedBy} /> 수정
        </>
      )}
    </span>
  );
}

export function Chip({ cat }: { cat: Cat }) {
  return (
    <span className="chip" style={{ "--c": CAT_COLOR[cat] } as React.CSSProperties}>
      {CATS[cat]}
    </span>
  );
}

export function Seg({ ratio, color }: { ratio: number; color?: string }) {
  const r = Math.max(0, Math.min(1, ratio || 0));
  const on = Math.round(r * 20);
  return (
    <div className="seg" style={{ "--sc": color ?? "var(--coin)" } as React.CSSProperties} role="img" aria-label={`${Math.round(r * 100)}%`}>
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={i < on ? "on" : ""} />
      ))}
    </div>
  );
}

/** 사진 링크가 있으면 사진, 없거나 깨지면 픽셀 그림 */
export function Thumb({ img, art, cat, size }: { img?: string; art?: string; cat: Cat; size: "sm" | "lg" | "sheet-img" }) {
  const [broken, setBroken] = useState<string | null>(null);
  const showImg = !!img && /^https?:\/\//i.test(img) && broken !== img;
  return (
    <div className={`thumb ${size}`} style={{ "--c": CAT_COLOR[cat] } as React.CSSProperties}>
      <Sprite rows={ART[art || ""] ?? ART[CAT_ART[cat]]} />
      {showImg && (
        // 외부 사진 주소를 그대로 보여줘요 (저장하지 않음)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(img)} />
      )}
    </div>
  );
}

export const mapSearchUrl = (q: string) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

/** 구글 지도: 링크가 있으면 바로 이동, 검색어가 있으면 검색 */
export function MapButtons({ link, query, full }: { link?: string; query?: string; full?: boolean }) {
  const hasLink = !!link && /^https?:\/\//i.test(link);
  const hasQuery = !!query?.trim();
  if (!hasLink && !hasQuery)
    return (
      <span className={`btn small ghost ${full ? "full" : ""}`} aria-disabled="true">
        지도 정보 없음
      </span>
    );
  return (
    <div className={`maps ${full ? "full" : ""}`}>
      {hasLink && (
        <a className="btn small" href={link} target="_blank" rel="noopener noreferrer">
          지도 열기
        </a>
      )}
      {hasQuery && (
        <a className={`btn small ${hasLink ? "ghost" : ""}`} href={mapSearchUrl(query!)} target="_blank" rel="noopener noreferrer">
          {hasLink ? "검색으로 보기" : "지도에서 검색"}
        </a>
      )}
    </div>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  quest: (<><rect x="2" y="3" width="12" height="2" /><rect x="2" y="5" width="2" height="9" /><rect x="12" y="5" width="2" height="9" /><rect x="2" y="12" width="12" height="2" /><rect x="5" y="1" width="2" height="3" /><rect x="9" y="1" width="2" height="3" /><rect x="5" y="7" width="2" height="2" /><rect x="9" y="7" width="2" height="2" /></>),
  place: (<><rect x="5" y="1" width="6" height="2" /><rect x="3" y="3" width="10" height="2" /><rect x="3" y="5" width="3" height="3" /><rect x="10" y="5" width="3" height="3" /><rect x="3" y="8" width="10" height="2" /><rect x="5" y="10" width="6" height="2" /><rect x="7" y="12" width="2" height="3" /></>),
  item: (<><rect x="5" y="1" width="6" height="2" /><rect x="5" y="3" width="2" height="2" /><rect x="9" y="3" width="2" height="2" /><rect x="2" y="5" width="12" height="9" /></>),
  coin: (<><rect x="5" y="1" width="6" height="2" /><rect x="3" y="3" width="10" height="10" /><rect x="5" y="13" width="6" height="2" /><rect x="1" y="5" width="2" height="6" /><rect x="13" y="5" width="2" height="6" /></>),
  info: (<><rect x="7" y="2" width="2" height="2" /><rect x="5" y="6" width="4" height="2" /><rect x="7" y="8" width="2" height="4" /><rect x="5" y="12" width="6" height="2" /></>),
  check: (<><rect x="2" y="8" width="2" height="2" /><rect x="4" y="10" width="2" height="2" /><rect x="6" y="12" width="2" height="2" /><rect x="8" y="10" width="2" height="2" /><rect x="10" y="8" width="2" height="2" /><rect x="12" y="6" width="2" height="2" /><rect x="14" y="4" width="2" height="2" /></>),
};
export function Icon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function Clock() {
  const now = useNow();
  return (
    <div className="clock">
      <b>{now ? now.hms : "--:--:--"}</b>
      <span>한국·일본 시간</span>
    </div>
  );
}
