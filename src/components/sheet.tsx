"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/types";

/* ---------- 토스트 ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <ToastCtx value={show}>
      {children}
      <div className="toast" role="status" hidden={!msg}>
        {msg}
      </div>
    </ToastCtx>
  );
}

/* ---------- 아래에서 올라오는 시트 ---------- */
export function Sheet({
  eyebrow, title, onClose, children, foot, onSubmit,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  foot: React.ReactNode;
  onSubmit?: (form: HTMLFormElement) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 부모 화면은 시계 때문에 1초마다 다시 그려져서 onClose 가 매번 새 함수가 돼요.
  // 그걸 effect 의존성에 넣으면 1초마다 포커스가 첫 칸으로 돌아가 입력이 안 돼요. 그래서 ref 로 들고 있어요.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    document.body.classList.add("lock");
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(".sheet-body input:not([type=radio]), .sheet-body select, .sheet-body textarea, .x");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("lock");
      window.removeEventListener("keydown", onKey);
      if (prev && document.body.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, []);

  const inner = (
    <>
      <div className="sheet-head gut">
        <div>
          <p className="px muted">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <button type="button" className="x" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      <div className="sheet-body gut">{children}</div>
      <div className="sheet-foot gut">{foot}</div>
    </>
  );
  return (
    <div className="sheet-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        {onSubmit ? (
          <form className="sheet-in" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(e.currentTarget); }}>
            {inner}
          </form>
        ) : (
          <div className="sheet-in">{inner}</div>
        )}
      </div>
    </div>
  );
}

/** 폼 시트를 위한 저장 처리: 버튼 잠그기, 에러 보여주기, 성공하면 닫기 */
export function useSave(onDone: () => void, okMsg?: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const save = async (job: () => Promise<ActionResult>, msg = okMsg) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const r = await job();
      if (!r) return; // redirect() 로 다른 화면으로 이동 중
      if (r.ok) {
        if (msg) toast(msg);
        onDone();
      } else setError(r.error);
    } catch (e) {
      // redirect() 는 정상 흐름이라 다시 던져요
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
      setError("연결이 불안정해요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  };
  return { pending, error, save, setError };
}

export const formObj = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form)) as Record<string, string>;

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="lbl">{label}</span>}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

/** 두 번 눌러야 삭제 */
export function DeleteButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <button type="button" className="btn danger full" disabled={disabled} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? "정말 삭제할까요? 한 번 더 누르세요" : label}
    </button>
  );
}
