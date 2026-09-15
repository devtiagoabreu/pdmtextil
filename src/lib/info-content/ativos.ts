import type { InfoContent } from "./types"

export const ativosContent: Record<string, InfoContent> = {
  "/ativos": {
    title: "Ativos e Vistorias",
    description:
      "Gestão de ativos, vistorias periódicas e conformidade. Cadastre ativos, categorize por setor, crie tipos de vistoria com checklist, planeje vistorias periódicas e acompanhe o status de execução.",
    rules: [
      "Qualquer usuário autenticado pode visualizar ativos, vistorias e dashboard.",
      "Criar e editar ativos, categorias, tipos de vistoria e planos exige perfil de escrita.",
      "Excluir registros é restrito a Admin e Sudo.",
      "Vistorias vinculadas a um plano geram ocorrências automáticas conforme a periodicidade.",
      "Ao excluir um tipo de vistoria, os planos vinculados são removidos automaticamente (ON DELETE CASCADE).",
      "Ao excluir um plano, o histórico de vistorias concluídas é mantido.",
    ],
    fields: [
      { name: "Ativo", desc: "Equipamento ou item com código, nome, categoria e status" },
      { name: "Categoria", desc: "Agrupamento por setor (Segurança, Mecânica, Elétrica, etc.)" },
      { name: "Tipo de Vistoria", desc: "Modelo de inspeção com periodicidade e checklist" },
      { name: "Plano de Vistoria", desc: "Vínculo ativo × tipo, definindo periodicidade e responsável" },
      { name: "Vistoria", desc: "Ocorrência agendada ou manual, com resultado e evidências" },
    ],
    examples: [
      {
        title: "Cadastrar um extintor",
        desc: "Crie um ativo com código, vincule à categoria Segurança Contra Incêndio e ao tipo 'Extintor de Incêndio (Mensal)'. O plano gera vistorias mensais automaticamente.",
      },
      {
        title: "Concluir uma vistoria",
        desc: "Na Agenda de Vistorias, clique 'Executar' na vistoria pendente, preencha o checklist com conformidade e observe que o plano avança automaticamente para a próxima data.",
      },
    ],
  },
  "/ativos/dashboard": {
    title: "Dashboard de Ativos",
    description:
      "Visão consolidada: totais de ativos, vistorias pendentes e atrasadas, conclusões no mês e compliance por setor.",
    rules: [
      "O dashboard é somente leitura — para executar vistorias, acesse a Agenda.",
      "Vistorias atrasadas são aquelas com data programada no passado e status diferente de Concluída ou Cancelada.",
    ],
  },
  "/ativos/vistorias": {
    title: "Agenda de Vistorias",
    description:
      "Tela central de uso diário. Filtre por status, setor ou ativo. Vistorias atrasadas aparecem destacadas em vermelho.",
    rules: [
      "Vistorias PENDENTE ou EM_ANDAMENTO podem ser executadas via botão 'Executar'.",
      "Ao concluir, o plano de vistoria avança automaticamente para a próxima data.",
      "Vistorias manuais (sem plano) são permitidas e não geram ocorrências futuras.",
      "O resultado é determinado automaticamente pelas respostas do checklist.",
    ],
  },
}