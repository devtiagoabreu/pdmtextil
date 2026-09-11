import type { InfoContent } from "./types"

export const reunioesContent: Record<string, InfoContent> = {
  "/reunioes": {
    title: "Reuniões",
    description:
      "Registro central de reuniões internas e de projetos (Systêxtil, Bling), com pauta, participantes, encaminhamentos, links, atas e gravações.",
    rules: [
      "Qualquer usuário autenticado pode visualizar a lista e o detalhe das reuniões.",
      "Criar e editar reuniões exige perfil de escrita (Admin, Sudo, Desenvolvimento, Comercial ou CRM).",
      "Excluir reuniões é restrito a Admin e Sudo.",
      "Ao editar, pauta, participantes, encaminhamentos e links vinculados são substituídos pelos novos valores informados.",
      "Encaminhamentos sem descrição e links sem URL são descartados ao salvar.",
      "Uma reunião sem título ou sem data/hora não pode ser salva.",
      "O status do encaminhamento pode ser Pendente, Em andamento ou Concluído.",
    ],
    fields: [
      { name: "Título", desc: "Nome da reunião (obrigatório)" },
      { name: "Projeto", desc: "Systêxtil, Bling, Interna ou Outros" },
      { name: "Data/hora", desc: "Quando a reunião aconteceu ou acontecerá (obrigatório)" },
      { name: "Local", desc: "Sala física ou link de reunião (opcional)" },
      { name: "Status", desc: "Agendada, Realizada ou Cancelada" },
      { name: "Pauta", desc: "Itens a serem discutidos (uma linha por item)" },
      { name: "Participantes", desc: "Nome, empresa e papel de cada participante" },
      { name: "Encaminhamentos", desc: "Ações com responsável, prazo e status" },
      { name: "Links", desc: "Materiais, documentos e referências com rótulo, URL e descrição" },
      { name: "Ata / Resumos", desc: "Registros textuais da reunião" },
      { name: "Vídeo", desc: "Link para a gravação da reunião (opcional)" },
    ],
    examples: [
      {
        title: "Rodada de release",
        desc: "Crie a reunião com projeto Systêxtil, adicione os itens da pauta, liste os participantes e defina os encaminhamentos com responsável e prazo.",
      },
      {
        title: "Reunião interna cancelada",
        desc: "Altere o status para Cancelada para manter o histórico sem contar como realizada.",
      },
    ],
  },
  "/reunioes/projetos": {
    title: "Projetos de Reuniões",
    description:
      "Cadastro de projetos usados nas reuniões (Systêxtil, Bling, Interna, Outros e qualquer novo projeto da empresa), com datas de início/fim, status e cor.",
    rules: [
      "Qualquer usuário autenticado pode visualizar a lista de projetos.",
      "Criar e editar projetos exige perfil de escrita (Admin, Sudo, Desenvolvimento, Comercial ou CRM).",
      "Excluir projetos é restrito a Admin e Sudo.",
      "Não é possível excluir o projeto padrão (Interna) nem um projeto que tenha reuniões vinculadas.",
      "O nome do projeto é obrigatório e não pode se repetir (comparação sem diferenciar maiúsculas).",
      "A data de fim não pode ser anterior à data de início.",
      "O status do projeto pode ser Em andamento, Encerrado ou Planejado.",
    ],
    fields: [
      { name: "Nome", desc: "Nome do projeto (obrigatório e único)" },
      { name: "Descrição", desc: "Objetivo ou contexto do projeto (opcional)" },
      { name: "Data de início / fim", desc: "Período planejado ou executado do projeto (opcional)" },
      { name: "Status", desc: "Em andamento, Encerrado ou Planejado" },
      { name: "Cor", desc: "Cor de identificação do projeto no formato #RRGGBB (opcional)" },
      { name: "Ativo", desc: "Se desmarcado, o projeto segue no histórico mas deixa de aparecer como padrão" },
    ],
    examples: [
      {
        title: "Projeto Systêxtil",
        desc: "O cadastro inicial traz Interna, Systêxtil, Bling e Outros. Renomeie, ajuste datas e crie novos projetos conforme a demanda.",
      },
    ],
  },
}