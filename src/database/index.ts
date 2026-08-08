import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isDatabaseConfigured } from "@/lib/config/env";
import * as schema from "@/database/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  }

  return db!;
}

export function isDbReady(): boolean {
  return isDatabaseConfigured();
}
