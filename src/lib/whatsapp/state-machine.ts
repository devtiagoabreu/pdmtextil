import { rejeitarNome, negou, confirmou, parseLinhas, linhasNomes, pareceNome, detectarTipo, extrairDoc } from "./validation"

export interface MaquinaEstadoResult {
  nextEstado: string
  dados: Record<string, any>
  resposta?: string
  finalizado: boolean
  enviarCatalogo?: number[]
  needsCnpjLookup?: boolean
  redirecionarPf?: boolean
}

export function maquinaEstados(
  curEstado: string,
  curDados: Record<string, any>,
  msgOriginal: string,
  aiResponse: string,
  linhaMap: Record<number, string>,
  maxNumero: number
): MaquinaEstadoResult {
  const msg = msgOriginal.toLowerCase().trim()
  let nextEstado = curEstado
  const dados = JSON.parse(JSON.stringify(curDados))
  let enviarCatalogo: number[] | undefined
  let needsCnpjLookup: boolean | undefined
  let redirecionarPf: boolean | undefined

  dados._tentativas = (dados._tentativas || 0) + 1
  const MAX_TENTATIVAS = 3

  if (curEstado === "SAUDACAO") {
    nextEstado = "COLETANDO_NOME"
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
    const doc = extrairDoc(msgOriginal)

    if (tipoEscolhido) dados.tipoPessoa = tipoEscolhido
    if (doc) dados.documento = doc.doc
    if (!dados.tipoPessoa && doc) dados.tipoPessoa = doc.tipo
    if (!dados.nome && pareceNome(msgOriginal) && msgOriginal.length < 50) {
      dados.nome = msgOriginal
    }

    if (tipoEscolhido === "PF" && doc && doc.tipo === "PJ") {
      nextEstado = "CONFIRMANDO_TIPO_PESSOA"
      dados._tentativas = 0
      dados._docRecebido = doc.doc
    } else if (tipoEscolhido === "PJ" && doc && doc.tipo === "PJ") {
      dados.tipoPessoa = "PJ"
      dados.documento = doc.doc
      needsCnpjLookup = true
      nextEstado = "CONFIRMANDO_DADOS_CNPJ"
      dados._tentativas = 0
    } else if (doc) {
      if (dados.documento || dados.tipoPessoa) {
        nextEstado = "COLETANDO_INTERESSE"
        dados._tentativas = 0
      }
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      dados._bloqueado = true
      dados._motivoBloqueio = "doc_invalido_repetido"
    }
  } else if (curEstado === "CONFIRMANDO_TIPO_PESSOA") {
    if (confirmou(msg)) {
      dados.tipoPessoa = "PJ"
      dados.documento = dados._docRecebido || dados.documento
      needsCnpjLookup = true
      nextEstado = "CONFIRMANDO_DADOS_CNPJ"
      dados._tentativas = 0
    } else if (negou(msg)) {
      redirecionarPf = true
      dados._bloqueado = true
      dados._motivoBloqueio = "recusou_corrigir_tipo"
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      redirecionarPf = true
      dados._bloqueado = true
      dados._motivoBloqueio = "confirmacao_tipo_invalida_repetido"
    }
  } else if (curEstado === "CONFIRMANDO_DADOS_CNPJ") {
    if (confirmou(msg)) {
      nextEstado = "COLETANDO_INTERESSE"
      dados._tentativas = 0
    } else if (negou(msg)) {
      redirecionarPf = true
      dados._bloqueado = true
      dados._motivoBloqueio = "recusou_dados_cnpj"
    } else if (dados._tentativas >= MAX_TENTATIVAS) {
      redirecionarPf = true
      dados._bloqueado = true
      dados._motivoBloqueio = "confirmacao_cnpj_invalida_repetido"
    }
  } else if (curEstado === "COLETANDO_INTERESSE") {
    const linhas = parseLinhas(msgOriginal, maxNumero)
    const temNomeLinha = linhas.map(n => linhaMap[n]?.toLowerCase() || "").some(nome => msg.includes(nome))
    if (linhas.length > 0 || temNomeLinha) {
      dados.linhasInteresse = linhas
      dados.linhasInteresseNomes = linhasNomes(linhas, linhaMap)
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

  return { nextEstado, dados, finalizado: !!dados.finalizado, enviarCatalogo, needsCnpjLookup, redirecionarPf }
}

