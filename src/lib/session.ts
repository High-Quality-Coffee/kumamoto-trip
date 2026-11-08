import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import type { Player, PlayerRecord } from "./types";
import { getStore } from "./store";

const COOKIE = "trip_session";
const MAX_AGE = 60 * 60 * 24 * 180; // 180일: 부모님이 매번 로그인하지 않아도 되게

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production")
      throw new Error("SESSION_SECRET 환경 변수를 설정해 주세요.");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(playerId: string) {
  const token = await new SignJWT({ pid: playerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const toPlayer = (p: PlayerRecord): Player => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  color: p.color,
  roles: p.roles ?? [],
  admin: !!p.admin,
});

/** 로그인한 가족. 없으면 null */
export async function getMe(): Promise<Player | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const pid = String(payload.pid ?? "");
    if (!pid) return null;
    const rec = await (await getStore()).get<PlayerRecord>("players", pid);
    return rec ? toPlayer(rec) : null;
  } catch {
    return null;
  }
}

/** 페이지용: 로그인 안 했으면 로그인 화면으로 */
export async function requireMe(): Promise<Player> {
  const me = await getMe();
  if (!me) redirect("/login");
  return me;
}
