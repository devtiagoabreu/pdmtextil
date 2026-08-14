import { eq } from "drizzle-orm"
import { representantes } from "@/lib/db/schema/representantes"
import { clientesRepresentantes } from "@/lib/db/schema/clientes-representantes"

export async function excluirRepresentanteCascade(tx: any, representanteId: number) {
  await tx.delete(clientesRepresentantes).where(eq(clientesRepresentantes.representanteId, representanteId))
  return tx.delete(representantes).where(eq(representantes.id, representanteId)).returning()
}
