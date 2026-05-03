import * as z from "zod";

export const dadosComerciaisSchema = z.object({
  tipo: z.enum(["DESENVOLVIMENTO_TECELAGEM", "DESENVOLVIMENTO_BENEFICIAMENTO"], {
    required_error: "O tipo de solicitação é obrigatório",
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

export const briefingTecelagemSchema = z.object({
  aplicacao: z.object({
    segmentos: z.array(z.string()).min(1, "Selecione pelo menos um segmento"),
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
    tipoTecido: z.enum(["PLANO", "JACQUARD", "MALHA"], {
      required_error: "Selecione o tipo de tecido",
    }),
  }),

  tecnologias: z.object({
    requeridas: z.array(z.string()).optional(),
    outrasTecnologias: z.string().optional(),
  }),

  performance: z.object({
    resistenciaAbrasao: z.enum(["BAIXA", "MEDIA", "ALTA", "MUITO_ALTA"], {
      required_error: "Selecione resistência à abrasão",
    }),
    resistenciaLavagem: z.boolean().default(false),
    resistenciaSecagem: z.boolean().default(false),
    resistenciaPassagem: z.boolean().default(false),
    outrasPerformances: z.array(z.string()).optional(),
  }),

  acabamento: z.object({
    tipos: z.array(z.string()).min(1, "Selecione pelo menos um tipo de acabamento"),
    nivelBrilho: z.enum(["FOSCO", "SEMI_FOSCO", "BRILHANTE", "ALTO_BRILHO"], {
      required_error: "Selecione o nível de brilho",
    }),
    toque: z.enum(["SECO", "MACIO", "SUAVE", "ESTRUTURADO"], {
      required_error: "Selecione o toque desejado",
    }),
    textura: z.string().optional(),
  }),

  cores: z.object({
    tipo: z.enum(["SOLIDAS", "ESTAMPADAS", "FANTASIA", "DESENVOLVIMENTO_EXCLUSIVO"], {
      required_error: "Selecione o padrão de cores",
    }),
    paletaPreferencial: z.string().optional(),
    coresEspecificas: z.string().optional(),
    lavabilidadeCores: z.string().optional(),
  }),

  comercial: z.object({
    targetPreco: z.enum(["ECONOMICO", "INTERMEDIARIO", "PREMIUM"], {
      required_error: "Selecione o target de preço",
    }),
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