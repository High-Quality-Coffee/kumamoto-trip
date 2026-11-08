import { getMe } from "@/lib/session";
import { getTrip } from "@/lib/data";

/** 다른 가족이 고친 게 있는지 가볍게 확인하는 용도 (문서 1개 읽기) */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const trip = await getTrip(id);
  if (!trip) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ version: trip.version ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
