import * as z from "zod";

// --- DADOS COMERCIAIS (Passo 1) ---
export const dadosComerciaisSchema = z.object({
  tipo: z.enum(["DESENVOLVIMENTO_TECELAGEM", "DESENVOLVIMENTO_BENEFICIAMENTO"], {
    required_error: "O tipo de solicitação é obrigatório",
  }),
  cliente: z.string().min(3, "O nome do cliente é obrigatório"),
  cnpj: z.string().optional(),
  projeto: z.string().optional(),
  prazoDesejado: z.string().optional(), // Pode ser tipado como date depois se usar DatePicker
});

export type DadosComerciais = z.infer<typeof dadosComerciaisSchema>;

// --- BRIEFING TÉCNICO (Passo 2) ---
export const briefingTecelagemSchema = z.object({
  // Seção 1: Uso Final
  usoFinal: z.object({
    tipoUniforme: z.enum([
      "OPERACIONAL_PESADO",
      "PROFISSIONAL_TECNICO",
      "CORPORATIVO",
      "ESPORTIVO_ATIVO",
      "SAUDE_HOSPITALAR",
    ], { required_error: "Selecione o tipo de uniforme" }),
    ambiente: z.array(z.string()).min(1, "Selecione o ambiente de uso"),
    temperatura: z.enum([
      "CALOR_INTENSO",
      "AMBIENTE_CONTROLADO",
      "FRIO",
      "VARIADO",
    ], { required_error: "Selecione a temperatura" }),
    condicoesEspeciais: z.array(z.string()).optional(),
    abrasao: z.enum(["BAIXA", "MEDIA", "ALTA"], {
      required_error: "Selecione a resistência à abrasão",
    }),
  }),

  // Seção 2: Performance
  performance: z.object({
    caracteristicas: z.array(z.string()).min(1, "Selecione pelo menos uma característica"),
    lavagem: z.string().optional(),
  }),

  // Seção 3: Gramatura
  gramatura: z.enum(["LEVE", "MEDIO", "PESADO"], {
    required_error: "Selecione a faixa de gramatura",
  }),

  // Seção 4: Toque
  toque: z.enum(["TECNICO_SECO", "MACIO_CONFORTO", "ESTRUTURADO"], {
    required_error: "Selecione o toque desejado",
  }),

  // Seção 5: Visual
  visual: z.object({
    acabamento: z.enum(["FOSCO", "LEVEMENTE_BRILHANTE", "ALTO_BRILHO"], {
      required_error: "Selecione o acabamento",
    }),
    estilo: z.enum(["ESPORTIVO", "SOCIAL", "TECNICO", "CASUAL"], {
      required_error: "Selecione o estilo",
    }),
  }),

  // Seção 6: Composição
  composicao: z.object({
    urdume: z.string().optional(),
    trama: z.string().optional(),
    elastano: z.boolean().default(false),
  }),

  // Seção 7: Cores
  cores: z.object({
    tipo: z.enum(["SOLIDAS", "DESENVOLVIMENTO_EXCLUSIVO"], {
      required_error: "Selecione o padrão de cores",
    }),
    observacoes: z.string().optional(),
  }),

  // Seção 8: Preço
  preco: z.enum(["ECONOMICO", "INTERMEDIARIO", "PREMIUM"], {
    required_error: "Selecione o target de preço",
  }),
});

export type BriefingTecelagem = z.infer<typeof briefingTecelagemSchema>;

// --- SOLICITAÇÃO COMPLETA (Submit) ---
export const solicitacaoCompletaSchema = z.object({
  ...dadosComerciaisSchema.shape,
  briefing: briefingTecelagemSchema,
  // anexos e links serão tratados separadamente por enquanto
});

export type SolicitacaoCompleta = z.infer<typeof solicitacaoCompletaSchema>;
