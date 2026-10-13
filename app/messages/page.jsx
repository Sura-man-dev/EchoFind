import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "../Components/DashboardShell";
import MessagesInbox from "./MessagesInbox";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fmessages");

  return (
    <DashboardShell>
      <MessagesInbox />
    </DashboardShell>
  );
}
