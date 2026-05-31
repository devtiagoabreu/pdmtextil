import type { InfoContent } from "./types"

export const outrosContent: Record<string, InfoContent> = {
  "/amostras": {
    title: "Amostras",
    description: "Lista central de todas as amostras de tecido cru e acabamento registradas no sistema.",
    rules: [
      "Amostras são vinculadas a um produto cru ou a um acabamento específico.",
      "Cada amostra passa por um fluxo de aprovação: PENDENTE → APROVADO ou REPROVADO.",
      "O histórico de status é registrado automaticamente para auditoria.",
      "Amostras aprovadas podem ser usadas como referência para produção.",
    ],
  },
  "/perfil": {
    title: "Meu Perfil",
    description: "Visualização e edição dos seus dados de usuário, incluindo nome, email e senha.",
    rules: [
      "Você pode alterar seu nome, email e senha.",
      "O email deve ser único no sistema.",
      "A alteração de senha requer confirmação da senha atual.",
    ],
  },
}
