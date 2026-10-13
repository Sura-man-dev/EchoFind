import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "../../Components/DashboardShell";
import ConversationView from "./ConversationView";

export default async function ConversationPage({ params }) {
  const session = await auth();
  if (!session?.user) {
    const { id } = await params;
    redirect(`/login?callbackUrl=${encodeURIComponent(`/messages/${id}`)}`);
  }

  const { id } = await params;
  return (
    <DashboardShell>
      <ConversationView conversationId={id} />
    </DashboardShell>
  );
}
