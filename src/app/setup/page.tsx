import { connection } from "next/server";
import { redirect } from "next/navigation";
import { hasAnyPlayer } from "@/lib/data";
import { SetupScreen } from "@/components/screens";

export const metadata = { title: "처음 설정 · 박규원의 가족여행" };

export default async function SetupPage() {
  await connection(); // 요청마다 DB를 확인해야 해서 미리 만들어 두지 않아요
  if (await hasAnyPlayer()) redirect("/login");
  return <SetupScreen />;
}
