"use client";

import { useState } from "react";
import type { ActionResult, Player } from "@/lib/types";
import { COLORS, ROLE_SUGGESTIONS } from "@/lib/constants";
import { AVATARS } from "@/lib/pixel";
import { Avatar } from "./ui";
import { Field } from "./sheet";

/** 캐릭터·색·역할(여러 개)·비밀번호 입력. 가족 설정과 처음 설정 화면에서 같이 써요. */
export function PlayerFields({
  initial, passwordLabel, passwordRequired, onRolesChange,
}: {
  initial?: Partial<Player>;
  passwordLabel: string;
  passwordRequired: boolean;
  onRolesChange: (roles: string[]) => void;
}) {
  const [avatar, setAvatar] = useState(initial?.avatar ?? "chick");
  const [color, setColor] = useState(initial?.color ?? "c5");
  const [roles, setRoles] = useState<string[]>(initial?.roles ?? []);
  const [draft, setDraft] = useState("");

  const update = (next: string[]) => {
    setRoles(next);
    onRolesChange(next);
  };
  const add = (v: string) => {
    const r = v.trim().slice(0, 20);
    if (r && !roles.includes(r) && roles.length < 10) update([...roles, r]);
    setDraft("");
  };

  return (
    <>
      <Field label="이름" htmlFor="f-name" hint="한 사람당 계정은 하나예요. 같은 이름은 만들 수 없어요.">
        <input id="f-name" name="name" type="text" defaultValue={initial?.name ?? ""} placeholder="예: 엄마" required maxLength={20} autoComplete="off" />
      </Field>
      <Field label="캐릭터">
        <div className="avatars" role="radiogroup" aria-label="캐릭터">
          {Object.entries(AVATARS).map(([k, a]) => (
            <label className="opt" key={k}>
              <input type="radio" name="avatar" value={k} checked={avatar === k} onChange={() => setAvatar(k)} />
              <Avatar p={{ avatar: k, color }} size="m" />
              {a.name}
            </label>
          ))}
        </div>
      </Field>
      <Field label="색">
        <div className="colors" role="radiogroup" aria-label="색">
          {COLORS.map((c) => (
            <label className="opt" key={c.key}>
              <input type="radio" name="color" value={c.key} checked={color === c.key} onChange={() => setColor(c.key)} />
              <span className="sw" style={{ "--pc": c.hex } as React.CSSProperties} />
              {c.name}
            </label>
          ))}
        </div>
      </Field>
      <Field label="역할 (여러 개 가능)">
        <div className="stack" style={{ gap: 8 }}>
          <div className="roles">
            {roles.length ? (
              roles.map((r, i) => (
                <span className="role-on" key={r}>
                  {r}
                  <button type="button" aria-label={`${r} 빼기`} onClick={() => update(roles.filter((_, j) => j !== i))}>✕</button>
                </span>
              ))
            ) : (
              <span className="hint">아직 역할이 없어요</span>
            )}
          </div>
          <div className="role-edit">
            <input
              id="f-role" type="text" value={draft} placeholder="역할 입력 (예: 운전)" enterKeyHint="done" maxLength={20}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
              style={{ minHeight: 48, border: "3px solid var(--line)", padding: "8px 12px", fontSize: 18 }}
            />
            <button type="button" className="btn small" onClick={() => add(draft)}>추가</button>
          </div>
          <div className="row">
            {ROLE_SUGGESTIONS.filter((r) => !roles.includes(r)).map((r) => (
              <button type="button" className="sug" key={r} onClick={() => add(r)}>+ {r}</button>
            ))}
          </div>
        </div>
      </Field>
      <Field label={passwordLabel} htmlFor="f-password" hint="4글자 이상. 가족에게 직접 알려 주세요.">
        <input id="f-password" name="password" type="password" autoComplete="new-password" required={passwordRequired}
          placeholder={passwordRequired ? "비밀번호" : "비워 두면 그대로"} />
      </Field>
    </>
  );
}

export type SavePlayer = (raw: Record<string, unknown>) => Promise<ActionResult>;
