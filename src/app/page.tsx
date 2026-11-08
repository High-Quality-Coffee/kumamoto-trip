import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { hasAnyPlayer, listPlayers, listTrips } from "@/lib/data";
import { TripsScreen } from "@/components/screens";

export default async function Home() {
  const me = await getMe();
  if (!me) redirect((await hasAnyPlayer()) ? "/login" : "/setup");
  const [players, trips] = await Promise.all([listPlayers(), listTrips()]);
  return <TripsScreen me={me} players={players} trips={trips} />;
}
