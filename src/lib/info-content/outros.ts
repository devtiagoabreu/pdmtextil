import type { InfoContent } from "./types"

export const outrosContent: Record<string, InfoContent> = {
  "/amostras": {
    title: "Amostras de Desenvolvimento",
    description: "Lista central de todas as amostras de desenvolvimento (tecido cru e acabamento) registradas no sistema.",
    rules: [
      "Amostras são vinculadas a um produto ou a um acabamento específico.",
      "Cada amostra passa por um fluxo de aprovação com status configuráveis.",
      "O histórico de status é registrado automaticamente para auditoria.",
      "Amostras aprovadas podem ser usadas como referência para produção.",
    ],
  },
  "/amostras/kanban": {
    title: "Kanban — Amostras de Desenvolvimento",
    description: "Kanban de amostras para visualizar e mover amostras entre colunas de status.",
    rules: [
      "Arraste os cards para mover amostras entre status.",
      "Cada coluna representa um status do fluxo de amostras.",
      "Apenas perfis autorizados podem mover amostras entre colunas.",
      "Amostras de tecido cru e acabamento aparecem juntas no kanban.",
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
