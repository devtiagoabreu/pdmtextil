import type { ModeloProcesso } from "./types"
import { nomeDoNo, resumoModelo } from "./modelo-semantico"

const BOLINHA = "\u00b7"

export function modeloParaMarkdown(modelo: ModeloProcesso): string {
  const s = resumoModelo(modelo)
  const linhas: string[] = []

  linhas.push(`# ${modelo.nome?.trim() || "Processo"}`)
  linhas.push("")
  if (modelo.objetivo?.trim()) {
    linhas.push(`**Objetivo:** ${modelo.objetivo.trim()}`)
    linhas.push("")
  }
  linhas.push(
    `> ${s.atividades} atividades ${BOLINHA} ${s.decisoes} decisões ${BOLINHA} ${s.fluxos} fluxos ${BOLINHA} ${s.nos} nós`
  )
  linhas.push("")

  linhas.push("## Atividades")
  if (modelo.atividades.length === 0) {
    linhas.push("_Nenhuma atividade registrada._")
  } else {
    modelo.atividades.forEach((a, i) => {
      const infos = [
        a.responsavel ? `**Responsável:** ${a.responsavel}` : "",
        a.sistema ? `**Sistema:** ${a.sistema}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
      linhas.push(`${i + 1}. **${a.nome}** ${infos ? `_(${infos})_` : ""}`)
      if (a.descricao?.trim()) linhas.push(`   ${a.descricao.trim()}`)
    })
  }
  linhas.push("")

  linhas.push("## Decisões")
  if (modelo.decisoes.length === 0) {
    linhas.push("_Nenhuma decisão registrada._")
  } else {
    modelo.decisoes.forEach((d) => {
      linhas.push(`- **${d.pergunta}** _(${d.id})_`)
    })
  }
  linhas.push("")

  linhas.push("## Fluxos")
  if (modelo.fluxos.length === 0) {
    linhas.push("_Nenhum fluxo registrado._")
  } else {
    modelo.fluxos.forEach((f) => {
      const rotulo = f.rotulo ? ` (${f.rotulo})` : ""
      linhas.push(`- ${nomeDoNo(modelo, f.de)} → ${nomeDoNo(modelo, f.para)}${rotulo}`)
    })
  }

  return linhas.join("\n")
}