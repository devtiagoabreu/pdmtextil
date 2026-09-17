// Seed do módulo "Process Studio" — gera um fluxograma (proc_diagramas) para cada
// processo da área "Tecnologia da Informação", reconstruindo o modelo semântico a
// partir dos subprocessos e atividades do banco e derivando Mermaid, Markdown e BPMN
// com os geradores oficiais do app (mesmo código usado na UI).
//
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   npx.cmd tsx scripts/seed-diagramas-ti.ts                  (todos os bancos)
//   npx.cmd tsx scripts/seed-diagramas-ti.ts --db=pdm_textil   (só o principal)
//   npx.cmd tsx scripts/seed-diagramas-ti.ts --dry-run         (não grava, só reporta)
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON) e o pacote "postgres".

import { config } from "dotenv"
config({ path: ".env.local" })
import postgres from "postgres"
import type { ModeloProcesso } from "../src/lib/processos/diagrama/types"
import { modeloParaMermaid } from "../src/lib/processos/diagrama/mermaid"
import { modeloParaMarkdown } from "../src/lib/processos/diagrama/markdown"
import { modeloParaBpmn } from "../src/lib/processos/diagrama/bpmn"

const AREA_TI = "Tecnologia da Informação"
const SITE_TI = "Matriz"
const EMPRESA = "Pro Moda Têxtil"

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

const args = process.argv.slice(2)
function argValue(flag: string): string | null {
  const item = args.find((a) => a.startsWith(flag + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const dryRun = args.includes("--dry-run")

interface SubprocessoRow {
  id: number
  nome: string
  descricao: string | null
  ordem: number
  atividades: { nome: string; tipo: string | null; responsavel: string | null; ordem: number }[]
}

function primeiroResponsavel(atividades: SubprocessoRow["atividades"]): string {
  const r = atividades.find((a) => a.responsavel && a.tipo !== "DECISAO")
  return (r && r.responsavel) || ""
}

function decidirPorAtividade(atividades: SubprocessoRow["atividades"]): string {
  const d = atividades.find((a) => a.tipo === "DECISAO")
  return (d && d.nome) || ""
}

function modeloDeProcesso(nome: string, objetivo: string | null, subs: SubprocessoRow[]): ModeloProcesso {
  const atividades: ModeloProcesso["atividades"] = []
  const decisoes: ModeloProcesso["decisoes"] = []
  const fluxos: ModeloProcesso["fluxos"] = []

  const nos: { id: string; tipo: "atividade" | "decisao" }[] = []

  subs.forEach((s, i) => {
    const idA = `A${i + 1}`
    atividades.push({
      id: idA,
      nome: s.nome,
      responsavel: primeiroResponsavel(s.atividades),
      descricao: s.descricao || undefined,
    })
    nos.push({ id: idA, tipo: "atividade" })

    const pergunta = decidirPorAtividade(s.atividades)
    if (pergunta) {
      const idD = `D${decisoes.length + 1}`
      decisoes.push({ id: idD, pergunta })
      nos.push({ id: idD, tipo: "decisao" })
    }
  })

  const sequencia = ["inicio", ...nos.map((n) => n.id), "fim"]
  sequencia.forEach((node, i) => {
    if (i < sequencia.length - 1) {
      fluxos.push({ id: `F${i + 1}`, de: node, para: sequencia[i + 1] })
    }
  })

  return { schemaVersion: "1", nome, objetivo: objetivo || "", atividades, decisoes, fluxos }
}

async function ensureDiagrama(sql: postgres.Sql, nome: string, descricao: string | null, modelo: ModeloProcesso): Promise<boolean> {
  const [exist] = await sql`SELECT id FROM proc_diagramas WHERE LOWER(nome) = LOWER(${nome}) LIMIT 1`
  if (exist) return false

  if (dryRun) {
    console.log(`    [dry-run] criaria diagrama "${nome}"`)
    return true
  }

  await sql`
    INSERT INTO proc_diagramas (nome, tipo, descricao, modelo, mermaid, markdown, bpmn_xml, ativo)
    VALUES (
      ${nome}, 'FLUXOGRAMA', ${descricao},
      ${sql.json(modelo)},
      ${modeloParaMermaid(modelo, "FLUXOGRAMA")},
      ${modeloParaMarkdown(modelo)},
      ${modeloParaBpmn(modelo)},
      true
    )
  `
  return true
}

async function seedDb({ name, url }: { name: string; url?: string }): Promise<void> {
  if (!url) {
    console.log(`[${name}] SEM_URL — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    console.log(`\n[${name}] geração de diagramas de T.I.`)

    const [empresa] = await sql`SELECT id FROM proc_empresas WHERE LOWER(nome) = LOWER(${EMPRESA}) LIMIT 1`
    if (!empresa) {
      console.log(`  → empresa "${EMPRESA}" não encontrada — rode scripts/seed-processos-ti.js primeiro`)
      return
    }

    const [area] = await sql`
      SELECT a.id FROM proc_areas a
      JOIN proc_sites s ON s.id = a.site_id
      WHERE s.empresa_id = ${empresa.id} AND s.nome = ${SITE_TI} AND LOWER(a.nome) = LOWER(${AREA_TI})
      LIMIT 1
    `
    if (!area) {
      console.log(`  → área "${AREA_TI}" do site "${SITE_TI}" não encontrada`)
      return
    }

    const processos = await sql`
      SELECT id, codigo, nome, objetivo FROM proc_processos
      WHERE area_id = ${area.id}
      ORDER BY id
    `

    let criados = 0
    let existentes = 0

    for (const p of processos) {
      const subs = await sql`
        SELECT id, nome, descricao, ordem FROM proc_subprocessos
        WHERE processo_id = ${p.id}
        ORDER BY ordem, id
      `
      const subprocessos: SubprocessoRow[] = []
      for (const s of subs) {
        const atv = await sql`
          SELECT nome, tipo, responsavel, ordem FROM proc_atividades
          WHERE subprocesso_id = ${s.id}
          ORDER BY ordem, id
        `
        subprocessos.push({ id: s.id, nome: s.nome, descricao: s.descricao, ordem: s.ordem, atividades: atv })
      }

      const nome = `${p.codigo} — ${p.nome}`
      const modelo = modeloDeProcesso(p.nome, p.objetivo, subprocessos)
      const criado = await ensureDiagrama(sql, nome, p.objetivo, modelo)
      if (criado) criados++
      else existentes++
      console.log(`  ${criado ? "→ criado " : "  existe  "} ${nome}`)
    }

    console.log(`  [${name}] ${criados} diagrama(s) criado(s), ${existentes} já existente(s)`)
  } catch (err) {
    console.error(`[${name}] erro:`, err instanceof Error ? err.message : err)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main(): Promise<void> {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  console.log(`${dryRun ? "[DRY-RUN] " : ""}Área: ${AREA_TI} | geração de fluxogramas por processo`)
  for (const db of alvos) {
    await seedDb(db)
  }
  console.log("\nDone!")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})