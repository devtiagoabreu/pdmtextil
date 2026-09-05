import { rejeitarNome, negou, confirmou, parseLinhas, linhasNomes, pareceNome, detectarTipo, extrairDoc, extrairNomeDaResposta, ehSaudacao } from "./validation"

export interface MaquinaEstadoResult {
  nextEstado: string
  dados: Record<string, any>
  resposta?: string
  finalizado: boolean
  enviarCatalogo?: number[]
  needsCnpjLookup?: boolean
}

export function maquinaEstados(
  curEstado: string,
  curDados: Record<string, any>,
  msgOriginal: string,
  aiResponse: string,
  linhaMap: Record<number, string>,
  maxNumero: number,
  linhasSugeridas?: number[]
): MaquinaEstadoResult {
  const msg = msgOriginal.toLowerCase().trim()
  let nextEstado = curEstado
  const dados = JSON.parse(JSON.stringify(curDados))
  let enviarCatalogo: number[] | undefined
  let needsCnpjLookup: boolean | undefined
  const MAX_TENTATIVAS = 3

  // Saudação em etapas de coleta não avança o fluxo nem conta como tentativa inválida
  // (evita que um cliente que já foi atendido e apenas cumprimenta seja bloqueado).
  if (ehSaudacao(msgOriginal) && (curEstado.startsWith("COLETANDO_") || curEstado.startsWith("CONFIRMANDO_"))) {
    return { nextEstado: curEstado, dados, finalizado: !!dados.finalizado }
  }

  dados._tentativas = (dados._tentativas || 0) + 1

  if (curEstado === "SAUDACAO") {
    const nomeDetectado = extrairNomeDaResposta(msgOriginal)
    if (nomeDetectado) {
      dados.nome = nomeDetectado
      nextEstado = "COLETANDO_DOC"
      dados._tentativas = 0
    } else {
      nextEstado = "COLETANDO_NOME"
    }
  } else if (curEstado === "COLETANDO_NOME") {
    const rejeitado = rejeitarNome(msgOriginal)
    if (!rejeitado && msgOriginal.length > 2 && pareceNome(msgOriginal)) {
      dados.nome = msgOriginal
      nextEstado = "COLETANDO_DOC"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "nome_invalido_repetido"
    }
  } else if (curEstado === "COLETANDO_DOC") {
    const tipoEscolhido = detectarTipo(msg)
    const doc = extrairDoc(msgOriginal, tipoEscolhido || dados.tipoPessoa)

    if (tipoEscolhido) dados.tipoPessoa = tipoEscolhido
    if (doc) dados.documento = doc.doc
    if (!dados.tipoPessoa && doc) dados.tipoPessoa = doc.tipo
    if (!dados.nome && pareceNome(msgOriginal) && !rejeitarNome(msgOriginal) && msgOriginal.length < 50) {
      dados.nome = msgOriginal
    }

    const hasTipo = !!dados.tipoPessoa
    const hasDoc = !!dados.documento

    if (hasTipo && hasDoc && dados.tipoPessoa === "PJ") {
      dados.tipoPessoa = "PJ"
      needsCnpjLookup = true
      nextEstado = "CONFIRMANDO_DADOS_CNPJ"
      dados._tentativas = 0
    } else if (hasTipo && hasDoc) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (hasDoc && !hasTipo) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "doc_invalido_repetido"
    }
  } else if (curEstado === "CONFIRMANDO_DADOS_CNPJ") {
    if (confirmou(msg)) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (negou(msg)) {
      dados.documento = undefined
      dados._cnpjConsulta = undefined
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    }
  } else if (curEstado === "COLETANDO_INTERESSE") {
    const linhas = parseLinhas(msgOriginal, maxNumero)
    const temNomeLinha = linhas.map((n: any) => linhaMap[n]?.toLowerCase() || "").some((nome: any) => msg.includes(nome))
    const escolhidas = linhas.length > 0 ? linhas : (linhasSugeridas && linhasSugeridas.length > 0 ? linhasSugeridas : [])
    if (escolhidas.length > 0 || temNomeLinha) {
      dados.linhasInteresse = escolhidas
      dados.linhasInteresseNomes = linhasNomes(escolhidas, linhaMap)
      nextEstado = "CONFIRMACAO"
      dados._tentativas = 0
    } else if (msg.match(/\b(todos|todas|tudo|qualquer|tanto faz|indiferente|foda-se|se foda)\b/)) {
      dados.linhasInteresse = Object.keys(linhaMap).map(Number)
      dados.linhasInteresseNomes = linhasNomes(dados.linhasInteresse, linhaMap)
      nextEstado = "CONFIRMACAO"
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "interesse_invalido_repetido"
    }
  } else if (curEstado === "CONFIRMACAO") {
    if (confirmou(msg)) {
      nextEstado = "ENCERRADO"
      dados.finalizado = true
      enviarCatalogo = dados.linhasInteresse || []
      dados._tentativas = 0
    } else if (negou(msg)) {
      nextEstado = "COLETANDO_NOME"
      dados.nome = undefined
      dados.documento = undefined
      dados.tipoPessoa = undefined
      dados.linhasInteresse = undefined
      dados.linhasInteresseNomes = undefined
      dados._tentativas = 0
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "confirmacao_invalida_repetido"
    }
  } else if (curEstado === "ENCERRADO") {
    dados.finalizado = true
  }

  return { nextEstado, dados, finalizado: !!dados.finalizado, enviarCatalogo, needsCnpjLookup }
}

