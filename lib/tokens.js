import "server-only";
import crypto from "node:crypto";

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
