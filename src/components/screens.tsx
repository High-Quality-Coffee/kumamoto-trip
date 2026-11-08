"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Player, TripSummary } from "@/lib/types";
import { colorHex, DEFAULT_RATE } from "@/lib/constants";
import { dday, fmtRange, nightsLabel } from "@/lib/time";
import { login, logout, setupAdmin } from "@/actions/auth";
import { deletePlayer, savePlayer } from "@/actions/players";
import { createTrip, loadSampleTrip } from "@/actions/trips";
import { Avatar, Clock, PlayersProvider, Seg, useNow } from "./ui";
import { DeleteButton, Field, formObj, Sheet, ToastProvider, useSave } from "./sheet";
import { PlayerFields } from "./player-form";

export function Topbar({ back, me }: { back?: { href: string; label: string }; me?: Player | null }) {
  return (
    <div className="topbar gut">
      {back ? <Link className="back" href={back.href}>◀ {back.label}</Link> : <span />}
      <Clock />
      {me ? (
        <span className="pl"><Avatar p={me} />{me.name}</span>
      ) : (
        <span />
      )}
    </div>
  );
}

/* ---------- 로그인 ---------- */
export function LoginScreen({ players }: { players: Player[] }) {
  const [pick, setPick] = useState<string | null>(null);
  const pw = useRef<HTMLInputElement>(null);
  const { pending, error, save, setError } = useSave(() => {});
  const picked = players.find((p) => p.id === pick);
  return (
    <main className="app">
      <Topbar />
      <header className="marquee gut">
        <p className="px">Player select</p>
        <h1>박규원의 가족여행</h1>
        <p className="sub">내 캐릭터를 누르고 비밀번호를 입력하세요.</p>
      </header>
      <div className="app-body gut">
        <div className="players">
          {players.map((p) => (
            <button key={p.id} className="player" style={{ "--pc": colorHex(p.color) } as React.CSSProperties}
              aria-pressed={pick === p.id}
              onClick={() => { setPick(p.id); setError(""); pw.current?.focus({ preventScroll: true }); }}>
              <span className="tag">{p.admin ? "ADMIN" : ""}</span>
              <Avatar p={p} size="l" />
              <strong>{p.name}</strong>
              <span className="roles">
                {p.roles.slice(0, 2).map((r) => <span className="role" key={r}>{r}</span>)}
                {p.roles.length > 2 && <span className="role">+{p.roles.length - 2}</span>}
              </span>
            </button>
          ))}
        </div>
        <form className="stack" noValidate onSubmit={(e) => {
          e.preventDefault();
          if (!pick) return setError("먼저 내 캐릭터를 눌러 주세요.");
          save(() => login(pick, pw.current?.value ?? ""));
        }}>
          <Field label={picked ? `${picked.name}의 비밀번호` : "비밀번호"} htmlFor="pw">
            <input id="pw" ref={pw} type="password" autoComplete="current-password" enterKeyHint="go" placeholder="비밀번호 입력" />
          </Field>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn primary wide" type="submit" disabled={pending}>{pending ? "확인 중..." : "START ▶"}</button>
          <p className="hint">계정은 관리자가 가족 설정에서 한 사람당 하나씩 만들어요. 비밀번호를 모르면 관리자에게 물어보세요.</p>
        </form>
      </div>
    </main>
  );
}

/* ---------- 처음 설정 ---------- */
export function SetupScreen() {
  const roles = useRef<string[]>(["관리자"]);
  const { pending, error, save } = useSave(() => {});
  return (
    <main className="app">
      <Topbar />
      <header className="marquee gut">
        <p className="px">New game</p>
        <h1>박규원의 가족여행</h1>
        <p className="sub">처음 한 번만 해요. 관리자 계정을 만들면 가족 설정에서 다른 가족을 추가할 수 있어요.</p>
      </header>
      <form className="app-body gut" noValidate onSubmit={(e) => {
        e.preventDefault();
        save(() => setupAdmin({ ...formObj(e.currentTarget), roles: roles.current }));
      }}>
        <PlayerFields initial={{ avatar: "fox", color: "c1", roles: ["관리자"] }} passwordLabel="비밀번호" passwordRequired
          onRolesChange={(r) => (roles.current = r)} />
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn primary wide" type="submit" disabled={pending}>{pending ? "만드는 중..." : "관리자로 시작하기 ▶"}</button>
      </form>
    </main>
  );
}

/* ---------- 여행 목록 ---------- */
export function TripsScreen({ me, players, trips }: { me: Player; players: Player[]; trips: TripSummary[] }) {
  const [sheet, setSheet] = useState(false);
  const now = useNow();
  return (
    <ToastProvider>
      <main className="app">
        <Topbar me={me} />
        <header className="marquee gut">
          <p className="px">Select world</p>
          <h1>박규원의 가족여행</h1>
          <p className="sub">여행을 고르면 일정, 장소, 준비물, 경비를 한곳에서 관리해요.</p>
        </header>
        <div className="app-body gut">
          {trips.length === 0 && (
            <div className="card empty">
              <p className="h3">아직 여행이 없어요</p>
              <p className="hint">아래에서 새 여행을 만들어 보세요.{me.admin && " 예시 여행을 불러와서 참고해도 좋아요."}</p>
            </div>
          )}
          {trips.map((t, i) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="card trip-card">
              <div className="row between" style={{ width: "100%" }}>
                <span className="px muted">World {i + 1}</span>
                <span className="badge">{now ? dday(t.start, t.end, now.date) : "…"}</span>
              </div>
              <h3>{t.title}</h3>
              <p className="muted num">{fmtRange(t.start, t.end)} · {nightsLabel(t.start, t.end)}</p>
              <div style={{ width: "100%" }}><Seg ratio={t.questCount ? t.doneCount / t.questCount : 0} /></div>
              <div className="row between" style={{ width: "100%" }}>
                <span className="party">{players.map((p) => <Avatar key={p.id} p={p} />)}</span>
                <span className="hint num">완료 {t.doneCount}/{t.questCount}</span>
              </div>
            </Link>
          ))}
          <button className="btn dashed" onClick={() => setSheet(true)}>+ 새 여행 만들기</button>
          {me.admin && <SampleButton />}
          <Link className="btn wide" href="/party">{me.admin ? "가족 설정" : "내 정보 · 가족 보기"}</Link>
          <form action={logout} style={{ alignSelf: "center" }}>
            <button className="linkbtn" type="submit">로그아웃 (다른 사람으로 들어가기)</button>
          </form>
        </div>
        {sheet && <NewTripSheet onClose={() => setSheet(false)} />}
      </main>
    </ToastProvider>
  );
}

function SampleButton() {
  const { pending, error, save } = useSave(() => {});
  return (
    <>
      <button className="btn wide coin" disabled={pending} onClick={() => save(() => loadSampleTrip())}>
        {pending ? "불러오는 중..." : "예시 여행 불러오기 (구마모토 11.28–12.02)"}
      </button>
      {error && <p className="err">{error}</p>}
    </>
  );
}

function NewTripSheet({ onClose }: { onClose: () => void }) {
  const { pending, error, save } = useSave(onClose);
  return (
    <Sheet eyebrow="New world" title="새 여행 만들기" onClose={onClose}
      onSubmit={(f) => save(() => createTrip(formObj(f)))}
      foot={<>
        <button type="button" className="btn ghost" onClick={onClose}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>{pending ? "만드는 중..." : "만들기"}</button>
      </>}>
      <Field label="여행 이름" htmlFor="f-title"><input id="f-title" name="title" placeholder="예: 오사카 가족여행" required maxLength={60} /></Field>
      <div className="field"><div className="two">
        <Field label="출발일" htmlFor="f-start"><input id="f-start" name="start" type="date" required /></Field>
        <Field label="도착일" htmlFor="f-end"><input id="f-end" name="end" type="date" required /></Field>
      </div></div>
      <Field label="예산 (엔)" htmlFor="f-budget"><input id="f-budget" name="budget" type="number" inputMode="numeric" min={0} step={1000} defaultValue={300000} /></Field>
      <Field label="환율 (100엔당 원)" htmlFor="f-rate" hint="경비를 원화로 바꿔 보여줄 때 써요. 나중에 바꿀 수 있어요.">
        <input id="f-rate" name="rate" type="number" inputMode="numeric" min={1} defaultValue={DEFAULT_RATE} />
      </Field>
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}

/* ---------- 가족 설정 ---------- */
export function PartyScreen({ me, players }: { me: Player; players: Player[] }) {
  const [edit, setEdit] = useState<Player | "new" | null>(null);
  return (
    <ToastProvider>
      <PlayersProvider players={players}>
        <main className="app">
          <Topbar back={{ href: "/", label: "목록" }} me={me} />
          <header className="marquee gut">
            <p className="px">Party setup</p>
            <h1>{me.admin ? "가족 설정" : "우리 가족"}</h1>
            <p className="sub">{me.admin ? "가족을 추가하고 이름, 캐릭터, 색, 역할, 비밀번호를 정해요." : "내 캐릭터, 색, 역할, 비밀번호를 바꿀 수 있어요."}</p>
          </header>
          <div className="app-body gut">
            {players.map((p) => (
              <article className="card member" key={p.id}>
                <Avatar p={p} size="l" />
                <div className="grow">
                  <div className="row"><h3>{p.name}</h3>{p.admin && <span className="badge">ADMIN</span>}{p.id === me.id && <span className="hint">나</span>}</div>
                  <div className="roles">
                    {p.roles.length ? p.roles.map((r) => <span className="role" key={r} style={{ "--pc": colorHex(p.color) } as React.CSSProperties}>{r}</span>) : <span className="hint">역할 없음</span>}
                  </div>
                  {(me.admin || me.id === p.id) && (
                    <button className="btn small ghost" style={{ alignSelf: "flex-start" }} onClick={() => setEdit(p)}>수정</button>
                  )}
                </div>
              </article>
            ))}
            {me.admin && <button className="btn dashed" onClick={() => setEdit("new")}>+ 가족 추가</button>}
          </div>
          {edit && <PlayerSheet me={me} player={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
        </main>
      </PlayersProvider>
    </ToastProvider>
  );
}

function PlayerSheet({ me, player, onClose }: { me: Player; player: Player | null; onClose: () => void }) {
  const roles = useRef<string[]>(player?.roles ?? []);
  const { pending, error, save } = useSave(onClose, player ? "저장했어요" : "가족을 추가했어요");
  return (
    <Sheet eyebrow={player ? "Edit player" : "New player"} title={player ? `${player.name} 수정` : "가족 추가"} onClose={onClose}
      onSubmit={(f) => save(() => savePlayer({ ...formObj(f), id: player?.id ?? "", roles: roles.current }))}
      foot={<>
        <button type="button" className="btn ghost" onClick={onClose}>취소</button>
        <button type="submit" className="btn primary" disabled={pending}>{pending ? "저장 중..." : player ? "저장" : "추가"}</button>
        {player && me.admin && !player.admin && (
          <DeleteButton label={`${player.name} 삭제`} disabled={pending} onConfirm={() => save(() => deletePlayer(player.id), "삭제했어요")} />
        )}
      </>}>
      <PlayerFields initial={player ?? undefined} passwordLabel={player ? "새 비밀번호 (바꿀 때만)" : "비밀번호"}
        passwordRequired={!player} onRolesChange={(r) => (roles.current = r)} />
      {error && <p className="err" role="alert">{error}</p>}
    </Sheet>
  );
}
