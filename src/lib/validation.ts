import { NextResponse } from "next/server"
import { z } from "zod"

export function validateRequest<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    const message = firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "Dados inválidos"
    return { error: NextResponse.json({ error: message, details: result.error.flatten() }, { status: 400 }) }
  }
  return { data: result.data }
}

const linkSchema = z.object({
  url: z.string().url("URL inválida"),
  descricao: z.string().default(""),
})

const idIntegracaoSchema = z.string().max(100).optional().nullable()

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  cnpj: z.string().trim().min(1, "CNPJ é obrigatório"),
  razaoSocial: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Email inválido").optional().nullable().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().nullable(),
  contato: z.string().trim().max(100).optional().nullable(),
  endereco: z.string().trim().max(300).optional().nullable(),
  cidade: z.string().trim().max(100).optional().nullable(),
  uf: z.string().trim().length(2, "UF deve ter 2 caracteres").optional().nullable(),
  idIntegracao: idIntegracaoSchema,
})

export const representanteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  cnpj: z.string().trim().min(1, "CNPJ é obrigatório"),
  razaoSocial: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Email inválido").optional().nullable().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().nullable(),
  contato: z.string().trim().max(100).optional().nullable(),
  endereco: z.string().trim().max(300).optional().nullable(),
  cidade: z.string().trim().max(100).optional().nullable(),
  uf: z.string().trim().length(2, "UF deve ter 2 caracteres").optional().nullable(),
  gerenteId: z.number().int().positive().optional().nullable(),
  idIntegracao: idIntegracaoSchema,
})

export const produtoCruSchema = z.object({
  codigoPdm: z.string().trim().min(1, "Código PDM é obrigatório").max(30),
  descricao: z.string().trim().min(1, "Descrição é obrigatória").max(500),
  solicitacaoDesenvolvimentoId: z.number().int().positive().optional().nullable(),
  status: z.enum(["DESENVOLVIMENTO", "APROVADO", "REPROVADO", "EM_PRODUCAO"]).optional(),
  fichaTecnica: z.object({
    gramatura: z.string().optional(),
    gramaturaLinear: z.string().optional(),
    largura: z.string().optional(),
    passamento: z.string().optional(),
    batidas: z.string().optional(),
    densidade: z.string().optional(),
    ligamento: z.string().optional(),
    qtdeFiosUrdume: z.string().optional(),
    observacoes: z.string().optional(),
  }).optional().nullable(),
  links: z.array(linkSchema).optional(),
  ativo: z.boolean().optional(),
  idIntegracaoErpCru: z.string().max(100).optional().nullable(),
  idIntegracao: idIntegracaoSchema,
})

export const fioSchema = z.object({
  codigoCompleto: z.string().trim().min(1, "Código completo é obrigatório").max(30),
  codigoFio: z.string().trim().min(1, "Código do fio é obrigatório").max(10),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  nomeComercial: z.string().trim().max(200).optional().nullable(),
  composicao: z.string().trim().max(200).optional().nullable(),
  titulo: z.string().trim().max(20).optional().nullable(),
  titulagemReal: z.string().trim().max(20).optional().nullable(),
  ncm: z.string().trim().max(10).optional().nullable(),
  torcao: z.string().trim().max(20).optional().nullable(),
  resistencia: z.number().positive().optional().nullable(),
  alongamento: z.number().min(0).max(100).optional().nullable(),
  links: z.array(linkSchema).optional(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  idIntegracao: idIntegracaoSchema,
})

export const solicitacaoSchema = z.object({
  tipo: z.string().trim().min(1, "Tipo de solicitação é obrigatório").max(30),
  cliente: z.string().trim().min(1, "Cliente é obrigatório").max(200),
  cnpj: z.string().trim().optional().nullable(),
  projeto: z.string().trim().max(200).optional().nullable(),
  prazoDesejado: z.string().optional().nullable(),
  briefing: z.any().optional(),
})

const requisicaoCorteItemSchema = z.object({
  codigoProduto: z.string().optional().nullable(),
  ordem: z.string().optional().nullable(),
  artigo: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  desenho: z.string().optional().nullable(),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
})

export const requisicaoCorteSchema = z.object({
  itens: z.array(requisicaoCorteItemSchema).min(1, "Adicione pelo menos um item"),
  observacoes: z.string().optional().nullable(),
  entreguePor: z.string().optional().nullable(),
})

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cnpj: z.string().trim().max(18).optional().nullable(),
  razaoSocial: z.string().trim().max(250).optional().nullable(),
  email: z.string().trim().email("Email inválido").optional().nullable().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().nullable(),
  contato: z.string().trim().max(100).optional().nullable(),
  endereco: z.string().trim().max(300).optional().nullable(),
  cidade: z.string().trim().max(100).optional().nullable(),
  uf: z.string().trim().length(2, "UF deve ter 2 caracteres").optional().nullable(),
  ativo: z.boolean().optional(),
  idIntegracao: idIntegracaoSchema,
})

export const baseUrdumeSchema = z.object({
  codigoCompleto: z.string().trim().min(1, "Código completo é obrigatório").max(30),
  codigoBase: z.string().trim().min(1, "Código da base é obrigatório").max(10),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional().nullable(),
  densidade: z.number().positive().optional().nullable(),
  tratamento: z.string().max(100).optional().nullable(),
  tensaoUrdume: z.number().positive().optional().nullable(),
  largura: z.number().positive().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  idIntegracao: idIntegracaoSchema,
})

export const produtoQuimicoSchema = z.object({
  codigo: z.string().trim().min(1, "Código é obrigatório").max(50),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().optional().nullable(),
  categoria: z.string().max(100).optional().nullable(),
  unidadePadrao: z.string().max(20).optional().default("kg"),
  tipo: z.string().max(50).optional().nullable(),
  concentracao: z.string().max(50).optional().nullable(),
  densidade: z.number().positive().optional().nullable(),
  ph: z.number().min(0).max(14).optional().nullable(),
  observacoes: z.string().optional().nullable(),
  fichaSeguranca: z.string().max(500).optional().nullable(),
  idIntegracao: idIntegracaoSchema,
  ativo: z.boolean().optional(),
})

export const usuarioSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.string().min(1, "Role é obrigatória"),
})

export const emailListaSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
})

export const emailModeloSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  assunto: z.string().trim().min(1, "Assunto é obrigatório").max(500),
  corpo: z.string().min(1, "Corpo é obrigatório"),
})

export const integracaoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  tipo: z.string().trim().min(1, "Tipo é obrigatório").max(50),
  config: z.record(z.unknown()).optional(),
  ativo: z.boolean().optional(),
})
