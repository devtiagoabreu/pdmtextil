import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const envRaw = readFileSync(".env.local", "utf-8")
const match = envRaw.match(/^DATABASE_URL="(.+)"$/m)
const url = match[1]
const sql = neon(url)

const r = await sql`SELECT id, email, name, role, ativo FROM usuarios WHERE email = 'promodamarketing@gmail.com'`
console.log(JSON.stringify(r, null, 2))
