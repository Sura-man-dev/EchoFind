import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import MatchCenterClient from "./MatchCenterClient";

export default async function MatchCenterPage() {
  const session = await requireAdmin();

  if (!session) {
    redirect("/");
  }

  return <MatchCenterClient />;
}
