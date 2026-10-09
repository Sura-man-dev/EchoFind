import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "../Components/DashboardShell";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fprofile");

  return (
    <DashboardShell>
      <ProfileClient />
    </DashboardShell>
  );
}
