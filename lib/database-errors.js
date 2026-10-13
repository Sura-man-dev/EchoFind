const transientDatabaseCodes = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const transientConnectionMessage =
  /connection reset|connection closed|connection terminated|server has closed the connection|can't reach database server|timed out fetching a new connection|ECONNRESET/i;

export function isTransientDatabaseError(error) {
  const seen = new Set();
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);

    if (
      transientDatabaseCodes.has(current.code) ||
      (typeof current.message === "string" &&
        transientConnectionMessage.test(current.message))
    ) {
      return true;
    }

    current = current.cause;
  }

  return false;
}

export function getDatabaseFailure(error, fallback) {
  if (isTransientDatabaseError(error)) {
    return {
      message: "The database is unreachable. Check that your Neon project is active and DATABASE_URL points to the current database.",
      status: 503,
    };
  }

  const seen = new Set();
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current.code === "P2021" || current.code === "P2022") {
      return {
        message: "The database schema is out of date. Run npx prisma migrate deploy, then try again.",
        status: 503,
      };
    }
    current = current.cause;
  }

  return { message: fallback, status: 500 };
}
