import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };
const databaseUrl = process.env.DATABASE_URL?.replace(/sslmode=(prefer|require|verify-ca)/i, "sslmode=verify-full");
export const pool = globalForDb.pool ?? new Pool({ connectionString: databaseUrl });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
export const db = drizzle(pool);
