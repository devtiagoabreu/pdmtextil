import { db } from "../lib/db";
import { solicitacoes } from "../lib/db/schema/solicitacoes";
import { eq } from "drizzle-orm";

async function testUpdate() {
  console.log("Updating solicitacao 4...");
  const dateStr = "2026-05-20T12:00:00Z";
  
  const payload = {
    prazoDesejado: new Date(dateStr),
    briefing: {
      comercial: {
        targetPreco: "PREMIUM",
        prazoEntrega: "45 dias"
      }
    }
  };

  try {
    const res = await db.update(solicitacoes)
      .set({
        prazoDesejado: payload.prazoDesejado,
        briefing: payload.briefing
      })
      .where(eq(solicitacoes.id, 4))
      .returning();

    console.log("Result:");
    console.log(JSON.stringify(res, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testUpdate().then(() => process.exit(0));
