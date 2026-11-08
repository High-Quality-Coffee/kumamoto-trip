import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { listPlayers } from "@/lib/data";
import { LoginScreen } from "@/components/screens";

export const metadata = { title: "로그인 · 박규원의 가족여행" };

export default async function LoginPage() {
  if (await getMe()) redirect("/");
  const players = await listPlayers();
  if (players.length === 0) redirect("/setup");
  return <LoginScreen players={players} />;
}
