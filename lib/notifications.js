export async function notifyAdmins(transaction, { type, title, message, excludeUserId }) {
  const admins = await transaction.user.findMany({
    where: {
      role: "admin",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (admins.length === 0) {
    return 0;
  }

  const result = await transaction.notification.createMany({
    data: admins.map(({ id }) => ({ userId: id, type, title, message })),
  });

  return result.count;
}
