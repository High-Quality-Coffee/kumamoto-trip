import { notFound } from "next/navigation";
import { requireMe } from "@/lib/session";
import { getTrip, listPlayers } from "@/lib/data";
import { TripApp } from "@/components/trip-app";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMe();
  const { id } = await params;
  const [trip, players] = await Promise.all([getTrip(id), listPlayers()]);
  if (!trip) notFound();
  return <TripApp trip={trip} players={players} me={me} />;
}
