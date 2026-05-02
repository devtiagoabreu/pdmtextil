import type { Config } from "drizzle-kit"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

export default {
  schema: "./src/lib/db/schema/*.ts",
  out: "./src/lib/db/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
