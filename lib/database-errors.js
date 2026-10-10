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
