import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!
const sslMode = process.env.NODE_ENV === "production" ? ("require" as const) : undefined
const poolConfig = {
  prepare: false,
  max: parseInt(process.env.DB_POOL_MAX || "10"),
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30"),
  ssl: sslMode,
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "15"),
}
const client = postgres(connectionString, poolConfig)
export const db = drizzle(client, { schema })
