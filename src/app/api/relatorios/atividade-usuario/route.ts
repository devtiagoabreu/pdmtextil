import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function rows(sqlFragment: ReturnType<typeof sql>): Promise<any[]> {
  try {
    const result = await db.execute(sqlFragment)
    return Array.isArray(result) ? result : []
  } catch (e) {
    console.error("[DB]", e)
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const url = new URL(req.url)
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")
    const usuarioFiltro = url.searchParams.get("usuario")
    const tipoFiltro = url.searchParams.get("tipo")

    function filtro(col = "created_at") {
      const parts = ["TRUE"]
      if (dataInicio) parts.push(`${col} >= '${dataInicio.replace(/'/g, "''")}'::timestamp`)
      if (dataFim) parts.push(`${col} <= '${dataFim.replace(/'/g, "''")}'::timestamp`)
      return sql.raw(parts.join(" AND "))
    }

    const f = filtro()

    const condUsuario = usuarioFiltro
      ? sql`AND ${sql.raw(`usuario_nome ILIKE '%${usuarioFiltro.replace(/'/g, "''")}%'`)}`
      : sql``
    const condTipo = tipoFiltro
      ? sql`AND tipo = ${sql.raw(`'${tipoFiltro.replace(/'/g, "''")}'`)}`
      : sql``

    const agregado = (await rows(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(DISTINCT usuario_nome)::int AS total_usuarios,
        MIN(created_at)::text AS primeira_atividade,
        MAX(created_at)::text AS ultima_atividade
      FROM logs WHERE ${f} ${condUsuario} ${condTipo}
    `))[0] || { total: 0, total_usuarios: 0, primeira_atividade: null, ultima_atividade: null }

    const porUsuario = await rows(sql`
      SELECT
        usuario_nome,
        COUNT(*)::int AS total
      FROM logs WHERE ${f} ${condUsuario} ${condTipo}
      GROUP BY usuario_nome
      ORDER BY total DESC
    `)

    const porTipo = await rows(sql`
      SELECT
        tipo,
        COUNT(*)::int AS total
      FROM logs WHERE ${f} ${condUsuario} ${condTipo}
      GROUP BY tipo
      ORDER BY total DESC
    `)

    const recentes = await rows(sql`
      SELECT
        id, tipo, acao, descricao, entidade, entidade_id,
        usuario_nome, TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM logs WHERE ${f} ${condUsuario} ${condTipo}
      ORDER BY created_at DESC
      LIMIT 50
    `)

    const tiposDisponiveis = await rows(sql`
      SELECT DISTINCT tipo FROM logs ORDER BY tipo
    `)

    const usuariosDisponiveis = await rows(sql`
      SELECT DISTINCT usuario_nome FROM logs WHERE usuario_nome IS NOT NULL ORDER BY usuario_nome
    `)

    return NextResponse.json({
      stats: {
        total: Number(agregado.total ?? 0),
        totalUsuarios: Number(agregado.total_usuarios ?? 0),
        primeiraAtividade: agregado.primeira_atividade,
        ultimaAtividade: agregado.ultima_atividade,
      },
      porUsuario: porUsuario.map((r: any) => ({ usuario: r.usuario_nome, total: Number(r.total) })),
      porTipo: porTipo.map((r: any) => ({ tipo: r.tipo, total: Number(r.total) })),
      recentes: recentes.map((r: any) => ({
        id: r.id,
        tipo: r.tipo,
        acao: r.acao,
        descricao: r.descricao,
        entidade: r.entidade,
        entidadeId: r.entidade_id,
        usuario: r.usuario_nome,
        createdAt: r.created_at,
      })),
      filtros: {
        tipos: tiposDisponiveis.map((r: any) => r.tipo),
        usuarios: usuariosDisponiveis.map((r: any) => r.usuario_nome),
      },
    })
  } catch (error) {
    console.error("[GET /api/relatorios/atividade-usuario]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
