"use client";

import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import type { ActionResult, Booking, Cat, Expense, Item, Place, PlaceStatus, Player, Quest, Trip } from "@/lib/types";
import {
  BOOKING_KIND_NAMES, BOOKING_KINDS, CATS, colorHex, EMERGENCY, GROUPS, PLACE_CATS, STATUS,
} from "@/lib/constants";
import { ART_NAMES } from "@/lib/pixel";
import {
  currentQuest, dday, duration, fmtRange, mins, nightsLabel, sortQuests, tripDays, type Day, type NowParts,
} from "@/lib/time";
import {
  deleteEntity, deleteTrip, saveDay, saveEntity, setItemGot, setPlaceStatus, setQuestDone, setWish, updateTrip,
  type EntityKind,
} from "@/actions/trips";
import { Avatar, Byline, Chip, Icon, MapButtons, PlayerTag, PlayersProvider, Seg, Thumb, useNow, usePlayerMap } from "./ui";
import { DeleteButton, Field, formObj, Sheet, ToastProvider, useSave, useToast } from "./sheet";
import { Topbar } from "./screens";

type Tab = "quest" | "place" | "item" | "coin" | "info";
type SheetState =
  | { kind: EntityKind; id?: string }
  | { kind: "questView"; id: string }
  | { kind: "wish"; id: string }
  | { kind: "day"; date: string }
  | { kind: "trip" };

const OUT = "etc"; // 여행 날짜 밖에 있는 일정 모음

export function TripApp(props: { trip: Trip; players: Player[]; me: Player }) {
  return (
    <ToastProvider>
      <PlayersProvider players={props.players}>
        <TripInner {...props} />
      </PlayersProvider>
    </ToastProvider>
  );
}

const yen = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}엔`;
const won = (n: number, rate: number) => `약 ${(Math.round((n * rate) / 100 / 100) * 100).toLocaleString("ko-KR")}원`;

function TripInner({ trip, players, me }: { trip: Trip; players: Player[]; me: Player }) {
  const router = useRouter();
  const toast = useToast();
  const now = useNow();
  const [, startTransition] = useTransition();
  const [view, patch] = useOptimistic(trip, (t: Trip, fn: (t: Trip) => Trip) => fn(t));
  const days = tripDays(view.start, view.end);
  const [tab, setTab] = useState<Tab>("quest");
  const [day, setDay] = useState<string>(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    return days.some((d) => d.date === today) ? today : (days[0]?.date ?? OUT);
  });
  const [filter, setFilter] = useState<"all" | Place["cat"]>("all");
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [justCleared, setJustCleared] = useState<string | null>(null);

  /* 다른 가족이 고친 내용을 15초마다 확인해서 반영 */
  const versionRef = useRef(trip.version);
  useEffect(() => { versionRef.current = trip.version; }, [trip.version]);
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/trips/${trip.id}/version`, { cache: "no-store" });
        if (r.status === 401) return router.replace("/login");
        if (r.ok) {
          const { version } = await r.json();
          if (version !== versionRef.current) router.refresh();
        }
      } catch { /* 오프라인일 때는 다음에 다시 */ }
    };
    const t = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", tick); };
  }, [trip.id, router]);

  /** 바로 화면에 반영하고(낙관적 업데이트) 서버에 저장 */
  const quick = (fn: (t: Trip) => Trip, call: () => Promise<ActionResult>, ok?: string) =>
    startTransition(async () => {
      patch(fn);
      const r = await call();
      if (!r?.ok) toast(r?.error ?? "저장하지 못했어요.");
      else if (ok) toast(ok);
    });

  const toggleQuest = (q: Quest) => {
    const done = !q.done;
    if (done) setJustCleared(q.id);
    const sameDay = view.quests.filter((x) => x.date === q.date);
    const allDone = done && sameDay.every((x) => x.id === q.id || x.done);
    quick(
      (t) => ({ ...t, quests: t.quests.map((x) => (x.id === q.id ? { ...x, done, doneBy: done ? me.id : "", updatedBy: me.id } : x)) }),
      () => setQuestDone(trip.id, q.id, done),
      done ? (allDone ? "STAGE CLEAR! 오늘 일정 모두 완료" : `완료! ${q.title}`) : "완료를 취소했어요",
    );
  };

  const outQuests = view.quests.filter((q) => q.date < view.start || q.date > view.end);
  const allDays: Day[] = outQuests.length ? [...days, { date: OUT, label: "기타", dow: "", index: days.length }] : days;
  const curDay = allDays.find((d) => d.date === day) ?? allDays[0];
  const total = view.quests.length;
  const doneCount = view.quests.filter((q) => q.done).length;
  const close = () => setSheet(null);
  const placeOf = (q: Quest) => (q.placeId ? view.places.find((p) => p.id === q.placeId) : undefined);

  return (
    <main className="app">
      <Topbar back={{ href: "/", label: "목록" }} me={me} />
      <header className="hero gut">
        <div className="row between">
          <span className="px">World</span>
          <span className="badge">{now ? dday(view.start, view.end, now.date) : "…"}</span>
        </div>
        <h1>{view.title}</h1>
        <p className="meta num">{fmtRange(view.start, view.end)} · {nightsLabel(view.start, view.end)} · {players.length}명</p>
        <Seg ratio={total ? doneCount / total : 0} />
        <div className="row between">
          <p className="meta num">전체 진행도 · 완료 {doneCount} / {total}</p>
          <button className="edit" onClick={() => setSheet({ kind: "trip" })}>여행 정보 수정</button>
        </div>
      </header>

      <div className="app-body gut">
        <NowCard trip={view} now={now} placeOf={placeOf} onOpen={(id) => setSheet({ kind: "questView", id })} onToggle={toggleQuest} />

        {tab === "quest" && curDay && (
          <QuestTab trip={view} days={allDays} day={curDay} setDay={setDay} now={now} justCleared={justCleared}
            placeOf={placeOf} onToggle={toggleQuest} open={setSheet} />
        )}
        {tab === "place" && (
          <PlaceTab trip={view} me={me} filter={filter} setFilter={setFilter} open={setSheet}
            onStatus={(p) => {
              const keys = Object.keys(STATUS) as PlaceStatus[];
              const status = keys[(keys.indexOf(p.status) + 1) % keys.length];
              quick((t) => ({ ...t, places: t.places.map((x) => (x.id === p.id ? { ...x, status, updatedBy: me.id } : x)) }),
                () => setPlaceStatus(trip.id, p.id, status), `${p.name} → ${STATUS[status]}`);
            }} />
        )}
        {tab === "item" && (
          <ItemTab trip={view} open={setSheet}
            onToggle={(i) => quick((t) => ({ ...t, items: t.items.map((x) => (x.id === i.id ? { ...x, got: !i.got, updatedBy: me.id } : x)) }),
              () => setItemGot(trip.id, i.id, !i.got))} />
        )}
        {tab === "coin" && <CoinTab trip={view} players={players} days={days} open={setSheet} />}
        {tab === "info" && <InfoTab trip={view} open={setSheet} />}
      </div>

      <nav className="nav" aria-label="여행 메뉴">
        {([["quest", "일정"], ["place", "장소"], ["item", "준비물"], ["coin", "경비"], ["info", "정보"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} aria-current={tab === k} onClick={() => { setTab(k); window.scrollTo({ top: 0 }); }}>
            <Icon name={k} />{l}
          </button>
        ))}
      </nav>

      {sheet && (
        <SheetRouter sheet={sheet} trip={view} me={me} players={players} days={days}
          defaultDate={curDay && curDay.date !== OUT ? curDay.date : view.start}
          placeOf={placeOf} close={close} open={setSheet} />
      )}
    </main>
  );
}

/* ================= 지금 할 일 ================= */
function NowCard({ trip, now, placeOf, onOpen, onToggle }: {
  trip: Trip; now: NowParts | null; placeOf: (q: Quest) => Place | undefined; onOpen: (id: string) => void; onToggle: (q: Quest) => void;
}) {
  if (!now) return <section className="card now" aria-label="지금 할 일"><p className="hint">시간을 불러오는 중...</p></section>;
  const { index, cur, next } = currentQuest(trip.quests, trip.start, trip.end, now);
  const first = sortQuests(trip.quests.filter((q) => q.date === trip.start))[0];
  let body: React.ReactNode;
  if (index < 0) {
    body = (<>
      <div className="now-head"><span className="now-tag">Ready</span><span className="hint">여행 전</span></div>
      <h3 className="h3" style={{ fontSize: 22 }}>출발까지 {-index}일 남았어요</h3>
      {first && <p className="muted">첫 일정 · {trip.start.slice(5).replace("-", ".")} {first.time} {first.title}</p>}
    </>);
  } else if (index > tripDays(trip.start, trip.end).length - 1) {
    body = (<>
      <div className="now-head"><span className="now-tag">All clear</span></div>
      <h3 className="h3" style={{ fontSize: 22 }}>여행 끝! 모두 수고했어요</h3>
    </>);
  } else {
    const p = cur ? placeOf(cur) : undefined;
    body = (<>
      <div className="now-head"><span className="now-tag">Now</span><span className="hint num">STAGE {index + 1} · {now.hm}</span></div>
      {cur ? (<>
        <button className="now-main" onClick={() => onOpen(cur.id)}>
          <Thumb img={p?.imageUrl} art={cur.art || p?.art} cat={cur.cat} size="sm" />
          <span style={{ minWidth: 0 }}>
            <span className="q-meta"><span className="q-time">{cur.time}~</span><Chip cat={cur.cat} /></span>
            <h3>{cur.title}</h3>
            {cur.memo && <span className="q-memo">{cur.memo}</span>}
          </span>
        </button>
        <div className="actions">
          <MapButtons link={cur.mapLink || p?.mapLink} query={cur.mapQuery || p?.mapQuery || p?.name} />
          <button className="clear-btn" aria-pressed={cur.done} onClick={() => onToggle(cur)}>{cur.done ? "완료!" : "CLEAR"}</button>
        </div>
      </>) : (
        <h3 className="h3" style={{ fontSize: 22 }}>아직 오늘 첫 일정 전이에요</h3>
      )}
      {next ? (
        <div className="now-next">
          <span className="hint">다음</span><b className="num">{next.time}</b>
          <span style={{ flex: 1, minWidth: 0 }}>{next.title}</span>
          <span className="hint num">{duration(mins(next.time) - mins(now.hm))} 후</span>
        </div>
      ) : (
        <div className="now-next"><span className="hint">오늘 남은 일정이 없어요. 푹 쉬어요!</span></div>
      )}
    </>);
  }
  return <section className="card now" aria-label="지금 할 일">{body}</section>;
}

/* ================= 일정 ================= */
function QuestTab({ trip, days, day, setDay, now, justCleared, placeOf, onToggle, open }: {
  trip: Trip; days: Day[]; day: Day; setDay: (d: string) => void; now: NowParts | null; justCleared: string | null;
  placeOf: (q: Quest) => Place | undefined; onToggle: (q: Quest) => void; open: (s: SheetState) => void;
}) {
  const isOut = day.date === OUT;
  const list = sortQuests(trip.quests.filter((q) => (isOut ? q.date < trip.start || q.date > trip.end : q.date === day.date)));
  const done = list.filter((q) => q.done).length;
  const cq = now ? currentQuest(trip.quests, trip.start, trip.end, now) : null;
  const nowId = cq?.cur && cq.cur.date === day.date ? cq.cur.id : null;
  const meta = trip.dayMeta?.[day.date];
  const realDays = days.filter((d) => d.date !== OUT).length;
  return (<>
    <div className="sec-head"><div><p className="px">Quest log</p><h2>날짜별 일정</h2></div></div>
    <div className="stages" role="tablist">
      {days.map((d) => {
        const qs = trip.quests.filter((q) => q.date === d.date);
        const cleared = qs.length > 0 && qs.every((q) => q.done);
        const label = d.date === OUT ? "Etc" : d.index === realDays - 1 && realDays > 1 ? "Final" : `Stage ${d.index + 1}`;
        return (
          <button key={d.date} role="tab" aria-current={d.date === day.date}
            className={`stage-tab ${cleared ? "cleared" : ""} ${now?.date === d.date ? "today" : ""}`} onClick={() => setDay(d.date)}>
            <span className="px">{label}</span>
            <span className="disp num">{d.label} {d.dow}</span>
          </button>
        );
      })}
    </div>
    <section className="card stage-head">
      <div className="row between">
        <p className="px muted">{isOut ? "Etc" : `Stage ${day.index + 1}`}{now?.date === day.date ? " · 오늘" : ""}</p>
        {!isOut && <button className="linkbtn" onClick={() => open({ kind: "day", date: day.date })}>이 날 정보 수정</button>}
      </div>
      <h2>{isOut ? "여행 날짜 밖 일정" : meta?.title || "자유 일정"}</h2>
      {isOut && <p className="hint">여행 날짜를 바꿔서 범위 밖으로 나간 일정이에요. 눌러서 날짜를 다시 골라 주세요.</p>}
      {(meta?.area || meta?.weather) && <p className="muted">{[meta.area, meta.weather].filter(Boolean).join(" · ")}</p>}
      <div><Seg ratio={list.length ? done / list.length : 0} color="var(--ok)" /></div>
      <p className="hint num">이 날 완료 {done} / {list.length}</p>
      {list.length > 0 && done === list.length && <p className="banner">STAGE CLEAR!</p>}
    </section>
    <div className="quests">
      {list.length ? list.map((q) => {
        const p = placeOf(q);
        return (
          <article key={q.id} className={`card quest ${q.done ? "done" : ""} ${q.id === nowId ? "is-now" : ""}`}>
            <div className="q-top">
              <Thumb img={p?.imageUrl} art={q.art || p?.art} cat={q.cat} size="sm" />
              <button className="q-main" onClick={() => open({ kind: "questView", id: q.id })}>
                <span className="q-meta">
                  <span className="q-time">{q.time}</span><Chip cat={q.cat} />
                  {q.id === nowId && <span className="nowtag">NOW</span>}
                </span>
                <span className="q-title">{q.title}</span>
                {q.memo && <span className="q-memo">{q.memo}</span>}
              </button>
            </div>
            <div className="q-foot">
              <Byline o={q} />
              <button className="clear-btn" aria-pressed={q.done} aria-label={`${q.title} ${q.done ? "완료 취소" : "완료하기"}`} onClick={() => onToggle(q)}>
                {q.done ? "완료!" : "CLEAR"}
              </button>
            </div>
            {q.done && <span className={`stamp ${justCleared === q.id ? "pop" : ""}`} aria-hidden="true">완료!</span>}
          </article>
        );
      }) : <div className="card empty"><p className="h3">아직 일정이 없어요</p><p className="hint">아래 버튼으로 이 날 첫 일정을 추가해 보세요.</p></div>}
    </div>
    <button className="btn dashed" onClick={() => open({ kind: "quest" })}>+ 일정 추가</button>
  </>);
}

/* ================= 장소 ================= */
function PlaceTab({ trip, me, filter, setFilter, open, onStatus }: {
  trip: Trip; me: Player; filter: "all" | Place["cat"]; setFilter: (f: "all" | Place["cat"]) => void;
  open: (s: SheetState) => void; onStatus: (p: Place) => void;
}) {
  const map = usePlayerMap();
  const list = trip.places.filter((p) => filter === "all" || p.cat === filter);
  return (<>
    <div className="sec-head">
      <div><p className="px">World map</p><h2>장소 · 맛집</h2></div>
      <span className="hint num">{trip.places.filter((p) => p.status === "visited").length}/{trip.places.length} 다녀옴</span>
    </div>
    <div className="filters">
      {([["all", "전체"], ...PLACE_CATS.map((c) => [c, CATS[c]])] as [typeof filter, string][]).map(([k, l]) => (
        <button key={k} className="fchip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
      ))}
    </div>
    {list.map((p) => {
      const mine = p.wishes?.find((w) => w.by === me.id);
      return (
        <article className="card place" key={p.id}>
          <Thumb img={p.imageUrl} art={p.art} cat={p.cat} size="lg" />
          <div className="place-body">
            <div className="row between">
              <Chip cat={p.cat} />
              <button className={`status ${p.status}`} onClick={() => onStatus(p)} aria-label={`상태 바꾸기, 지금 ${STATUS[p.status]}`}>{STATUS[p.status]} ↻</button>
            </div>
            <div><h3>{p.name}</h3>{p.area && <p className="hint">{p.area}</p>}</div>
            {p.note && <p className="q-memo">{p.note}</p>}
            {p.wishes?.length > 0 && (
              <div className="wishes">
                <p className="hint" style={{ fontWeight: 700 }}>가고 싶은 사람 · 하고 싶은 것</p>
                {p.wishes.map((w) => (
                  <div className="wish" key={w.by}>
                    <Avatar p={map[w.by]} size="m" />
                    <p><b>{map[w.by]?.name ?? "알 수 없음"}</b>{w.text}</p>
                  </div>
                ))}
              </div>
            )}
            <MapButtons link={p.mapLink} query={p.mapQuery} />
            <button className="btn small coin" onClick={() => open({ kind: "wish", id: p.id })}>{mine ? "내 '하고 싶은 것' 수정" : "나도 가고 싶어요"}</button>
            <div className="row between"><Byline o={p} /><button className="linkbtn" onClick={() => open({ kind: "place", id: p.id })}>수정</button></div>
          </div>
        </article>
      );
    })}
    {list.length === 0 && <div className="card empty"><p className="h3">아직 장소가 없어요</p><p className="hint">가고 싶은 곳을 추가하고, 가족들이 ‘나도 가고 싶어요’를 누를 수 있어요.</p></div>}
    <button className="btn dashed" onClick={() => open({ kind: "place" })}>+ 장소 추가</button>
  </>);
}

/* ================= 준비물 ================= */
function ItemTab({ trip, open, onToggle }: { trip: Trip; open: (s: SheetState) => void; onToggle: (i: Item) => void }) {
  const got = trip.items.filter((i) => i.got).length;
  return (<>
    <div className="sec-head"><div><p className="px">Item bag</p><h2>준비물</h2></div><span className="hint num">{got}/{trip.items.length} 획득</span></div>
    <Seg ratio={trip.items.length ? got / trip.items.length : 0} />
    {GROUPS.map((g) => {
      const its = trip.items.filter((i) => i.group === g);
      if (!its.length) return null;
      return (
        <section className="card" key={g}>
          <h3 className="h3" style={{ marginBottom: 4 }}>{g}</h3>
          {its.map((i) => (
            <div className={`item ${i.got ? "got" : ""}`} key={i.id}>
              <button className="check" aria-pressed={i.got} aria-label={`${i.text} 챙김`} onClick={() => onToggle(i)}>{i.got && <Icon name="check" />}</button>
              <div className="item-text">
                <b>{i.text}</b>
                <span className="row"><span className="hint">담당</span><PlayerTag id={i.owner} /></span>
              </div>
              <button className="linkbtn" onClick={() => open({ kind: "item", id: i.id })}>수정</button>
            </div>
          ))}
        </section>
      );
    })}
    {trip.items.length === 0 && <div className="card empty"><p className="h3">준비물이 비어 있어요</p><p className="hint">여권, 엔화, 충전기처럼 챙길 것을 추가해 보세요.</p></div>}
    <button className="btn dashed" onClick={() => open({ kind: "item" })}>+ 준비물 추가</button>
  </>);
}

/* ================= 경비 ================= */
function settle(expenses: Expense[], players: Player[]) {
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const share = players.length ? total / players.length : 0;
  const paid = (id: string) => expenses.filter((e) => e.paidBy === id).reduce((a, e) => a + e.amount, 0);
  const bal = players.map((p) => ({ id: p.id, v: paid(p.id) - share }));
  const cred = bal.filter((b) => b.v > 0.5).sort((a, b) => b.v - a.v);
  const debt = bal.filter((b) => b.v < -0.5).sort((a, b) => a.v - b.v);
  const out: { from: string; to: string; amt: number }[] = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const x = Math.min(-debt[i].v, cred[j].v);
    out.push({ from: debt[i].id, to: cred[j].id, amt: Math.round(x / 10) * 10 });
    debt[i].v += x; cred[j].v -= x;
    if (-debt[i].v < 0.5) i++;
    if (cred[j].v < 0.5) j++;
  }
  return { total, share, paid, out };
}

function CoinTab({ trip, players, days, open }: { trip: Trip; players: Player[]; days: Day[]; open: (s: SheetState) => void }) {
  const { total, share, paid, out } = settle(trip.expenses, players);
  const left = trip.budget - total;
  const ratio = trip.budget ? left / trip.budget : 0;
  const hp = ratio > 0.5 ? "var(--ok)" : ratio > 0.2 ? "var(--coin)" : "var(--accent)";
  const maxPaid = Math.max(1, ...players.map((p) => paid(p.id)));
  const groups = [...days.map((d) => ({ key: d.date, label: `${d.label} (${d.dow})` })), { key: OUT, label: "기타 날짜" }];
  return (<>
    <div className="sec-head"><div><p className="px">Coin</p><h2>경비</h2></div></div>
    <section className="card stack">
      <p className="muted">지금까지 쓴 돈</p>
      <p className="big num">{yen(total)}</p>
      <p className="hint num">{won(total, trip.rate)} · 100엔 = {trip.rate.toLocaleString("ko-KR")}원 기준</p>
      {trip.budget > 0 && (<>
        <div className="row between"><span className="h3" style={{ fontSize: 16 }}>남은 예산 HP</span><span className="num muted">{yen(Math.max(0, left))} / {yen(trip.budget)}</span></div>
        <Seg ratio={ratio} color={hp} />
        {left < 0 && <p className="err">예산보다 {yen(-left)} 더 썼어요.</p>}
      </>)}
    </section>
    <section className="card stack">
      <h3 className="h3">누가 얼마 냈나</h3>
      {players.map((p) => (
        <div className="prow" key={p.id} style={{ "--pc": colorHex(p.color) } as React.CSSProperties}>
          <PlayerTag id={p.id} />
          <div className="mini"><span style={{ width: `${(paid(p.id) / maxPaid) * 100}%` }} /></div>
          <span className="num">{yen(paid(p.id))}</span>
        </div>
      ))}
    </section>
    <section className="card">
      <h3 className="h3">정산하기</h3>
      <p className="hint num" style={{ marginBottom: 6 }}>{players.length}명이 똑같이 나누면 1인당 {yen(share)}</p>
      {out.length ? out.map((o, i) => (
        <div className="settle" key={i}>
          <PlayerTag id={o.from} /><span aria-hidden="true">→</span><span className="sr">이(가) 보낼 사람</span><PlayerTag id={o.to} />
          <span className="amt num">{yen(o.amt)}</span>
        </div>
      )) : <p className="hint">정산할 금액이 없어요.</p>}
    </section>
    <section className="card">
      <h3 className="h3">쓴 내역</h3>
      {trip.expenses.length === 0 && <p className="hint">아직 쓴 돈이 없어요.</p>}
      {groups.map((g) => {
        const es = trip.expenses.filter((e) => (g.key === OUT ? e.date < trip.start || e.date > trip.end : e.date === g.key));
        if (!es.length) return null;
        return (
          <div key={g.key}>
            <p className="day-label num">{g.label}</p>
            {es.map((e) => (
              <button className="exp" key={e.id} onClick={() => open({ kind: "expense", id: e.id })}>
                <b>{e.title}</b><span className="amt num">{yen(e.amount)}</span>
                <span className="row"><span className="hint">결제</span><PlayerTag id={e.paidBy} /></span>
                <span className="sub num">{won(e.amount, trip.rate)}</span>
              </button>
            ))}
          </div>
        );
      })}
    </section>
    <button className="btn dashed" onClick={() => open({ kind: "expense" })}>+ 경비 추가</button>
  </>);
}

/* ================= 정보 ================= */
function CopyButton({ text }: { text: string }) {
  const toast = useToast();
  return (
    <button className="btn small" onClick={() => {
      try {
        navigator.clipboard.writeText(text).then(() => toast(`복사했어요: ${text}`), () => toast(`${text} (길게 눌러 복사하세요)`));
      } catch { toast(`${text} (길게 눌러 복사하세요)`); }
    }}>복사</button>
  );
}

function InfoTab({ trip, open }: { trip: Trip; open: (s: SheetState) => void }) {
  return (<>
    <div className="sec-head"><div><p className="px">Info</p><h2>예약 · 연락처</h2></div></div>
    {trip.bookings.map((b) => (
      <section className="card" key={b.id}>
        <div className="row between"><p className="px muted">{b.kind}</p><button className="linkbtn" onClick={() => open({ kind: "booking", id: b.id })}>수정</button></div>
        <h3 className="h3">{b.title}</h3>
        {b.detail && <p className="book-detail">{b.detail}</p>}
        {b.code && <div className="code"><span><span className="hint">예약번호</span><br /><b>{b.code}</b></span><CopyButton text={b.code} /></div>}
        <div style={{ marginTop: 10 }}><Byline o={b} /></div>
      </section>
    ))}
    {trip.bookings.length === 0 && <div className="card empty"><p className="h3">예약 정보가 없어요</p><p className="hint">항공권, 숙소, 렌터카 예약번호를 모아 두세요.</p></div>}
    <button className="btn dashed" onClick={() => open({ kind: "booking" })}>+ 예약 정보 추가</button>
    <section className="card">
      <p className="px muted">Emergency</p>
      <h3 className="h3">일본 비상 연락처</h3>
      <p className="hint">구마모토·후쿠오카 등 규슈는 주후쿠오카 총영사관 담당이에요.</p>
      {EMERGENCY.map(([k, v]) => (
        <div className="contact" key={k}><span><span className="hint">{k}</span><br /><b className="num">{v}</b></span><CopyButton text={v} /></div>
      ))}
    </section>
  </>);
}

/* ================= 시트 ================= */
function SheetRouter({ sheet, trip, me, players, days, defaultDate, placeOf, close, open }: {
  sheet: SheetState; trip: Trip; me: Player; players: Player[]; days: Day[]; defaultDate: string;
  placeOf: (q: Quest) => Place | undefined; close: () => void; open: (s: SheetState) => void;
}) {
  switch (sheet.kind) {
    case "questView": {
      const q = trip.quests.find((x) => x.id === sheet.id);
      return q ? <QuestView q={q} place={placeOf(q)} trip={trip} close={close} open={open} /> : null;
    }
    case "wish": {
      const p = trip.places.find((x) => x.id === sheet.id);
      return p ? <WishSheet place={p} trip={trip} me={me} close={close} /> : null;
    }
    case "day": return <DaySheet trip={trip} date={sheet.date} days={days} close={close} />;
    case "trip": return <TripSheet trip={trip} me={me} close={close} />;
    default: return <EntitySheet kind={sheet.kind} id={sheet.id} trip={trip} players={players} days={days} defaultDate={defaultDate} close={close} />;
  }
}

function QuestView({ q, place, trip, close, open }: { q: Quest; place?: Place; trip: Trip; close: () => void; open: (s: SheetState) => void }) {
  const map = usePlayerMap();
  const d = tripDays(trip.start, trip.end).find((x) => x.date === q.date);
  return (
    <Sheet eyebrow={d ? `Stage ${d.index + 1} · ${d.label} ${d.dow}` : q.date} title={q.title} onClose={close}
      foot={<>
        <MapButtons link={q.mapLink || place?.mapLink} query={q.mapQuery || place?.mapQuery || place?.name} full />
        <button type="button" className="btn ghost" onClick={close}>닫기</button>
        <button type="button" className="btn coin" onClick={() => open({ kind: "quest", id: q.id })}>수정하기</button>
      </>}>
      <Thumb img={place?.imageUrl} art={q.art || place?.art} cat={q.cat} size="sheet-img" />
      <div className="row"><span className="q-time">{q.time}</span><Chip cat={q.cat} />{q.done && <span className="role" style={{ "--pc": "var(--ok)" } as React.CSSProperties}>완료!</span>}</div>
      {q.memo && <p className="q-memo" style={{ color: "var(--ink)" }}>{q.memo}</p>}
      {q.done && q.doneBy && <p className="hint row"><PlayerTag id={q.doneBy} /> 님이 완료했어요</p>}
      {place && (
        <div className="wishes">
          <p className="hint" style={{ fontWeight: 700 }}>{place.name} · 하고 싶은 것</p>
          {place.wishes?.length ? place.wishes.map((w) => (
            <div className="wish" key={w.by}><Avatar p={map[w.by]} size="m" /><p><b>{map[w.by]?.name ?? "알 수 없음"}</b>{w.text}</p></div>
          )) : <p className="hint">아직 없어요. 장소 탭에서 ‘나도 가고 싶어요’를 눌러 보세요.</p>}
        </div>
      )}
      <Byline o={q} />
    </Sheet>
  );
}

function WishSheet({ place, trip, me, close }: { place: Place; trip: Trip; me: Player; close: () => void }) {
  const mine = place.wishes?.find((w) => w.by === me.id);
  const { pending, error, save } = useSave(close, "저장했어요");
  return (
    <Sheet eyebrow="Wish" title={mine ? "내 '하고 싶은 것' 수정" : "나도 가고 싶어요"} onClose={close}
      onSubmit={(f) => {
        const text = formObj(f).text ?? "";
        if (!text.trim()) return;
        save(() => setWish(trip.id, place.id, text));
      }}
      foot={<>
        <button type="button" className="btn ghost" onClick={close}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>저장</button>
        {mine && <DeleteButton label="내 '하고 싶은 것' 지우기" disabled={pending} onConfirm={() => save(() => setWish(trip.id, place.id, ""), "지웠어요")} />}
      </>}>
      <div className="row"><Avatar p={me} size="m" /><p><b>{me.name}</b>님이 <b>{place.name}</b>에서</p></div>
      <Field label="하고 싶은 것" htmlFor="f-text">
        <input id="f-text" name="text" defaultValue={mine?.text ?? ""} placeholder="예: 가족사진 찍기" required maxLength={120} />
      </Field>
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}

function DaySheet({ trip, date, days, close }: { trip: Trip; date: string; days: Day[]; close: () => void }) {
  const d = days.find((x) => x.date === date);
  const meta = trip.dayMeta?.[date];
  const { pending, error, save } = useSave(close, "저장했어요");
  return (
    <Sheet eyebrow={d ? `Stage ${d.index + 1}` : "Stage"} title={`${d?.label ?? date} (${d?.dow ?? ""}) 정보`} onClose={close}
      onSubmit={(f) => save(() => saveDay(trip.id, date, formObj(f)))}
      foot={<>
        <button type="button" className="btn ghost" onClick={close}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>저장</button>
      </>}>
      <Field label="이 날 제목" htmlFor="f-title"><input id="f-title" name="title" defaultValue={meta?.title ?? ""} placeholder="예: 아소 대평원" maxLength={40} /></Field>
      <Field label="지역" htmlFor="f-area"><input id="f-area" name="area" defaultValue={meta?.area ?? ""} placeholder="예: 아소 · 구로카와" maxLength={60} /></Field>
      <Field label="날씨 · 메모" htmlFor="f-weather"><input id="f-weather" name="weather" defaultValue={meta?.weather ?? ""} placeholder="예: 흐림 1~10°C, 패딩 필수" maxLength={60} /></Field>
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}

function TripSheet({ trip, me, close }: { trip: Trip; me: Player; close: () => void }) {
  const { pending, error, save } = useSave(close, "저장했어요");
  return (
    <Sheet eyebrow="World setting" title="여행 정보 수정" onClose={close}
      onSubmit={(f) => save(() => updateTrip(trip.id, formObj(f)))}
      foot={<>
        <button type="button" className="btn ghost" onClick={close}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>저장</button>
        {me.admin && <DeleteButton label="이 여행 전체 삭제" disabled={pending} onConfirm={() => save(() => deleteTrip(trip.id), "삭제했어요")} />}
      </>}>
      <Field label="여행 이름" htmlFor="f-title"><input id="f-title" name="title" defaultValue={trip.title} required maxLength={60} /></Field>
      <div className="field"><div className="two">
        <Field label="출발일" htmlFor="f-start"><input id="f-start" name="start" type="date" defaultValue={trip.start} required /></Field>
        <Field label="도착일" htmlFor="f-end"><input id="f-end" name="end" type="date" defaultValue={trip.end} required /></Field>
      </div></div>
      <Field label="예산 (엔)" htmlFor="f-budget"><input id="f-budget" name="budget" type="number" inputMode="numeric" min={0} step={1000} defaultValue={trip.budget} /></Field>
      <Field label="환율 (100엔당 원)" htmlFor="f-rate"><input id="f-rate" name="rate" type="number" inputMode="numeric" min={1} defaultValue={trip.rate} /></Field>
      <Byline o={trip} />
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}

const NAMES: Record<EntityKind, string> = { quest: "일정", place: "장소", item: "준비물", expense: "경비", booking: "예약 정보" };
const MAP_HINT = "구글 지도 앱에서 장소 → 공유 → 링크 복사 후 붙여넣기";

function EntitySheet({ kind, id, trip, players, days, defaultDate, close }: {
  kind: EntityKind; id?: string; trip: Trip; players: Player[]; days: Day[]; defaultDate: string; close: () => void;
}) {
  const listKey = ({ quest: "quests", place: "places", item: "items", expense: "expenses", booking: "bookings" } as const)[kind];
  const o = id ? (trip[listKey] as { id: string; createdBy: string; updatedBy: string }[]).find((x) => x.id === id) : undefined;
  const { pending, error, save } = useSave(close, id ? "저장했어요" : "추가했어요");
  const dayOpts = days.map((d) => <option key={d.date} value={d.date}>{`STAGE ${d.index + 1} · ${d.label} (${d.dow})`}</option>);
  const playerOpts = players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>);

  let fields: React.ReactNode = null;
  if (kind === "quest") {
    const q = o as Quest | undefined;
    const outOfRange = q && (q.date < trip.start || q.date > trip.end);
    fields = (<>
      <Field label="날짜" htmlFor="f-date">
        <select id="f-date" name="date" defaultValue={outOfRange ? days[0]?.date : (q?.date ?? defaultDate)}>{dayOpts}</select>
      </Field>
      <Field label="시간" htmlFor="f-time"><input id="f-time" name="time" type="time" defaultValue={q?.time ?? "12:00"} required /></Field>
      <Field label="할 일" htmlFor="f-title"><input id="f-title" name="title" defaultValue={q?.title ?? ""} placeholder="예: 구마모토성 구경" required maxLength={80} /></Field>
      <Field label="종류" htmlFor="f-cat">
        <select id="f-cat" name="cat" defaultValue={q?.cat ?? "sight"}>{(Object.keys(CATS) as Cat[]).map((c) => <option key={c} value={c}>{CATS[c]}</option>)}</select>
      </Field>
      <Field label="장소 연결 (선택)" htmlFor="f-placeId" hint="장소를 연결하면 사진, 지도, 가족들의 '하고 싶은 것'이 같이 보여요.">
        <select id="f-placeId" name="placeId" defaultValue={q?.placeId ?? ""}>
          <option value="">연결 안 함</option>
          {trip.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="메모" htmlFor="f-memo"><textarea id="f-memo" name="memo" defaultValue={q?.memo ?? ""} placeholder="예: 계단 많음, 편한 신발" maxLength={500} /></Field>
      <MapFields link={q?.mapLink} query={q?.mapQuery} note="장소를 연결했다면 비워 둬도 돼요." />
    </>);
  }
  if (kind === "place") {
    const p = o as Place | undefined;
    fields = (<>
      <Field label="이름" htmlFor="f-name"><input id="f-name" name="name" defaultValue={p?.name ?? ""} placeholder="예: 고쿠테이 라멘" required maxLength={80} /></Field>
      <Field label="종류" htmlFor="f-cat">
        <select id="f-cat" name="cat" defaultValue={p?.cat ?? "food"}>{PLACE_CATS.map((c) => <option key={c} value={c}>{CATS[c]}</option>)}</select>
      </Field>
      <Field label="지역" htmlFor="f-area"><input id="f-area" name="area" defaultValue={p?.area ?? ""} placeholder="예: 구마모토 시내" maxLength={60} /></Field>
      <Field label="설명" htmlFor="f-note"><textarea id="f-note" name="note" defaultValue={p?.note ?? ""} placeholder="예: 웨이팅 30분, 현금만" maxLength={500} /></Field>
      <MapFields link={p?.mapLink} query={p?.mapQuery} />
      <Field label="사진 링크 (선택)" htmlFor="f-imageUrl" hint="인터넷 사진 주소(https://...)를 붙여넣으면 카드에 사진이 보여요. 비워 두면 그림이 나와요.">
        <input id="f-imageUrl" name="imageUrl" type="url" inputMode="url" defaultValue={p?.imageUrl ?? ""} placeholder="https://..." />
      </Field>
      <Field label="그림 (사진이 없을 때)" htmlFor="f-art">
        <select id="f-art" name="art" defaultValue={p?.art ?? ""}>
          <option value="">종류에 맞게 자동</option>
          {Object.entries(ART_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
      </Field>
      <Field label="상태" htmlFor="f-status">
        <select id="f-status" name="status" defaultValue={p?.status ?? "want"}>{(Object.keys(STATUS) as PlaceStatus[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}</select>
      </Field>
      {!p && <Field label="여기서 하고 싶은 것 (선택)" htmlFor="f-wish"><input id="f-wish" name="wish" placeholder="예: 라멘 곱빼기 먹기" maxLength={120} /></Field>}
    </>);
  }
  if (kind === "item") {
    const i = o as Item | undefined;
    fields = (<>
      <Field label="준비물" htmlFor="f-text"><input id="f-text" name="text" defaultValue={i?.text ?? ""} placeholder="예: 우산" required maxLength={100} /></Field>
      <Field label="분류" htmlFor="f-group"><select id="f-group" name="group" defaultValue={i?.group ?? "짐"}>{GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}</select></Field>
      <Field label="누가 챙기나요" htmlFor="f-owner"><select id="f-owner" name="owner" defaultValue={i?.owner ?? "all"}><option value="all">다 같이</option>{playerOpts}</select></Field>
    </>);
  }
  if (kind === "expense") {
    const e = o as Expense | undefined;
    fields = (<>
      <Field label="항목" htmlFor="f-title"><input id="f-title" name="title" defaultValue={e?.title ?? ""} placeholder="예: 점심 라멘" required maxLength={80} /></Field>
      <Field label="금액 (엔)" htmlFor="f-amount"><input id="f-amount" name="amount" type="number" inputMode="numeric" min={1} defaultValue={e?.amount ?? ""} placeholder="예: 4800" required /></Field>
      <Field label="낸 사람" htmlFor="f-paidBy"><select id="f-paidBy" name="paidBy" defaultValue={e?.paidBy ?? players[0]?.id}>{playerOpts}</select></Field>
      <Field label="날짜" htmlFor="f-date"><select id="f-date" name="date" defaultValue={e && e.date >= trip.start && e.date <= trip.end ? e.date : defaultDate}>{dayOpts}</select></Field>
    </>);
  }
  if (kind === "booking") {
    const b = o as Booking | undefined;
    fields = (<>
      <Field label="종류" htmlFor="f-kind"><select id="f-kind" name="kind" defaultValue={b?.kind ?? "Flight"}>{BOOKING_KINDS.map((k) => <option key={k} value={k}>{BOOKING_KIND_NAMES[k]}</option>)}</select></Field>
      <Field label="이름" htmlFor="f-title"><input id="f-title" name="title" defaultValue={b?.title ?? ""} placeholder="예: 가는 비행기" required maxLength={80} /></Field>
      <Field label="내용" htmlFor="f-detail" hint="날짜, 시간, 주소처럼 필요한 내용을 줄바꿈으로 적어 주세요.">
        <textarea id="f-detail" name="detail" defaultValue={b?.detail ?? ""} placeholder={"11.28 (토) 인천 08:40 → 구마모토 10:10\n4명"} maxLength={1000} rows={4} />
      </Field>
      <Field label="예약번호 (선택)" htmlFor="f-code"><input id="f-code" name="code" defaultValue={b?.code ?? ""} placeholder="예: ABC123" maxLength={60} autoCapitalize="characters" /></Field>
    </>);
  }

  return (
    <Sheet eyebrow={`${id ? "Edit" : "New"} · ${kind}`} title={`${NAMES[kind]} ${id ? "수정" : "추가"}`} onClose={close}
      onSubmit={(f) => save(() => saveEntity(trip.id, kind, id ?? null, formObj(f)))}
      foot={<>
        <button type="button" className="btn ghost" onClick={close}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>{pending ? "저장 중..." : id ? "저장" : "추가"}</button>
        {id && <DeleteButton label={`이 ${NAMES[kind]} 삭제`} disabled={pending} onConfirm={() => save(() => deleteEntity(trip.id, kind, id), "삭제했어요")} />}
      </>}>
      {o && <Byline o={o} />}
      {fields}
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}

function MapFields({ link, query, note }: { link?: string; query?: string; note?: string }) {
  return (<>
    <Field label="구글 지도 링크 (선택)" htmlFor="f-mapLink" hint={`${note ? note + " " : ""}${MAP_HINT}`}>
      <input id="f-mapLink" name="mapLink" type="url" inputMode="url" defaultValue={link ?? ""} placeholder="https://maps.app.goo.gl/..." />
    </Field>
    <Field label="지도 검색어 (선택)" htmlFor="f-mapQuery" hint="링크가 없어도 검색어로 지도를 열 수 있어요. 일본어 이름이면 더 정확해요.">
      <input id="f-mapQuery" name="mapQuery" defaultValue={query ?? ""} placeholder="예: 熊本城" maxLength={120} />
    </Field>
  </>);
}
