import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");

// Reuse one client across hot reloads in dev and across invocations in a warm serverless instance.
const g = globalThis as unknown as { __opalSql?: ReturnType<typeof postgres> };
const sql =
  g.__opalSql ??
  postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    // Neon's pooler (PgBouncer, transaction mode) does not support prepared statements.
    prepare: false,
    idle_timeout: 20,
  });
if (process.env.NODE_ENV !== "production") g.__opalSql = sql;

export const db = drizzle(sql, { schema });
export { schema };

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbOrTx = typeof db | Tx;
