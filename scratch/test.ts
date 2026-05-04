import { z } from "zod";

const briefingTecelagemSchema = z.object({
  comercial: z.object({
    targetPreco: z.enum(["ECONOMICO", "INTERMEDIARIO", "PREMIUM"], {
      required_error: "Selecione o target de preço",
      invalid_type_error: "Selecione o target de preço",
    }),
    quantidadeEstimada: z.string().optional(),
    prazoEntrega: z.string().optional(),
    observacoes: z.string().optional(),
  }),
});

const data = {
  comercial: {
    targetPreco: "PREMIUM",
    quantidadeEstimada: "",
    prazoEntrega: "30 dias",
    observacoes: ""
  }
};

const result = briefingTecelagemSchema.safeParse(data);
console.log(JSON.stringify(result, null, 2));
