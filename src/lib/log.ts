import { db } from "./db"
import { logs, NewLog } from "./db/schema/logs"

export async function registrarLog(data: NewLog) {
  try {
    await db.insert(logs).values(data)
  } catch (err) {
    console.error("[LOG] Falha ao registrar log:", err)
  }
}
