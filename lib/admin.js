import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }

  return session;
}