import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import ReportManagement from "./ReportManagement";

export default async function AdminReportsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  return <ReportManagement />;
}
