import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

/** Short, human-friendly reference like "OB-7K2Q9M" (booking) or "OS-…" (shop). */
export function makeCode(prefix: "OB" | "OS") {
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${out}`;
}
