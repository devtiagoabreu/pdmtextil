import { db } from "@/lib/db"
import { bancosDados } from "@/lib/db/schema/banco-dados"
import { eq } from "drizzle-orm"

export async function resolverConnectionString(
  id: number | null | undefined
): Promise<string | null> {
  if (!id) return null
  const [conn] = await db.select().from(bancosDados).where(eq(bancosDados.id, id)).limit(1)
  return conn?.connectionString ?? null
}
