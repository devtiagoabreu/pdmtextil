import * as z from "zod";

export const dadosComerciaisSchema = z.object({
  tipo: z.enum(["DESENVOLVIMENTO_TECELAGEM", "DESENVOLVIMENTO_BENEFICIAMENTO"], {
    required_error: "O tipo de solicitação é obrigatório",
    invalid_type_error: "O tipo de solicitação é inválido",
  }),
  cliente: z.string().min(1, "Selecione ou digite um cliente"),
  cnpj: z.string().optional(),
  projeto: z.string().optional(),
  prazoDesejado: z.string().optional(),
});

export type DadosComerciais = z.infer<typeof dadosComerciaisSchema>;

export const SEGMENTOS = [
  "UNIFORME_CORPORATIVO",
  "LENCOL_HOSPITALAR",
  "LENCOL_CAMA_RESIDENCIAL",
  "ROUPA_INTIMA",
  "ROUPA_BANHO",
  "ROUPA_MODA",
  "CALCADO",
  "LINHA_MESA",
  "COLCHAO",
  "FORRO_MODA",
  "ESTOFADO_MOVEIS",
  "CORTINA",
  "BAG",
  "ACESSORIOS",
  "DECORACAO",
  "INDUSTRIAL",
  "OUTROS",
] as const;

export const TECNOLOGIAS = [
  "ANTIBACTERIANO",
  "ANTIFLAMAS",
  "ANTIODOR",
  "ANTI_PILLING",
  "PROTECAO_UV",
  "RESPIRABILIDADE",
  "SECAGEM_RAPIDA",
  "TERMOREGULACAO",
  "IMPERMEAVEL",
  "RESISTENTE_ABRASÃO",
  "SOFT_TOUCH",
  "HYDRARE",
  "OUTROS",
] as const;

export const TIPO_FIBRA = [
  "POLIESTER",
  "ALGODAO",
  "LINHO",
  "VISCOSE",
  "MODAL",
  "ACRILICO",
  "NYLON",
  "LINHA_RECICLADA",
  "ORGANICO",
  "OUTROS",
] as const;

export const LIGAMENTO = [
  "TAFETAN",
  "SARJA",
  "RIBANA",
  "CETIM",
  "OXFORD",
  "DOBRADINHA",
  "MALHA",
  "OUTROS",
] as const;

export const TIPOS_ACABAMENTO = [
  "SANFORIZADO",
  "MERCERIZADO",
  "RESINADO",
  "AMACIADO",
  "ESFOLHADO",
  "BRILHO",
  "FOSCO",
  "TEXTURIZADO",
  "ESTAMPADO",
  "TINGIDO",
  "OUTROS",
] as const;

export const SEGMENTOS_LABELS: Record<string, string> = {
  UNIFORME_CORPORATIVO: "Uniforme Corporativo",
  LENCOL_HOSPITALAR: "Lençol Hospitalar",
  LENCOL_CAMA_RESIDENCIAL: "Lençol de Cama Residencial",
  ROUPA_INTIMA: "Roupa Íntima",
  ROUPA_BANHO: "Roupa de Banho",
  ROUPA_MODA: "Roupa Moda",
  CALCADO: "Calçado",
  LINHA_MESA: "Linha de Mesa",
  COLCHAO: "Colchão",
  FORRO_MODA: "Forro de Moda",
  ESTOFADO_MOVEIS: "Estofado de Móveis",
  CORTINA: "Cortina",
  BAG: "Bag / Bolsas",
  ACESSORIOS: "Acessórios",
  DECORACAO: "Decoração",
  INDUSTRIAL: "Industrial",
  OUTROS: "Outros",
}

export const TECNOLOGIAS_LABELS: Record<string, string> = {
  ANTIBACTERIANO: "Antibacteriano",
  ANTIFLAMAS: "Antiflamas",
  ANTIODOR: "Antiodor",
  ANTI_PILLING: "Anti-pilling",
  PROTECAO_UV: "Proteção UV",
  RESPIRABILIDADE: "Respirabilidade",
  SECAGEM_RAPIDA: "Secagem Rápida",
  TERMOREGULACAO: "Termorregulação",
  IMPERMEAVEL: "Impermeável",
  RESISTENTE_ABRASÃO: "Resistente à Abrasão",
  SOFT_TOUCH: "Soft Touch",
  HYDRARE: "HydraRe",
  OUTROS: "Outros",
}

export const LIGAMENTO_LABELS: Record<string, string> = {
  TAFETAN: "Taftan",
  SARJA: "Sarja",
  RIBANA: "Ribana",
  CETIM: "Cetim",
  OXFORD: "Oxford",
  DOBRADINHA: "Dobradinha",
  MALHA: "Malha",
  OUTROS: "Outros",
}

export const TIPOS_ACABAMENTO_LABELS: Record<string, string> = {
  SANFORIZADO: "Sanforizado",
  MERCERIZADO: "Mercerizado",
  RESINADO: "Resinado",
  AMACIADO: "Amaciado",
  ESFOLHADO: "Esfoliado",
  BRILHO: "Brilho",
  FOSCO: "Fosco",
  TEXTURIZADO: "Texturizado",
  ESTAMPADO: "Estampado",
  TINGIDO: "Tingido",
  OUTROS: "Outros",
}

export const TIPO_FIBRA_LABELS: Record<string, string> = {
  POLIESTER: "Poliéster",
  ALGODAO: "Algodão",
  LINHO: "Linho",
  VISCOSE: "Viscose",
  MODAL: "Modal",
  ACRILICO: "Acrílico",
  NYLON: "Nylon",
  LINHA_RECICLADA: "Linha Reciclada",
  ORGANICO: "Orgânico",
  OUTROS: "Outros",
}

export const briefingTecelagemSchema = z.object({
  produtoBase: z.string().optional(),
  codProduto: z.string().optional(),
  nomeCor: z.string().optional(),
  pantone: z.string().optional(),
  amostraDesenvolver: z.string().optional(),
  observacoes: z.string().optional(),

  aplicacao: z.object({
    segmentos: z.array(z.string()).optional(),
    outrosSegmentos: z.string().optional(),
    descricaoAplicacao: z.string().optional(),
  }),

  requisitosTecnicos: z.object({
    composicao: z.string().optional(),
    tipoFibra: z.array(z.string()).optional(),
    larguraMinima: z.number().optional(),
    larguraMaxima: z.number().optional(),
    gramaturaMinima: z.number().optional(),
    gramaturaMaxima: z.number().optional(),
    densidadeUrdume: z.string().optional(),
    densidadeTrama: z.string().optional(),
    ligamento: z.string().optional(),
    tipoTecido: z.string().optional(),
  }),

  tecnologias: z.object({
    requeridas: z.array(z.string()).optional(),
    outrasTecnologias: z.string().optional(),
  }),

  performance: z.object({
    resistenciaAbrasao: z.string().optional(),
    resistenciaLavagem: z.boolean().default(false),
    resistenciaSecagem: z.boolean().default(false),
    resistenciaPassagem: z.boolean().default(false),
    outrasPerformances: z.string().optional(),
  }),

  acabamento: z.object({
    tipos: z.array(z.string()).optional(),
    nivelBrilho: z.string().optional(),
    toque: z.string().optional(),
    textura: z.string().optional(),
  }),

  cores: z.object({
    tipo: z.string().optional(),
    paletaPreferencial: z.string().optional(),
    coresEspecificas: z.string().optional(),
    lavabilidadeCores: z.string().optional(),
  }),

  comercial: z.object({
    targetPreco: z.string().optional(),
    quantidadeEstimada: z.string().optional(),
    prazoEntrega: z.string().optional(),
    observacoes: z.string().optional(),
  }),
});

export type BriefingTecelagem = z.infer<typeof briefingTecelagemSchema>;

export const solicitacaoCompletaSchema = z.object({
  ...dadosComerciaisSchema.shape,
  briefing: briefingTecelagemSchema,
});

export type SolicitacaoCompleta = z.infer<typeof solicitacaoCompletaSchema>;