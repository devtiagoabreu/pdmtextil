export const PROJETO_VALUES = ["SYSTEXTIL", "BLING", "INTERNA", "OUTROS"] as const
export type ProjetoReuniao = (typeof PROJETO_VALUES)[number]

export const STATUS_REUNIAO_VALUES = ["AGENDADA", "REALIZADA", "CANCELADA"] as const
export type StatusReuniao = (typeof STATUS_REUNIAO_VALUES)[number]

export const STATUS_ENCAMINHAMENTO_VALUES = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"] as const
export type StatusEncaminhamento = (typeof STATUS_ENCAMINHAMENTO_VALUES)[number]

const PROJETO_LABELS: Record<string, string> = {
  SYSTEXTIL: "Systêxtil",
  BLING: "Bling",
  INTERNA: "Interna",
  OUTROS: "Outros",
}

const STATUS_REUNIAO_LABELS: Record<string, string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
}

const STATUS_ENCAMINHAMENTO_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
}

export function labelProjeto(chave: string): string {
  return PROJETO_LABELS[chave] ?? chave
}

export function labelStatusReuniao(chave: string): string {
  return STATUS_REUNIAO_LABELS[chave] ?? chave
}

export function labelStatusEncaminhamento(chave: string): string {
  return STATUS_ENCAMINHAMENTO_LABELS[chave] ?? chave
}

export const ROLES_ESCRITA_REUNIAO = ["ADMIN", "SUDO", "DESENVOLVIMENTO", "COMERCIAL", "CRM"]
export const ROLES_EXCLUSAO_REUNIAO = ["ADMIN", "SUDO"]

export function podeEscreverReuniao(role?: string | null): boolean {
  return !!role && ROLES_ESCRITA_REUNIAO.includes(role)
}

export function podeExcluirReuniao(role?: string | null): boolean {
  return !!role && ROLES_EXCLUSAO_REUNIAO.includes(role)
}

export type ReuniaoPautaInput = { descricao: string }
export type ReuniaoParticipanteInput = { nome: string; empresa?: string | null; papel?: string | null }
export type ReuniaoEncaminhamentoInput = {
  descricao: string
  responsavel?: string | null
  prazo?: string | null
  status?: string
}
export type ReuniaoLinkInput = { rotulo?: string | null; url: string; descricao?: string | null }

export type ReuniaoFormData = {
  titulo: string
  projeto: string
  data: Date
  local: string | null
  status: string
  resumoCurto: string | null
  resumoDetalhado: string | null
  resumoItensAcao: string | null
  transcricao: string | null
  videoUrl: string | null
  ata: string | null
  pautas: { descricao: string }[]
  participantes: { nome: string; empresa: string | null; papel: string | null }[]
  encaminhamentos: { descricao: string; responsavel: string | null; prazo: Date | null; status: string }[]
  links: { rotulo: string; url: string; descricao: string | null }[]
}

function textoNulo(valor: unknown): string | null {
  if (typeof valor !== "string") return null
  const limpo = valor.trim()
  return limpo === "" ? null : limpo
}

function textoObrigatorioSimples(valor: unknown): string {
  if (typeof valor !== "string") return ""
  return valor.trim()
}

function isEnumerado(valor: string, valores: readonly string[]): boolean {
  return valores.includes(valor)
}

function dataDeEntrada(valor: unknown): Date | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor
  if (typeof valor !== "string" || valor.trim() === "") return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function urlValida(valor: string): boolean {
  return /^https?:\/\//.test(valor)
}

function pickArray(valor: unknown): unknown[] {
  if (!Array.isArray(valor)) return []
  return valor
}

export type ValidarReuniaoResultado = { data: ReuniaoFormData } | { error: string }

export function validarReuniao(input: Record<string, unknown>): ValidarReuniaoResultado {
  const titulo = textoObrigatorioSimples(input.titulo)
  if (titulo === "") return { error: "O título da reunião é obrigatório." }

  const projeto = textoObrigatorioSimples(input.projeto) || "INTERNA"
  if (!isEnumerado(projeto, PROJETO_VALUES)) return { error: "Projeto inválido." }

  const data = dataDeEntrada(input.data)
  if (!data) return { error: "Data da reunião inválida." }

  const status = textoObrigatorioSimples(input.status) || "AGENDADA"
  if (!isEnumerado(status, STATUS_REUNIAO_VALUES)) return { error: "Status de reunião inválido." }

  const videoUrl = textoNulo(input.videoUrl)
  if (videoUrl && !urlValida(videoUrl)) return { error: "Link inválido." }

  const pautas: ReuniaoPautaInput[] = pickArray(input.pautas)
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({ descricao: textoObrigatorioSimples(item.descricao) }))
    .filter((item) => item.descricao !== "")

  const participantes: ReuniaoParticipanteInput[] = pickArray(input.participantes)
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({
      nome: textoObrigatorioSimples(item.nome),
      empresa: textoNulo(item.empresa),
      papel: textoNulo(item.papel),
    }))
    .filter((item) => item.nome !== "")

  const encaminhamentos: { descricao: string; responsavel?: unknown; prazo?: unknown; status?: unknown }[] =
    pickArray(input.encaminhamentos)
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
      .map((item) => ({
        descricao: textoObrigatorioSimples(item.descricao),
        responsavel: item.responsavel,
        prazo: item.prazo,
        status: item.status,
      }))
      .filter((item) => item.descricao !== "")

  const encaminhamentosValidados: ReuniaoFormData["encaminhamentos"] = []
  for (const item of encaminhamentos) {
    const statusEnc = textoObrigatorioSimples(item.status) || "PENDENTE"
    if (!isEnumerado(statusEnc, STATUS_ENCAMINHAMENTO_VALUES)) return { error: "Status de encaminhamento inválido." }
    const prazo = dataDeEntrada(item.prazo)
    if (item.prazo !== null && item.prazo !== undefined && item.prazo !== "" && !prazo) {
      return { error: "Prazo de encaminhamento inválido." }
    }
    encaminhamentosValidados.push({
      descricao: item.descricao,
      responsavel: textoNulo(item.responsavel),
      prazo: prazo ?? null,
      status: statusEnc,
    })
  }

  const links: ReuniaoFormData["links"] = []
  for (const item of pickArray(input.links)) {
    const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    const url = textoObrigatorioSimples(obj.url)
    if (url === "") continue
    if (!urlValida(url)) return { error: "Link inválido." }
    links.push({
      rotulo: textoObrigatorioSimples(obj.rotulo) || "Link",
      url,
      descricao: textoNulo(obj.descricao),
    })
  }

  return {
    data: {
      titulo,
      projeto,
      data,
      local: textoNulo(input.local),
      status,
      resumoCurto: textoNulo(input.resumoCurto),
      resumoDetalhado: textoNulo(input.resumoDetalhado),
      resumoItensAcao: textoNulo(input.resumoItensAcao),
      transcricao: textoNulo(input.transcricao),
      videoUrl,
      ata: textoNulo(input.ata),
      pautas,
      participantes: participantes.map((p) => ({
        nome: p.nome,
        empresa: p.empresa ?? null,
        papel: p.papel ?? null,
      })),
      encaminhamentos: encaminhamentosValidados,
      links,
    },
  }
}