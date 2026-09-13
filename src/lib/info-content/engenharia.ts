import type { InfoContent } from "./types"

function campo(title: string, description: string, examples?: { title: string; desc: string }[]): InfoContent {
  return { title, description, examples }
}

export const campoAtivo: InfoContent = campo(
  "Ativo",
  "Se desmarcado, o cadastro deixa de aparecer nas seleções de novas telas, mas os dados não são apagados.",
  [{ title: "Usar inativo", desc: "Para um site que não recebe processos novos, desmarque Ativo e ele deixa de aparecer nas listas de seleção." }]
)

export const campoOrdem: InfoContent = campo(
  "Ordem",
  "Posição do item na sequência de execução. O primeiro item é o número 1, o segundo o 2, e assim por diante.",
  [{ title: "Exemplo", desc: "Ordem 1 → Preparação dos fios; Ordem 2 → Tingimento; Ordem 3 → Acabamento." }]
)

export const campoObservacoes: InfoContent = campo(
  "Observações",
  "Anotações livres que não cabem nos outros campos: detalhes, combinados, particularidades, histórico.",
  [{ title: "Exemplo", desc: "Processo depende da liberação do setor de qualidade antes do envio ao cliente." }]
)

export const campoLinks: InfoContent = campo(
  "Links",
  "Endereços de referência do cadastro (URLs): instruções de trabalho, documentos, vídeos ou sistemas relacionados. Cada link deve ter uma descrição curta do que ele contém.",
  [
    { title: "Instrução de trabalho", desc: "URL da instrução oficial do processo em PDF ou no sistema." },
    { title: "Vídeo de treinamento", desc: "URL do vídeo que mostra a execução da atividade." },
    { title: "Planilha de controle", desc: "URL do arquivo usado para registrar o acompanhamento." },
  ]
)

export const empresaCampos: Record<string, InfoContent> = {
  nome: campo(
    "Nome",
    "Nome da organização que participa do mapeamento. Pode ser a sua própria empresa ou uma parceira (fornecedora, cliente).",
    [
      { title: "PDM Têxtil", desc: "Razão social ou nome fantasia da sua empresa." },
      { title: "Fiação Santa Cláudia", desc: "Exemplo de fornecedora de fios cadastrada para o mapeamento." },
    ]
  ),
  cnpj: campo(
    "CNPJ",
    "Cadastro Nacional da Pessoa Jurídica. Serve para identificar a empresa de forma única; o preenchimento é opcional.",
    [{ title: "00.000.000/0001-00", desc: "Formato com pontos, barra e traço." }]
  ),
  segmento: campo(
    "Segmento",
    "Ramo de atuação da empresa, usado para organizar os cadastros por tipo de negócio.",
    [
      { title: "Têxtil", desc: "Fiação, tecelagem, malharia, beneficiamento e confecção são segmentos do setor têxtil." },
      { title: "Confecção", desc: "Empresa que transforma tecido em peças de vestuário." },
    ]
  ),
  observacoes: campoObservacoes,
  ativo: campoAtivo,
}

export const siteCampos: Record<string, InfoContent> = {
  empresaId: campo(
    "Empresa",
    "Organização à qual a unidade física pertence.",
    [{ title: "PDM Têxtil", desc: "Selecione a empresa antes de cadastrar a unidade." }]
  ),
  nome: campo(
    "Nome",
    "Nome da unidade física onde os processos acontecem: fábrica, planta ou filial.",
    [
      { title: "Unidade PDM Têxtil", desc: "Use um nome que o time reconheça no dia a dia." },
      { title: "Filial Sul", desc: "Quando a empresa tem mais de uma unidade." },
    ]
  ),
  sigla: campo(
    "Sigla",
    "Código curto da unidade, usado para referências rápidas em relatórios e tabelas.",
    [{ title: "PDM", desc: "Sigla de até 10 caracteres." }]
  ),
  cep: campo(
    "CEP",
    "Código de Endereçamento Postal da unidade. Preenchimento opcional.",
    [{ title: "89000-000", desc: "Formato com traço." }]
  ),
  endereco: campo(
    "Endereço",
    "Endereço completo da unidade: rua, número e bairro.",
    [
      { title: "Rua Itajaí, 1500, Centro", desc: "Ajuda a localizar a unidade em mapas e na logística." },
    ]
  ),
  cidade: campo(
    "Cidade",
    "Município em que a unidade está localizada.",
    [{ title: "Blumenau", desc: "Exemplo de cidade com forte polo têxtil." }]
  ),
  uf: campo(
    "UF",
    "Unidade da Federação (sigla do estado) da unidade.",
    [{ title: "SC", desc: "Santa Catarina." }]
  ),
  ativo: campoAtivo,
}

export const areaCampos: Record<string, InfoContent> = {
  siteId: campo(
    "Site",
    "Unidade física à qual o setor ou departamento pertence.",
    [{ title: "Unidade PDM Têxtil", desc: "A área de Tecelagem normalmente pertence à unidade principal." }]
  ),
  nome: campo(
    "Nome",
    "Nome do setor ou departamento onde os processos são executados.",
    [
      { title: "Tecelagem", desc: "Setor que transforma fios em tecido plano." },
      { title: "Almoxarifado", desc: "Setor que recebe e confere matéria-prima." },
      { title: "Engenharia de Processos", desc: "Departamento que documenta os processos." },
    ]
  ),
  descricao: campo(
    "Descrição",
    "Descrição curta da área: o que ela faz e qual é o papel dela na organização.",
    [{ title: "Produção / Tecelagem", desc: "Ex.: responsável por transformar fios em tecido." }]
  ),
  ativo: campoAtivo,
}

export const subprocessoCampos: Record<string, InfoContent> = {
  processoId: campo(
    "Processo",
    "Processo ao qual esta etapa pertence.",
    [{ title: "Tingimento de Malha", desc: "Selecione o processo antes de cadastrar a etapa." }]
  ),
  nome: campo(
    "Nome",
    "Nome da etapa em que o processo é dividido. Prefira nomes curtos e claros.",
    [
      { title: "Preparação dos fios", desc: "Ex.: urdimento, engomagem e passação de fios." },
      { title: "Tingimento", desc: "Etapa de coloração do tecido ou da malha." },
      { title: "Acabamento", desc: "Etapa final de acabamento do produto." },
    ]
  ),
  descricao: campo(
    "Descrição",
    "O que acontece nesta etapa e qual é o objetivo dela dentro do processo.",
    [{ title: "Etapa de preparação", desc: "Ex.: urdimento, engomagem e passação de fios antes do tingimento." }]
  ),
  ordem: campoOrdem,
  links: campoLinks,
  ativo: campoAtivo,
}

export const atividadeCampos: Record<string, InfoContent> = {
  subprocessoId: campo(
    "Subprocesso",
    "Subprocesso ao qual a atividade pertence.",
    [{ title: "Preparação dos fios", desc: "Selecione o subprocesso antes de cadastrar a atividade." }]
  ),
  nome: campo(
    "Nome",
    "Nome da atividade: uma ação concreta e única executada dentro do subprocesso.",
    [
      { title: "Encarar materiais", desc: "Ex.: colocar os rolos de fio na máquina." },
      { title: "Conferir notas", desc: "Ex.: conferir a nota fiscal no recebimento de matéria-prima." },
      { title: "Trocar bobinadeira", desc: "Ex.: troca de equipamento na linha." },
    ]
  ),
  tipo: campo(
    "Tipo",
    "Natureza da atividade: Manual é executada por uma pessoa; Automática por máquina ou sistema; Decisão é um desvio no fluxo (pergunta de sim/não); Espera significa aguardar algo (material, aprovação, máquina).",
    [
      { title: "Manual", desc: "Operador encara materiais na bobinadeira." },
      { title: "Automática", desc: "O sistema emite a nota fiscal automaticamente." },
      { title: "Decisão", desc: "O tecido passou na inspeção? Se sim, segue; se não, volta para o setor." },
      { title: "Espera", desc: "Aguardar a matéria-prima chegar ao setor." },
    ]
  ),
  responsavel: campo(
    "Responsável",
    "Pessoa, cargo, equipe ou máquina que executa a atividade.",
    [
      { title: "Operador de tecelagem", desc: "Quem opera a máquina." },
      { title: "Conferente", desc: "Quem confere a nota no recebimento." },
      { title: "PCP", desc: "Planejamento e Controle da Produção, responsável pelas ordens de produção." },
    ]
  ),
  ordem: campoOrdem,
  links: campoLinks,
  observacoes: campoObservacoes,
  ativo: campoAtivo,
}

export const processoCampos: Record<string, InfoContent> = {
  areaId: campo(
    "Área",
    "Setor ou departamento onde o processo acontece.",
    [{ title: "Tecelagem", desc: "O processo de Tecelagem pertence à área de Tecelagem." }]
  ),
  nome: campo(
    "Nome",
    "Nome do processo. Prefira começar por um verbo no infinitivo, deixando claro o que o processo faz.",
    [
      { title: "Recebimento de Matéria-Prima", desc: "Documenta o recebimento e a conferência de fios e insumos." },
      { title: "Tingimento de Malha", desc: "Documenta a coloração da malha nas cores do pedido." },
      { title: "Beneficiamento de Tecido", desc: "Etapas de acabamento do tecido." },
    ]
  ),
  codigo: campo(
    "Código",
    "Código de referência do processo. Ajuda a localizar o processo em tabelas e relatórios; preenchimento opcional.",
    [
      { title: "PR-001", desc: "Formato simples de numeração sequencial." },
      { title: "PROC-TEC-01", desc: "Outro formato comum em empresas têxteis." },
    ]
  ),
  status: campo(
    "Status",
    "Situação do documento do processo: Rascunho (em elaboração), Em revisão (aguardando validação) ou Aprovado (vigente).",
    [
      { title: "Rascunho", desc: "O processo ainda está sendo escrito." },
      { title: "Em revisão", desc: "O processo foi finalizado e está sendo revisado pelo responsável." },
      { title: "Aprovado", desc: "O processo está validado e é o que vale para o dia a dia." },
    ]
  ),
  versao: campo(
    "Versão",
    "Número da versão do documento do processo. Incremente manualmente sempre que o processo sofrer uma alteração relevante.",
    [
      { title: "1", desc: "Primeira versão aprovada do processo." },
      { title: "2", desc: "Depois de uma alteração relevante no fluxo." },
    ]
  ),
  responsavel: campo(
    "Responsável",
    "Dono do processo: a pessoa ou equipe que responde por ele e mantém o documento atualizado.",
    [{ title: "Coordenador de Tecelagem", desc: "Exemplo de responsável pelo processo de Tecelagem." }]
  ),
  objetivo: campo(
    "Objetivo",
    "Para que o processo existe — o resultado que ele entrega para o negócio.",
    [{ title: "Produzir tecidos premium", desc: "O objetivo deixa claro o resultado esperado do processo." }]
  ),
  entradas: campo(
    "Entradas",
    "O que o processo consome para funcionar: materiais, informações ou documentos. Adicione um item por entrada.",
    [
      { title: "Fio de algodão", desc: "Matéria-prima principal da tecelagem." },
      { title: "Malha crua", desc: "Entrada do processo de tingimento." },
      { title: "Ordem de produção (OP)", desc: "Documento que autoriza a produção." },
      { title: "Pedido de compra", desc: "Entrada do recebimento de matéria-prima." },
    ]
  ),
  saidas: campo(
    "Saídas",
    "O que o processo entrega depois de executar. Adicione um item por saída.",
    [
      { title: "Tecido acabado", desc: "Produto final do processo de beneficiamento." },
      { title: "Rolo de tecido conferido", desc: "Saída do recebimento de matéria-prima." },
      { title: "Nota fiscal conferida", desc: "Entregue ao financeiro após conferência." },
    ]
  ),
  fornecedores: campo(
    "Fornecedores",
    "Quem fornece as entradas do processo. Pode ser um fornecedor externo ou outro setor da própria empresa. Adicione um item por fornecedor.",
    [
      { title: "Fornecedor de fios", desc: "Fornecedor externo de matéria-prima." },
      { title: "Fornecedor de corantes", desc: "Fornecedor de insumos para o tingimento." },
      { title: "Tecelagem (setor anterior)", desc: "Quando a entrada vem de outro setor interno." },
    ]
  ),
  clientes: campo(
    "Clientes",
    "Quem recebe as saídas do processo. Pode ser um cliente interno ou externo. Adicione um item por cliente.",
    [
      { title: "Setor de corte e costura", desc: "Cliente interno do beneficiamento." },
      { title: "Consumidor final", desc: "Cliente externo da confecção." },
      { title: "Próxima etapa", desc: "Quando a saída segue para outro processo." },
    ]
  ),
  recursos: campo(
    "Recursos",
    "O que é necessário para executar o processo: mão de obra, máquinas, energia, espaço. Adicione um item por recurso.",
    [
      { title: "Operadores", desc: "Mão de obra necessária para operar as máquinas." },
      { title: "Bobinadeira", desc: "Equipamento usado na preparação dos fios." },
      { title: "Energia elétrica", desc: "Insumo básico para a linha de produção." },
      { title: "PCP", desc: "Planejamento e Controle da Produção." },
    ]
  ),
  sistemas: campo(
    "Sistemas",
    "Sistemas e softwares usados no processo. Adicione um item por sistema.",
    [
      { title: "ERP (PDM)", desc: "Sistema de gestão integrada." },
      { title: "Bling", desc: "ERP usado no comercial." },
      { title: "Planilha de PCP", desc: "Controle de produção em planilha." },
    ]
  ),
  equipamentos: campo(
    "Equipamentos",
    "Máquinas e equipamentos específicos usados no processo. Adicione um item por equipamento.",
    [
      { title: "Máquina de beneficiamento", desc: "Faz o acabamento do tecido." },
      { title: "Autoclave", desc: "Equipamento usado no tingimento." },
      { title: "Balança", desc: "Usada para conferência de peso." },
    ]
  ),
  indicadores: campo(
    "Indicadores",
    "Métricas que medem o desempenho do processo. Adicione um indicador por item e preencha nome, unidade, meta e frequência de medição.",
    [
      { title: "OEE (Eficiência Global)", desc: "Ex.: unidade %, meta 85%, medido mensalmente." },
      { title: "Atraso de entrega", desc: "Ex.: unidade %, meta inferior a 3%, medido semanalmente." },
      { title: "Retrabalho", desc: "Ex.: unidade %, meta inferior a 2%, medido por lote." },
    ]
  ),
  riscos: campo(
    "Riscos",
    "Situações que podem dar errado e prejudicar o processo. Adicione um risco por item e preencha descrição, probabilidade, impacto e a ação de controle existente.",
    [
      { title: "Produto divergente do pedido", desc: "Probabilidade média, impacto alto. Controle: conferência no recebimento." },
      { title: "Atraso do fornecedor", desc: "Probabilidade alta, impacto médio. Controle: pedido feito com antecedência." },
      { title: "Quebra de máquina", desc: "Probabilidade baixa, impacto alto. Controle: manutenção preventiva." },
    ]
  ),
  controles: campo(
    "Controles",
    "Ações preventivas ou de verificação que reduzem a chance de um risco acontecer. Adicione um controle por item e preencha descrição, responsável e frequência.",
    [
      { title: "Conferência de peso e rolos", desc: "Responsável: conferente. Frequência: a cada recebimento." },
      { title: "Conferência da nota fiscal vs. ordem de compra", desc: "Responsável: comprador. Frequência: a cada compra." },
      { title: "Manutenção preventiva das máquinas", desc: "Responsável: manutenção. Frequência: mensal." },
    ]
  ),
  links: campoLinks,
  observacoes: campoObservacoes,
  ativo: campoAtivo,
}