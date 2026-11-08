import { requireMe } from "@/lib/session";
import { listPlayers } from "@/lib/data";
import { PartyScreen } from "@/components/screens";

export const metadata = { title: "가족 설정 · 박규원의 가족여행" };

export default async function PartyPage() {
  const me = await requireMe();
  return <PartyScreen me={me} players={await listPlayers()} />;
}
