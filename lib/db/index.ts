import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Single shared database client — every server-side module that needs
// database access should import `db` from here rather than creating its
// own Neon/Drizzle client. Using the neon-http driver (one HTTP request per
// query, no persistent connection) since this app runs in serverless/edge
// request handlers, not a long-lived server process.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. This app requires a Postgres connection string " +
      "(a Neon database — see https://neon.tech) for authentication (NextAuth " +
      "sessions/accounts) and other database-backed features. Set DATABASE_URL " +
      "in your .env.local, e.g. DATABASE_URL=postgresql://user:pass@host/db?sslmode=require " +
      "— see .env.example."
  );
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
