// Seed do módulo Engenharia de Processos — Processos padrão da rotina de T.I.
// Cria (idempotente) a área "Tecnologia da Informação" com 12 processos, cada
// um com subprocessos e atividades (padrões ITIL — Service Desk, Incidentes,
// Problemas, Mudanças, Liberação, Ativos/CMDB, Backup, Segurança da Informação,
// Infraestrutura, Acessos/IAM, Fornecedores e Projetos).
//
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   node scripts/seed-processos-ti.js                 (todos os bancos)
//   node scripts/seed-processos-ti.js --db=pdm_textil (só o principal)
//   node scripts/seed-processos-ti.js --dry-run       (não grava, só reporta)
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON).

require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

const args = process.argv.slice(2)
function argValue(flag) {
  const item = args.find((a) => a.startsWith(flag + "="))
  return item ? item.split("=")[1] : null
}
const onlyDb = argValue("--db")
const dryRun = args.includes("--dry-run")

const EMPRESA = "Pro Moda Têxtil"
const SITE_TI = "Matriz"
const AREA_TI = "Tecnologia da Informação"
const AREA_DESCRICAO =
  "Processos padrão da rotina de T.I.: suporte ao usuário, infraestrutura, segurança da informação, sistemas, backups, acessos, fornecedores e projetos."

// ---------- Factories de dados ----------

function sub(nome, descricao, atividades) {
  return { nome, descricao, atividades }
}

function atv(nome, tipo, responsavel, observacoes) {
  return { nome, tipo, responsavel, observacoes: observacoes || null }
}

function ind(nome, unidade, meta, frequencia) {
  return { nome, unidade, meta, frequencia }
}

function ris(descricao, probabilidade, impacto, controle) {
  return { descricao, probabilidade, impacto, controle }
}

function ctl(descricao, responsavel, frequencia) {
  return { descricao, responsavel, frequencia }
}

// ---------- Catálogo de processos de T.I. ----------

const PROCESSOS = [
  // ============================================================
  // 001 — GESTÃO DE CHAMADOS E SUPORTE AO USUÁRIO (SERVICE DESK)
  // ============================================================
  {
    codigo: "TI.PRO.001",
    nome: "Gestão de Chamados e Suporte ao Usuário (Service Desk)",
    objetivo:
      "Centralizar o recebimento, registro, priorização e atendimento de solicitações e incidentes dos usuários, garantindo resposta rápida, rastreabilidade e satisfação.",
    responsavel: "Coordenador de Service Desk",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Solicitações e incidentes relatados pelos usuários (telefone, e-mail, portal ou presencial)",
      "Alerta do monitoramento de infraestrutura",
      "Requisições do catálogo de serviços de T.I.",
    ],
    saidas: [
      "Chamado resolvido e validado pelo usuário",
      "Histórico completo do atendimento no sistema de chamados",
      "Solução registrada na base de conhecimento",
    ],
    fornecedores: ["Usuários da empresa", "Sistemas de monitoramento", "Ferramenta de chamados"],
    clientes: ["Todas as áreas da empresa", "Gestores e diretores", "Terceiros com acesso aos sistemas"],
    recursos: [
      "Equipe de Service Desk (N1 e N2)",
      "Ferramenta de chamados/ticketing",
      "Base de conhecimento",
      "Telefonia e chat corporativo",
    ],
    sistemas: ["Sistema de chamados", "E-mail corporativo", "Chat corporativo", "AD/identidade"],
    equipamentos: ["Telefones", "Headsets", "Estações de trabalho do N1"],
    indicadores: [
      ind("Tempo médio de primeiro atendimento", "minutos", "< 30 min", "Diário"),
      ind("Tempo médio de resolução", "horas", "< 8 h", "Semanal"),
      ind("% chamados resolvidos no 1º nível", "%", "> 75%", "Mensal"),
      ind("Nível de satisfação do usuário", "0 a 5", "> 4,5", "Mensal"),
      ind("Chamados reabertos", "%", "< 5%", "Mensal"),
    ],
    riscos: [
      ris("Pico de chamados acima da capacidade da equipe", "Média", "Alto", "Monitorar filas diariamente e acionar reforço N2/N3"),
      ris("Chamados sem SLA definido gerando atraso generalizado", "Média", "Médio", "Regra de priorização por impacto x urgência no ticket"),
      ris("Base de conhecimento desatualizada levando a retrabalho", "Alta", "Médio", "Revisão trimestral da base + link nos resolvidos"),
    ],
    controles: [
      ctl("Revisão semanal das filas e SLAs", "Coordenador de Service Desk", "Semanal"),
      ctl("Auditoria mensal de chamados encerrados", "Analista de Qualidade de T.I.", "Mensal"),
      ctl("Pesquisa de satisfação ao final de cada chamado", "Service Desk", "Contínua"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (Service Desk/Service Operation). Todos os atendimentos de T.I. passam pelo registro no sistema de chamados.",
    subprocessos: [
      sub(
        "Registro e recepção do chamado",
        "Captura da solicitação/incidente e cadastro completo no sistema de chamados.",
        [
          atv("Receber o contato do usuário pelos canais oficiais", "MANUAL", "Service Desk"),
          atv("Registrar chamado com dados do solicitante e descrição do problema", "MANUAL", "Service Desk"),
          atv("Classificar o chamado como incidente ou requisição de serviço", "DECISAO", "Service Desk"),
          atv("Confirmar recebimento e informar o número do chamado ao usuário", "MANUAL", "Service Desk"),
        ]
      ),
      sub(
        "Triagem e priorização",
        "Classificação de impacto x urgência e definição do SLA aplicável ao chamado.",
        [
          atv("Aplicar a matriz de impacto x urgência", "DECISAO", "Service Desk"),
          atv("Definir prioridade e SLA do chamado", "MANUAL", "Service Desk"),
          atv("Atribuir o chamado à fila de 1º nível ou escalar", "MANUAL", "Service Desk"),
          atv("Avisar o usuário sobre o prazo esperado de atendimento", "MANUAL", "Service Desk"),
        ]
      ),
      sub(
        "Atendimento de 1º nível",
        "Investigação inicial e resolução dos incidentes/solicitações mais simples.",
        [
          atv("Investigar o sintoma com checklist padrão", "MANUAL", "N1"),
          atv("Aplicar soluções da base de conhecimento", "MANUAL", "N1"),
          atv("Resolver incidentes simples (senha, acesso, impressora, e-mail)", "MANUAL", "N1"),
          atv("Registrar cada tentativa no histórico do chamado", "MANUAL", "N1"),
        ]
      ),
      sub(
        "Escalonamento para 2º/3º nível",
        "Encaminhamento com histórico completo quando o 1º nível não resolve.",
        [
          atv("Escalar o chamado com resumo e ações já executadas", "MANUAL", "N1"),
          atv("Analisar tecnicamente e aplicar correção de N2", "MANUAL", "N2"),
          atv("Envolver N3 ou fornecedor especialista quando necessário", "DECISAO", "N2"),
          atv("Comunicar o usuário sobre o andamento do escalonamento", "MANUAL", "N2"),
        ]
      ),
      sub(
        "Resolução e fechamento",
        "Confirmação da solução com o usuário e registro final do chamado.",
        [
          atv("Confirmar com o usuário que a solução atende à necessidade", "MANUAL", "Service Desk"),
          atv("Registrar a solução aplicada na base de conhecimento", "MANUAL", "N1/N2"),
          atv("Encerrar o chamado e registrar SLAs cumpridos", "MANUAL", "Service Desk"),
          atv("Reabrir o chamado se o problema persistir", "DECISAO", "Service Desk"),
        ]
      ),
      sub(
        "Pesquisa de satisfação e indicadores",
        "Envio de pesquisa pós-chamado e consolidação dos indicadores do periodo.",
        [
          atv("Enviar pesquisa de satisfação ao usuário", "AUTOMATICA", "Sistema de chamados"),
          atv("Coletar e analisar as respostas", "MANUAL", "Analista de Qualidade de T.I."),
          atv("Gerar relatório mensal de SLAs e satisfação", "MANUAL", "Coordenador de Service Desk"),
          atv("Apresentar resultados à gestão de T.I.", "MANUAL", "Coordenador de Service Desk"),
        ]
      ),
    ],
  },

  // ============================================================
  // 002 — GESTÃO DE INCIDENTES
  // ============================================================
  {
    codigo: "TI.PRO.002",
    nome: "Gestão de Incidentes",
    objetivo:
      "Restabelecer o serviço de T.I. no menor prazo possível após uma interrupção, reduzindo o impacto sobre a operação e evitando perdas.",
    responsavel: "Coordenador de Operações de T.I.",
    status: "APROVADO",
    versao: 1,
    entradas: [
      "Alerta de monitoramento de sistemas e infraestrutura",
      "Acionamento do usuário ou área impactada",
      "Incidentes abertos pelo Service Desk",
    ],
    saidas: [
      "Serviço restabelecido dentro do SLA",
      "Incidente encerrado e documentado",
      "Solução de contorno ou correção definitiva registrada",
    ],
    fornecedores: ["Service Desk", "Monitoramento de infraestrutura", "Usuários das áreas"],
    clientes: ["Áreas de negócio", "Diretoria", "Parceiros com acesso"],
    recursos: [
      "Equipe de operações (N2/N3)",
      "Ferramentas de monitoramento",
      "Ferramenta de chamados",
      "Acesso técnico a servidores e sistemas",
    ],
    sistemas: ["Monitoramento (Zabbix/Pingdom)", "Sistema de chamados", "Sistemas corporativos impactados"],
    equipamentos: ["Servidores", "Switchs e roteadores", "Links de comunicação"],
    indicadores: [
      ind("Tempo médio de restabelecimento (MTTR)", "horas", "< 4 h", "Semanal"),
      ind("Quantidade de incidentes críticos", "unidade", "< 3/mês", "Mensal"),
      ind("% de incidentes dentro do SLA", "%", "> 95%", "Mensal"),
      ind("Tempo entre incidentes (MTBF)", "dias", "> 20 dias", "Mensal"),
    ],
    riscos: [
      ris("Incidente sem priorização correta causando atraso na resposta", "Média", "Alto", "Classificação obrigatória de impacto x urgência no ticket"),
      ris("Falta de acesso técnico necessário para a correção", "Baixa", "Alto", "Validação prévia de acessos críticos da equipe de operações"),
      ris("Comunicação ruim às áreas impactadas", "Média", "Médio", "Comunicados de incidentes com atualizações programadas"),
    ],
    controles: [
      ctl("Revisão pós-incidente (RPI) dos incidentes críticos", "Coordenador de Operações", "A cada incidente crítico"),
      ctl("Monitoramento contínuo com alertas automáticos", "Operações de T.I.", "Contínua"),
      ctl("Testes periódicos dos procedimentos de contingência", "Operações de T.I.", "Trimestral"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (Incident Management). Incidências recorrentes são encaminhadas ao processo de Gestão de Problemas (TI.PRO.003).",
    subprocessos: [
      sub(
        "Detecção e avaliação",
        "Identificação da interrupção, do escopo e da criticidade do incidente.",
        [
          atv("Detectar o incidente por monitoramento, usuário ou equipe", "AUTOMATICA", "Monitoramento/Service Desk"),
          atv("Avaliar o escopo e os serviços impactados", "MANUAL", "N2"),
          atv("Classificar o incidente por impacto e urgência", "DECISAO", "N2"),
          atv("Informar as áreas impactadas e a gestão", "MANUAL", "Operações"),
        ]
      ),
      sub(
        "Diagnóstico e investigação",
        "Identificação da causa provável e das opções de correção.",
        [
          atv("Analisar logs, métricas e registros do sistema", "MANUAL", "N2/N3"),
          atv("Reproduzir o problema em ambiente controlado", "MANUAL", "N2/N3"),
          atv("Consultar erros conhecidos e base de conhecimento", "MANUAL", "N2"),
          atv("Definir hipóteses e plano de ação", "MANUAL", "N2/N3"),
        ]
      ),
      sub(
        "Resolução e recuperação",
        "Aplicação da solução de contorno ou correção, com validação do serviço.",
        [
          atv("Aplicar solução de contorno (workaround) se possível", "MANUAL", "N2"),
          atv("Executar a correção definitiva em produção", "MANUAL", "N3"),
          atv("Validar a restauração do serviço com o usuário/área", "MANUAL", "N2"),
          atv("Monitorar o serviço após a recuperação", "AUTOMATICA", "Monitoramento"),
        ]
      ),
      sub(
        "Encerramento e documentação",
        "Fechamento formal do incidente e registro das lições aprendidas.",
        [
          atv("Encerrar o incidente no sistema de chamados", "MANUAL", "Operações"),
          atv("Registrar a causa e a solução aplicada", "MANUAL", "N2"),
          atv("Encaminhar recorrências para Gestão de Problemas", "DECISAO", "Coordenador de Operações"),
          atv("Realizar a revisão pós-incidente quando crítico", "MANUAL", "Coordenador de Operações"),
        ]
      ),
    ],
  },

  // ============================================================
  // 003 — GESTÃO DE PROBLEMAS
  // ============================================================
  {
    codigo: "TI.PRO.003",
    nome: "Gestão de Problemas",
    objetivo:
      "Identificar e eliminar a causa raiz de incidentes recorrentes ou de alto impacto, prevenindo novas ocorrências e reduzindo o retrabalho.",
    responsavel: "Analista de Sistemas Sênior",
    status: "APROVADO",
    versao: 1,
    entradas: [
      "Incidentes recorrentes com causa comum",
      "Análise de tendências dos incidentes",
      "Incidentes de alto impacto sem causa conhecida",
    ],
    saidas: [
      "Problema documentado com causa raiz identificada",
      "Registro de erro conhecido e solução de contorno",
      "Correção definitiva aplicada e validada",
    ],
    fornecedores: ["Gestão de Incidentes", "Service Desk", "Monitoramento"],
    clientes: ["Gestão de Incidentes", "Service Desk", "Áreas de negócio"],
    recursos: [
      "Especialistas N2/N3",
      "Registro de erros conhecidos",
      "Acesso a ambientes de teste",
      "Ferramenta de análise de logs",
    ],
    sistemas: ["Sistema de chamados", "Monitoramento", "Sistemas corporativos sob análise"],
    equipamentos: [],
    indicadores: [
      ind("Problemas abertos por mês", "unidade", "< 4", "Mensal"),
      ind("Tempo médio até a causa raiz", "dias", "< 15 dias", "Mensal"),
      ind("Redução de incidentes recorrentes", "%", "> 30% ao ano", "Trimestral"),
      ind("% de problemas com RCA documentado", "%", "100%", "Mensal"),
    ],
    riscos: [
      ris("Causa raiz não identificada após análise prolongada", "Média", "Alto", "Reuniões periódicas de investigação e apoio de fornecedores"),
      ris("Correção definitiva introduzir novo incidente", "Baixa", "Alto", "Validar correção em homologação antes de produção"),
      ris("Workaround permanente sem correção definitiva", "Alta", "Médio", "Monitorar erros conhecidos com prazo de solução"),
    ],
    controles: [
      ctl("Revisão do backlog de problemas semanal", "Analista Sênior", "Semanal"),
      ctl("Validação das correções em ambiente de testes", "N3", "A cada correção"),
      ctl("Comitê mensal de análise de tendências", "Gestão de T.I.", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (Problem Management). Atua como segunda linha da Gestão de Incidentes.",
    subprocessos: [
      sub(
        "Identificação do problema",
        "Seleção de incidentes recorrentes ou de alto impacto para análise.",
        [
          atv("Revisar incidentes recorrentes e tendências", "MANUAL", "Analista Sênior"),
          atv("Priorizar problemas por impacto e frequência", "DECISAO", "Analista Sênior"),
          atv("Registrar o problema com evidências", "MANUAL", "Analista Sênior"),
          atv("Vincular incidentes relacionados ao problema", "MANUAL", "Analista Sênior"),
        ]
      ),
      sub(
        "Análise de causa raiz (RCA)",
        "Investigação técnica estruturada para encontrar a causa fundamental.",
        [
          atv("Coletar dados, logs e métricas do período", "MANUAL", "N3"),
          atv("Aplicar análise de causa raiz (5 porquês, diagrama de Ishikawa)", "MANUAL", "N3"),
          atv("Confirmar a causa raiz em ambiente controlado", "MANUAL", "N3"),
          atv("Documentar conclusões e justificativas", "MANUAL", "Analista Sênior"),
        ]
      ),
      sub(
        "Erro conhecido e solução de contorno",
        "Registro formal do erro e definição de workaround para mitigar impacto.",
        [
          atv("Registrar o erro conhecido no banco de erros", "MANUAL", "N3"),
          atv("Definir e testar uma solução de contorno", "MANUAL", "N3"),
          atv("Publicar o workaround para o Service Desk", "MANUAL", "Analista Sênior"),
          atv("Comunicar as áreas impactadas sobre a mitigação", "MANUAL", "Gestão de T.I."),
        ]
      ),
      sub(
        "Correção definitiva",
        "Desenvolvimento, teste e implantação da correção permanente.",
        [
          atv("Planejar a correção definitiva com riscos", "MANUAL", "N3"),
          atv("Desenvolver/ajustar a correção em homologação", "MANUAL", "N3"),
          atv("Testar a correção e validar com as áreas", "MANUAL", "N3"),
          atv("Implantar em produção por meio de Gestão de Mudanças", "MANUAL", "N3"),
        ]
      ),
      sub(
        "Revisão e encerramento",
        "Acompanhamento pós-implementação e fechamento do problema.",
        [
          atv("Acompanhar o comportamento do serviço após a correção", "AUTOMATICA", "Monitoramento"),
          atv("Validar a redução dos incidentes associados", "MANUAL", "Analista Sênior"),
          atv("Atualizar a base de conhecimento e os erros conhecidos", "MANUAL", "N3"),
          atv("Encerrar o problema formalmente", "MANUAL", "Analista Sênior"),
        ]
      ),
    ],
  },

  // ============================================================
  // 004 — GESTÃO DE MUDANÇAS
  // ============================================================
  {
    codigo: "TI.PRO.004",
    nome: "Gestão de Mudanças",
    objetivo:
      "Avaliar, aprovar e implementar mudanças em infraestrutura, sistemas e processos de T.I. com risco controlado, planejamento de reversão e comunicação adequada.",
    responsavel: "Gestor de T.I.",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Solicitações de mudança (RFC) das áreas e da própria T.I.",
      "Requisitos de correção, melhoria ou atualização",
      "Regulamentações e requisitos de segurança/legislação",
    ],
    saidas: [
      "Mudança aprovada e documentada",
      "Implementação executada com check-list e plano de reversão",
      "Registro de mudança com lições aprendidas (PIR)",
    ],
    fornecedores: ["Áreas solicitantes", "Equipes de T.I.", "Fornecedores terceiros"],
    clientes: ["Áreas de negócio", "Diretoria", "Usuários finais"],
    recursos: [
      "Comitê de Mudanças (CAB)",
      "Janela de manutenção",
      "Plano de implementação e reversão",
      "Ambientes de homologação",
    ],
    sistemas: ["Sistema de chamados/RFC", "Sistemas corporativos sob mudança"],
    equipamentos: ["Servidores e infraestrutura envolvidos"],
    indicadores: [
      ind("% de mudanças sem incidente no pós-implementação", "%", "> 95%", "Mensal"),
      ind("Mudanças emergenciais aprovadas", "unidade", "< 10%/mês", "Mensal"),
      ind("Indisponibilidade causada por mudanças", "horas/mês", "< 1 h", "Mensal"),
      ind("Tempo médio de avaliação da RFC", "dias", "< 5 dias", "Mensal"),
    ],
    riscos: [
      ris("Mudança não testada gerando indisponibilidade", "Média", "Alto", "Exigir testes em homologação antes da aprovação"),
      ris("Mudança fora da janela sem autorização", "Baixa", "Alto", "Regra de janela de manutenção + aprovação do CAB"),
      ris("Falta de plano de reversão", "Média", "Alto", "Exigir plano de reversão obrigatório nas RFCs"),
    ],
    controles: [
      ctl("Reunião do Comitê de Mudanças (CAB)", "Gestor de T.I.", "Semanal"),
      ctl("Revisão pós-implementação (PIR), quando aplicável", "Gestor de T.I.", "A cada mudança relevante"),
      ctl("Calendário de janelas de manutenção", "Operações", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (Change Management). Mudanças emergenciais seguem fluxo simplificado com aprovação prioritária.",
    subprocessos: [
      sub(
        "Registro e classificação da RFC",
        "Formalização da solicitação de mudança com escopo, riscos e justificativa.",
        [
          atv("Preencher a RFC com escopo, objetivo, risco e impacto", "MANUAL", "Solicitante"),
          atv("Classificar a mudança (normal, padrão, emergencial)", "DECISAO", "Gestor de T.I."),
          atv("Estimar recursos, custo e janela necessária", "MANUAL", "Gestor de T.I."),
          atv("Registrar a RFC no sistema de chamados", "MANUAL", "Gestor de T.I."),
        ]
      ),
      sub(
        "Avaliação de impacto e risco",
        "Análise técnica do impacto nas operações e dos riscos envolvidos.",
        [
          atv("Avaliar o impacto técnico e nos negócios", "MANUAL", "Equipe técnica"),
          atv("Analisar riscos e medidas de mitigação", "MANUAL", "Equipe técnica"),
          atv("Definir requisitos de teste e ambiente de homologação", "MANUAL", "Equipe técnica"),
          atv("Verificar impacto em mudanças concorrentes", "MANUAL", "Gestor de T.I."),
        ]
      ),
      sub(
        "Aprovação pelo Comitê (CAB)",
        "Decisão formal sobre a realização da mudança.",
        [
          atv("Apresentar a RFC ao Comitê de Mudanças", "MANUAL", "Gestor de T.I."),
          atv("Discutir riscos, impacto e alternativas", "MANUAL", "CAB"),
          atv("Aprovar, reprovar ou solicitar ajustes", "DECISAO", "CAB"),
          atv("Registrar a decisão e as condicionantes", "MANUAL", "Gestor de T.I."),
        ]
      ),
      sub(
        "Planejamento e implementação",
        "Preparação do ambiente, execução nas janelas autorizadas e reversão se necessário.",
        [
          atv("Montar check-list de implementação e plano de reversão", "MANUAL", "Equipe técnica"),
          atv("Executar a mudança na janela autorizada", "MANUAL", "Equipe técnica"),
          atv("Validar o funcionamento do serviço após a mudança", "MANUAL", "Equipe técnica"),
          atv("Acionar o plano de reversão se ocorrer falha", "DECISAO", "Equipe técnica"),
        ]
      ),
      sub(
        "Comunicação e fechamento",
        "Divulgação da mudança e registro do resultado.",
        [
          atv("Comunicar as áreas sobre a mudança e janela", "MANUAL", "Gestor de T.I."),
          atv("Registrar o resultado no sistema de chamados", "MANUAL", "Equipe técnica"),
          atv("Realizar a revisão pós-implementação quando aplicável", "MANUAL", "Gestor de T.I."),
          atv("Encerrar a RFC e atualizar a documentação", "MANUAL", "Gestor de T.I."),
        ]
      ),
    ],
  },

  // ============================================================
  // 005 — GESTÃO DE LIBERAÇÃO E IMPLANTAÇÃO (DEPLOY)
  // ============================================================
  {
    codigo: "TI.PRO.005",
    nome: "Gestão de Liberação e Implantação (Deploy)",
    objetivo:
      "Pacotear, testar e disponibilizar novas versões de software e correções em produção de forma controlada, rastreável e reversível.",
    responsavel: "Analista de Sistemas",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Novas versões, correções e melhorias de software",
      "Requisitos aprovados pela Gestão de Mudanças",
      "Builds gerados pelos times de desenvolvimento",
    ],
    saidas: [
      "Release implantada em produção com sucesso",
      "Versão documentada e rastreável",
      "Rollback executado quando necessário",
    ],
    fornecedores: ["Desenvolvimento", "Gestão de Mudanças", "Fábrica de software/fornecedores"],
    clientes: ["Áreas de negócio", "Usuários finais", "Suporte T.I."],
    recursos: [
      "Ambientes de homologação e produção",
      "Pipeline CI/CD",
      "Repositório de versões/binários",
      "Equipe técnica de implantação",
    ],
    sistemas: ["Git/versionamento", "Pipeline CI/CD", "Sistemas corporativos sob release"],
    equipamentos: ["Servidores de aplicação e banco"],
    indicadores: [
      ind("Deploys bem-sucedidos", "%", "> 98%", "Mensal"),
      ind("Tempo entre builds (lead time)", "horas", "< 24 h", "Semanal"),
      ind("Rollbacks por trimestre", "unidade", "< 2", "Trimestral"),
      ind("Liberações por mês", "unidade", "definido por sistema", "Mensal"),
    ],
    riscos: [
      ris("Release com bug em produção", "Média", "Alto", "Testes automatizados + validação em homologação + rollback pronto"),
      ris("Conflito de versões entre ambientes", "Média", "Médio", "Gerenciamento de versões e integridade do repositório"),
      ris("Janela de deploy indisponível", "Baixa", "Médio", "Janela adequada ao porte da liberação"),
    ],
    controles: [
      ctl("Gate de qualidade antes do deploy (testes + revisão)", "Analista de Sistemas", "A cada release"),
      ctl("Registro de release em log de versões", "Equipe de implantação", "A cada deploy"),
      ctl("Plano de rollback validado antes do deploy", "Equipe de implantação", "A cada release"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL/DevOps (Release and Deployment Management). Toda liberação segue o fluxo de Gestão de Mudanças (TI.PRO.004).",
    subprocessos: [
      sub(
        "Planejamento da release",
        "Definição do escopo, cronograma e critérios de aceite da liberação.",
        [
          atv("Definir o escopo e os artefatos da release", "MANUAL", "Analista de Sistemas"),
          atv("Definir cronograma e janela de deploy", "MANUAL", "Analista de Sistemas"),
          atv("Estabelecer critérios de aceite e critérios de rollback", "MANUAL", "Analista de Sistemas"),
          atv("Vincular a release à RFC de mudança aprovada", "MANUAL", "Analista de Sistemas"),
        ]
      ),
      sub(
        "Build e empacotamento",
        "Geração do artefato da versão e versionamento.",
        [
          atv("Gerar o build do código versionado", "AUTOMATICA", "Pipeline CI/CD"),
          atv("Empacotar o artefato final (binário/imagem)", "AUTOMATICA", "Pipeline CI/CD"),
          atv("Versionar a release e armazenar o artefato", "MANUAL", "Analista de Sistemas"),
          atv("Registrar a release no log de versões", "MANUAL", "Analista de Sistemas"),
        ]
      ),
      sub(
        "Testes em homologação",
        "Validação funcional e de regressão antes da produção.",
        [
          atv("Instalar a release em homologação", "MANUAL", "Equipe de implantação"),
          atv("Executar testes funcionais e de regressão", "MANUAL", "Equipe de testes"),
          atv("Validar os critérios de aceite com as áreas", "MANUAL", "Analista de Sistemas"),
          atv("Obter o sinal verde para produção", "DECISAO", "Analista de Sistemas"),
        ]
      ),
      sub(
        "Implantação em produção",
        "Execução do deploy com monitoramento e rollback pronto.",
        [
          atv("Executar o deploy na janela autorizada", "MANUAL", "Equipe de implantação"),
          atv("Monitorar a aplicação pós-deploy", "AUTOMATICA", "Monitoramento"),
          atv("Validar o funcionamento com as áreas afetadas", "MANUAL", "Equipe de implantação"),
          atv("Acionar o rollback se ocorrer falha crítica", "DECISAO", "Equipe de implantação"),
        ]
      ),
      sub(
        "Verificação e encerramento",
        "Confirmação da estabilidade e documentação da liberação.",
        [
          atv("Acompanhar a estabilidade da release", "AUTOMATICA", "Monitoramento"),
          atv("Registrar o resultado do deploy", "MANUAL", "Equipe de implantação"),
          atv("Atualizar a documentação e a base de conhecimento", "MANUAL", "Analista de Sistemas"),
          atv("Encerrar a release e informar as áreas", "MANUAL", "Analista de Sistemas"),
        ]
      ),
    ],
  },

  // ============================================================
  // 006 — GESTÃO DE ATIVOS DE T.I. E INVENTÁRIO (CMDB)
  // ============================================================
  {
    codigo: "TI.PRO.006",
    nome: "Gestão de Ativos de T.I. e Inventário (CMDB)",
    objetivo:
      "Controlar o ciclo de vida dos ativos de T.I. (hardware, software e licenças) e manter o inventário preciso, auditável e vinculado aos itens de configuração.",
    responsavel: "Analista de Ativos/Estoque de T.I.",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Notas fiscais e aquisições de equipamentos e licenças",
      "Movimentações de equipamentos entre usuários/áreas",
      "Devoluções, baixas e doações de ativos",
    ],
    saidas: [
      "Inventário atualizado com patrimônio da T.I.",
      "Licenças controladas e dentro da legalidade",
      "Ativo baixado com descarte/doação registrado",
    ],
    fornecedores: ["Compras", "Financeiro", "Fornecedores de HW/SW", "Usuários"],
    clientes: ["Compras", "Financeiro", "Auditoria", "Governança de T.I."],
    recursos: [
      "Ferramenta de inventário/CMDB",
      "Etiquetas de patrimônio",
      "Procedimento de inventário físico",
      "Equipe de suporte para coleta",
    ],
    sistemas: ["CMDB/inventário", "Sistema financeiro/contábil", "AD (vinculação)"],
    equipamentos: ["Geladeira patrimonial", "Coletores de inventário", "Etiquetadora"],
    indicadores: [
      ind("% de equipamentos com patrimônio vinculado", "%", "> 98%", "Mensal"),
      ind("Precisão do inventário (auditoria)", "%", "> 97%", "Semestral"),
      ind("Licenças de software sem comprovação", "unidade", "0", "Mensal"),
      ind("Diferenças apuradas no inventário anual", "unidade", "< 2% do total", "Anual"),
    ],
    riscos: [
      ris("Perda ou extravio de equipamento", "Média", "Médio", "Inventário físico periódico + termo de responsabilidade"),
      ris("Uso de software sem licença", "Alta", "Alto", "Controle de licenças e inventário de software instalado"),
      ris("Inventário desatualizado durante alta rotatividade", "Alta", "Médio", "Atualização do ativo em toda movimentação"),
    ],
    controles: [
      ctl("Inventário físico trimestral de itens críticos", "Analista de Ativos", "Trimestral"),
      ctl("Auditoria anual do inventário", "Gestão de T.I.", "Anual"),
      ctl("Termo de responsabilidade na entrega de equipamentos", "Suporte de T.I.", "Contínua"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (IT Asset Management / Configuration Management - CMDB). Todo equipamento da empresa pertence ao patrimônio da T.I.",
    subprocessos: [
      sub(
        "Cadastro e recebimento de ativos",
        "Registro do ativo no inventário a partir da aquisição ou chegada física.",
        [
          atv("Receber o equipamento e conferir NF/requisição", "MANUAL", "Suporte de T.I."),
          atv("Etiquetar com patrimônio e vincular ao item no CMDB", "MANUAL", "Suporte de T.I."),
          atv("Cadastrar acessórios e serial no inventário", "MANUAL", "Suporte de T.I."),
          atv("Armazenar no local adequado e informar o status", "MANUAL", "Suporte de T.I."),
        ]
      ),
      sub(
        "Movimentação e empréstimo",
        "Controle de entrega, devolução e transferência de equipamentos.",
        [
          atv("Registrar a solicitação de equipamento/accessório", "MANUAL", "Suporte de T.I."),
          atv("Entregar o ativo com termo de responsabilidade", "MANUAL", "Suporte de T.I."),
          atv("Atualizar o vínculo usuário/área no inventário", "MANUAL", "Suporte de T.I."),
          atv("Receber a devolução e atualizar o status", "MANUAL", "Suporte de T.I."),
        ]
      ),
      sub(
        "Manutenção e ciclo de vida",
        "Acompanhamento do estado e da vida útil dos ativos.",
        [
          atv("Registrar manutenções e trocas de partes", "MANUAL", "Suporte de T.I."),
          atv("Avaliar a vida útil e condição do equipamento", "MANUAL", "Gestão de T.I."),
          atv("Indicar substituição ou reinserção na reserva", "DECISAO", "Gestão de T.I."),
          atv("Atualizar os indicadores de frota", "MANUAL", "Analista de Ativos"),
        ]
      ),
      sub(
        "Baixa e descarte",
        "Remoção formal do ativo do inventário com destinação adequada.",
        [
          atv("Registrar a solicitação de baixa com justificativa", "MANUAL", "Gestão de T.I."),
          atv("Validar a baixa com patrimônio/financeiro", "MANUAL", "Financeiro"),
          atv("Definir destinação (doação, venda, descarte)", "DECISAO", "Gestão de T.I."),
          atv("Executar descarte seguro de dados/equipamento", "MANUAL", "Suporte de T.I."),
        ]
      ),
      sub(
        "Inventário e auditoria",
        "Conferência física e conciliação do inventário informatizado.",
        [
          atv("Executar inventário físico por área", "MANUAL", "Suporte de T.I."),
          atv("Conferir contagem com o CMDB", "MANUAL", "Analista de Ativos"),
          atv("Investigar e corrigir divergências", "MANUAL", "Analista de Ativos"),
          atv("Emitir relatório de auditoria para a gestão", "MANUAL", "Analista de Ativos"),
        ]
      ),
    ],
  },

  // ============================================================
  // 007 — GESTÃO DE BACKUP E RESTAURAÇÃO DE DADOS
  // ============================================================
  {
    codigo: "TI.PRO.007",
    nome: "Gestão de Backup e Restauração de Dados",
    objetivo:
      "Garantir a proteção e recuperação dos dados corporativos por meio de rotinas de backup testadas, com objetivos de RPO e RTO definidos e monitorados.",
    responsavel: "Administrador de Banco de Dados",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Banco de dados, arquivos compartilhados e sistemas a proteger",
      "Política de retenção e classificação dos dados",
      "Solicitações de restauração de dados",
    ],
    saidas: [
      "Backups executados, verificados e monitorados",
      "Restaurações realizadas dentro do RPO/RTO",
      "Relatório de integridade dos backups",
    ],
    fornecedores: ["Equipes de sistemas", "Operação de T.I.", "Usuários solicitantes"],
    clientes: ["Áreas de negócio", "Gestão de T.I.", "Auditoria"],
    recursos: [
      "Ferramenta/servidor de backup",
      "Mídias e armazenamento externo/offsite",
      "Política de backup documentada",
      "Equipe de operações",
    ],
    sistemas: ["Sistema de backup (Veeam/Bacula/etc.)", "Bancos de dados", "Sistemas corporativos"],
    equipamentos: ["Servidores", "Storage/NAS", "Fitas ou repositório externo"],
    indicadores: [
      ind("% de backups com sucesso", "%", "> 99%", "Diário"),
      ind("Tempo de backup dentro da janela", "%", "100% dos casos", "Diário"),
      ind("Testes de restauração executados", "unidade", "mensal", "Mensal"),
      ind("Dados perdidos por falha (RPO violado)", "n/a", "0", "Mensal"),
    ],
    riscos: [
      ris("Backup corrompido sem retenção suficiente", "Média", "Alto", "Verificação de integridade e retenção em múltiplas cópias"),
      ris("Falha no backup sem alerta à equipe", "Baixa", "Alto", "Monitoramento com alerta e escalonamento"),
      ris("Restauração lenta violando o RTO", "Média", "Médio", "Testes periódicos de restauração e metas de RTO"),
    ],
    controles: [
      ctl("Monitoramento diário dos backups", "Operações de T.I.", "Diária"),
      ctl("Teste mensal de restauração em ambiente de teste", "Administrador de DBA", "Mensal"),
      ctl("Revisão da política de retenção", "Gestão de T.I.", "Semestral"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de backup/DR. As metas de RPO/RTO são definidas com as áreas e revisadas semestralmente.",
    subprocessos: [
      sub(
        "Política de backup",
        "Definição de escopo, retenção e objetivos de recuperação.",
        [
          atv("Mapear os sistemas e dados críticos com as áreas", "MANUAL", "Gestão de T.I."),
          atv("Definir RPO/RTO por sistema", "MANUAL", "Gestão de T.I."),
          atv("Definir frequência, retenção e offsite", "MANUAL", "Administrador de DBA"),
          atv("Registrar a política e divulgar às áreas", "MANUAL", "Gestão de T.I."),
        ]
      ),
      sub(
        "Execução dos backups",
        "Rotina de geração das cópias de segurança.",
        [
          atv("Executar o backup conforme a programação", "AUTOMATICA", "Sistema de backup"),
          atv("Verificar o status do backup executado", "MANUAL", "Operações de T.I."),
          atv("Enviar cópia para repositório offsite quando aplicável", "AUTOMATICA", "Sistema de backup"),
          atv("Registrar o resultado e as exceções", "MANUAL", "Operações de T.I."),
        ]
      ),
      sub(
        "Monitoramento e verificação",
        "Acompanhamento diário da integridade dos backups.",
        [
          atv("Consultar o painel de status dos backups", "MANUAL", "Operações de T.I."),
          atv("Investigar e corrigir falhas de backup", "MANUAL", "Administrador de DBA"),
          atv("Verificar a integridade (validação de mídia/coerência)", "MANUAL", "Administrador de DBA"),
          atv("Emitir relatório diário/semanal de status", "MANUAL", "Operações de T.I."),
        ]
      ),
      sub(
        "Restauração de dados",
        "Atendimento às solicitações de recuperação de dados.",
        [
          atv("Receber a solicitação de restauração", "MANUAL", "Service Desk"),
          atv("Identificar o ponto de restauração adequado", "MANUAL", "Administrador de DBA"),
          atv("Executar a restauração no ambiente solicitado", "MANUAL", "Administrador de DBA"),
          atv("Validar os dados restaurados com o solicitante", "MANUAL", "Administrador de DBA"),
        ]
      ),
      sub(
        "Testes de restauração e DR",
        "Validação periódica da capacidade de recuperação.",
        [
          atv("Executar teste de restauração em ambiente controlado", "MANUAL", "Administrador de DBA"),
          atv("Medir o tempo de recuperação (RTO real)", "MANUAL", "Administrador de DBA"),
          atv("Documentar os resultados e falhas do teste", "MANUAL", "Gestão de T.I."),
          atv("Revisar metas e ajustar o plano", "MANUAL", "Gestão de T.I."),
        ]
      ),
    ],
  },

  // ============================================================
  // 008 — GESTÃO DE SEGURANÇA DA INFORMAÇÃO
  // ============================================================
  {
    codigo: "TI.PRO.008",
    nome: "Gestão de Segurança da Informação",
    objetivo:
      "Proteger a confidencialidade, integridade e disponibilidade das informações por meio de controles técnicos, organizacionais e de conscientização.",
    responsavel: "Analista de Segurança da Informação",
    status: "APROVADO",
    versao: 1,
    entradas: [
      "Classificação dos ativos e dados da empresa",
      "Alertas de antivírus, firewall e monitoramento",
      "Comunicados de vulnerabilidades e ameaças",
    ],
    saidas: [
      "Riscos de segurança mapeados e tratados",
      "Incidentes de segurança respondidos e documentados",
      "Colaboradores conscientizados e treinados",
    ],
    fornecedores: ["Equipes de T.I.", "Prestadores de segurança", "Órgãos reguladores/CERT"],
    clientes: ["Toda a empresa", "Diretoria", "Clientes e parceiros (dados)"],
    recursos: [
      "Ferramentas de segurança (antivírus, firewall, SIEM)",
      "Política de Segurança da Informação",
      "Comitê de segurança",
      "Treinamentos e campanhas",
    ],
    sistemas: ["Antivírus/EDR", "Firewall", "SIEM", "Monitoramento de acessos"],
    equipamentos: [],
    indicadores: [
      ind("Incidentes de segurança críticos", "unidade", "< 2/trimestre", "Trimestral"),
      ind("Tempo de resposta a incidentes de segurança", "horas", "< 2 h (críticos)", "Mensal"),
      ind("% de colaboradores treinados em segurança", "%", "> 90%", "Semestral"),
      ind("Vulnerabilidades críticas pendentes", "unidade", "0", "Semanal"),
    ],
    riscos: [
      ris("Vazamento de dados por erro humano ou ataque", "Média", "Crítico", "Controles técnicos, backup, DLP e conscientização"),
      ris("Ransomware comprometendo a operação", "Média", "Crítico", "Backups testados, segmentação de rede e anti-ransomware"),
      ris("Acessos indevidos por privilégio excessivo", "Média", "Alto", "Princípio do menor privilégio e revisão de acessos"),
    ],
    controles: [
      ctl("Monitoramento contínuo de ameaças (SIEM/EDR)", "Segurança da Informação", "Contínua"),
      ctl("Revisão da política de segurança", "Comitê de Segurança", "Anual"),
      ctl("Campanhas periódicas de phishing/PBLs simulados", "Segurança da Informação", "Trimestral"),
    ],
    observacoes:
      "Processo padrão baseado em ISO 27001 e boas práticas de segurança. Interage com os processos de Acesso (TI.PRO.010), Backup (TI.PRO.007) e Continuidade.",
    subprocessos: [
      sub(
        "Classificação e proteção da informação",
        "Categorização dos dados e aplicação de controles proporcionais.",
        [
          atv("Classificar os dados por sensibilidade e criticidade", "MANUAL", "Gestores das áreas"),
          atv("Aplicar controles de proteção adequados à classe", "MANUAL", "Segurança da Informação"),
          atv("Mapear o fluxo de dados sensíveis", "MANUAL", "Segurança da Informação"),
          atv("Atualizar a matriz de classificação", "MANUAL", "Segurança da Informação"),
        ]
      ),
      sub(
        "Gestão de riscos e vulnerabilidades",
        "Identificação, avaliação e tratamento das falhas de segurança.",
        [
          atv("Realizar varredura de vulnerabilidades", "AUTOMATICA", "Ferramenta de segurança"),
          atv("Avaliar e priorizar as vulnerabilidades encontradas", "MANUAL", "Segurança da Informação"),
          atv("Corrigir ou mitigar as vulnerabilidades críticas", "MANUAL", "Equipes T.I."),
          atv("Registrar riscos e planos de tratamento", "MANUAL", "Segurança da Informação"),
        ]
      ),
      sub(
        "Monitoramento e resposta a incidentes",
        "Detecção de ameaças e resposta estruturada a incidentes de segurança.",
        [
          atv("Monitorar alertas de segurança (SIEM/EDR)", "AUTOMATICA", "Segurança da Informação"),
          atv("Investigar e confirmar o incidente de segurança", "MANUAL", "Segurança da Informação"),
          atv("Contenção, erradicação e recuperação", "MANUAL", "Equipe CSIRT"),
          atv("Documentar e registrar o incidente de segurança", "MANUAL", "Segurança da Informação"),
        ]
      ),
      sub(
        "Controle de alterações em segurança",
        "Validação de mudanças que afetam a segurança.",
        [
          atv("Revisar propostas de mudança sob ótica de segurança", "MANUAL", "Segurança da Informação"),
          atv("Aprovar exceções com justificativa e validade", "DECISAO", "Gestor de T.I."),
          atv("Testar controles de segurança após mudanças", "MANUAL", "Equipes T.I."),
          atv("Registrar as decisões no repositório", "MANUAL", "Segurança da Informação"),
        ]
      ),
      sub(
        "Conscientização e treinamento",
        "Capacitação dos colaboradores para reduzir riscos de origem humana.",
        [
          atv("Planejar o calendário de treinamentos", "MANUAL", "Segurança da Informação"),
          atv("Executar treinamentos e campanhas de conscientização", "MANUAL", "Segurança da Informação"),
          atv("Simular ataques de phishing para medir adesão", "MANUAL", "Segurança da Informação"),
          atv("Medir e reportar os resultados à gestão", "MANUAL", "Segurança da Informação"),
        ]
      ),
    ],
  },

  // ============================================================
  // 009 — GESTÃO DE INFRAESTRUTURA E REDES
  // ============================================================
  {
    codigo: "TI.PRO.009",
    nome: "Gestão de Infraestrutura e Redes",
    objetivo:
      "Manter a infraestrutura de T.I. (servidores, rede, armazenamento, energia e local) disponível, atualizada e com capacidade adequada à operação.",
    responsavel: "Administrador de Infraestrutura",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Demandas de capacidade e desempenho das áreas",
      "Alertas do monitoramento de infraestrutura",
      "Aquisições e upgrades de hardware/licenças",
    ],
    saidas: [
      "Infraestrutura disponível e monitorada",
      "Patchs e manutenções preventivas aplicadas",
      "Capacidade dimensionada e com folga controlada",
    ],
    fornecedores: ["Fornecedores de HW", "Provedores de link/internet", "Datacenter"],
    clientes: ["Equipes T.I.", "Áreas de negócio", "Usuários finais"],
    recursos: [
      "Equipe de infraestrutura",
      "Ferramentas de monitoramento",
      "Datacenter/local técnico",
      "Documentação de rede e servidores",
    ],
    sistemas: ["Monitoramento", "AD/DNS", "Virtualização", "Sistemas de backup"],
    equipamentos: ["Servidores", "Storage", "Firewall", "Switchs", "No-breaks"],
    indicadores: [
      ind("Indisponibilidade de infraestrutura", "horas/mês", "< 1 h", "Mensal"),
      ind("Uso de CPU/RAM/armazenamento", "% de capacidade", "< 80%", "Semanal"),
      ind("Patchs críticos aplicados no prazo", "%", "100%", "Mensal"),
      ind("Tempo de resposta da rede", "ms", "dentro do baseline", "Semanal"),
    ],
    riscos: [
      ris("Falha de hardware sem redundância", "Média", "Alto", "Redundância de componentes críticos e monitoramento"),
      ris("Provedor de link instável", "Média", "Alto", "Links redundantes de operadoras diferentes"),
      ris("Capacidade esgotada sem planejamento", "Média", "Alto", "Monitoramento de capacidade e plano de expansão"),
    ],
    controles: [
      ctl("Monitoramento 24x7 com alertas", "Operações de T.I.", "Contínua"),
      ctl("Manutenção preventiva semestral", "Administrador de Infra", "Semestral"),
      ctl("Revisão de capacidade mensal", "Administrador de Infra", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL/ISO 27001. Mantém a base para todos os demais processos de T.I.",
    subprocessos: [
      sub(
        "Monitoramento da infraestrutura",
        "Observação contínua de disponibilidade e desempenho dos componentes.",
        [
          atv("Manter os itens monitorados no painel", "MANUAL", "Administrador de Infra"),
          atv("Acompanhar alertas de disponibilidade", "AUTOMATICA", "Monitoramento"),
          atv("Investigar e tratar alertas anômalos", "MANUAL", "Operações de T.I."),
          atv("Gerar relatórios de disponibilidade", "MANUAL", "Administrador de Infra"),
        ]
      ),
      sub(
        "Manutenção preventiva e corretiva",
        "Rotinas de manutenção programada e correção de falhas.",
        [
          atv("Executar o cronograma de manutenções preventivas", "MANUAL", "Administrador de Infra"),
          atv("Aplicar patchs e atualizações de segurança", "MANUAL", "Administrador de Infra"),
          atv("Executar manutenção corretiva em caso de falha", "MANUAL", "Operações de T.I."),
          atv("Registrar manutenções e prazos de garantia", "MANUAL", "Administrador de Infra"),
        ]
      ),
      sub(
        "Gestão de capacidade",
        "Dimensionamento e planejamento de crescimento da infraestrutura.",
        [
          atv("Coletar métricas de utilização", "AUTOMATICA", "Monitoramento"),
          atv("Analisar tendências de crescimento", "MANUAL", "Administrador de Infra"),
          atv("Propor e aprovar expansões de capacidade", "MANUAL", "Gestão de T.I."),
          atv("Executar o dimensionamento/aprovisionamento", "MANUAL", "Administrador de Infra"),
        ]
      ),
      sub(
        "Gestão de rede e conectividade",
        "Operação, configuração e segurança da rede local e acessos externos.",
        [
          atv("Configurar e manter o parque de switchs/roteadores", "MANUAL", "Administrador de Rede"),
          atv("Gerenciar VLANs, SSIDs e perfis de acesso", "MANUAL", "Administrador de Rede"),
          atv("Gerenciar firewall e regras de acesso externo", "MANUAL", "Administrador de Rede"),
          atv("Monitorar consumo e qualidade dos links", "MANUAL", "Administrador de Rede"),
        ]
      ),
      sub(
        "Local técnico, energia e segurança física",
        "Controle do ambiente físico que hospeda a infraestrutura.",
        [
          atv("Monitorar temperatura e climatização do local técnico", "AUTOMATICA", "Sensor de ambiente"),
          atv("Verificar no-breaks e gerador", "MANUAL", "Operações de T.I."),
          atv("Controlar acesso físico ao local técnico", "MANUAL", "Operações de T.I."),
          atv("Manter plano de contingência de energia", "MANUAL", "Administrador de Infra"),
        ]
      ),
    ],
  },

  // ============================================================
  // 010 — GESTÃO DE ACESSOS, CONTAS E IDENTIDADES (IAM)
  // ============================================================
  {
    codigo: "TI.PRO.010",
    nome: "Gestão de Acessos, Contas e Identidades (IAM)",
    objetivo:
      "Garantir que cada colaborador tenha apenas os acessos necessários às suas funções, com provisionamento ágil, revisões periódicas e revogação imediata quando necessário.",
    responsavel: "Analista de Suporte (Acessos)",
    status: "PADRONIZADO",
    versao: 1,
    entradas: [
      "Solicitações de acesso de novos colaboradores ou troca de função",
      "Desligamentos e afastamentos",
      "Revisões periódicas de acessos das áreas",
    ],
    saidas: [
      "Contas provisionadas conforme a necessidade",
      "Acessos revogados no prazo em desligamentos",
      "Relatório de revisão de acessos auditável",
    ],
    fornecedores: ["RH", "Gestores de área", "Service Desk"],
    clientes: ["Colaboradores", "Gestores", "Auditoria"],
    recursos: [
      "AD/Entra ID",
      "Ferramenta de gestão de identidades",
      "Matriz de acessos por função",
      "Procedimento de provisionamento",
    ],
    sistemas: ["AD/Entra ID", "E-mail", "ERP", "PDM", "Sistemas internos"],
    equipamentos: [],
    indicadores: [
      ind("Acessos concedidos dentro do prazo", "%", "> 95%", "Mensal"),
      ind("Contas desativadas no desligamento", "%", "100% em até 24h", "Mensal"),
      ind("Revisões de acesso executadas no prazo", "%", "100%", "Trimestral"),
      ind("Contas de usuários inativos", "unidade", "0", "Mensal"),
    ],
    riscos: [
      ris("Acesso residual após desligamento", "Média", "Alto", "Rotina automática de desativação + checklist de desligamento"),
      ris("Privilégio excessivo acumulado por função", "Média", "Alto", "Revisão periódica com gestores e menor privilégio"),
      ris("Compartilhamento de contas", "Alta", "Alto", "Política de uso individual e bloqueio de contas compartilhadas"),
    ],
    controles: [
      ctl("Revisão trimestral de acessos com gestores", "Analista de Acessos", "Trimestral"),
      ctl("Checklist de desligamento com revogação de acessos", "Service Desk/RH", "Contínua"),
      ctl("Relatório de contas inativas", "Analista de Acessos", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado em identidade e acesso (IAM/ISO 27001). Todos os acessos são individuais, com nome de usuário e senha próprios.",
    subprocessos: [
      sub(
        "Solicitação de acesso",
        "Recepção e validação das solicitações de permissão.",
        [
          atv("Receber a solicitação com justificativa e função", "MANUAL", "Service Desk/gestor"),
          atv("Validar a solicitação contra a matriz de acessos", "MANUAL", "Analista de Acessos"),
          atv("Obter a aprovação do gestor responsável", "DECISAO", "Gestor da área"),
          atv("Registrar a solicitação e o parecer", "MANUAL", "Analista de Acessos"),
        ]
      ),
      sub(
        "Provisionamento",
        "Criação e configuração dos acessos nos sistemas e AD.",
        [
          atv("Criar a conta no AD/Entra ID (quando novo)", "MANUAL", "Analista de Acessos"),
          atv("Conceder as permissões aprovadas nos sistemas", "MANUAL", "Analista de Acessos"),
          atv("Configurar grupos, e-mail e pastas", "MANUAL", "Analista de Acessos"),
          atv("Registrar a conclusão e comunicar o usuário", "MANUAL", "Analista de Acessos"),
        ]
      ),
      sub(
        "Revisão periódica de acessos",
        "Recertificação das permissões com os gestores das áreas.",
        [
          atv("Gerar a lista de acessos por área/usuário", "MANUAL", "Analista de Acessos"),
          atv("Enviar a lista ao gestor para recertificação", "MANUAL", "Analista de Acessos"),
          atv("Remover os acessos não confirmados", "MANUAL", "Analista de Acessos"),
          atv("Registrar a revisão e arquivar o relatório", "MANUAL", "Analista de Acessos"),
        ]
      ),
      sub(
        "Desligamento e revogação",
        "Remoção rápida e completa de acessos ao fim do vínculo.",
        [
          atv("Receber o aviso de desligamento do RH", "MANUAL", "RH"),
          atv("Desativar contas e bloquear acessos imediatamente", "MANUAL", "Analista de Acessos"),
          atv("Recolher equipamentos e cartões de acesso", "MANUAL", "Service Desk"),
          atv("Confirmar a revogação completa no checklist", "MANUAL", "Analista de Acessos"),
        ]
      ),
      sub(
        "Auditoria de acessos",
        "Conferência da aderência às políticas de acesso.",
        [
          atv("Extrair relatórios de contas e permissões", "MANUAL", "Analista de Acessos"),
          atv("Verificar contas inativas e privilégios elevados", "MANUAL", "Analista de Acessos"),
          atv("Corrigir divergências encontradas", "MANUAL", "Analista de Acessos"),
          atv("Reportar o resultado à gestão e auditoria", "MANUAL", "Gestor de T.I."),
        ]
      ),
    ],
  },

  // ============================================================
  // 011 — GESTÃO DE FORNECEDORES E CONTRATOS DE T.I.
  // ============================================================
  {
    codigo: "TI.PRO.011",
    nome: "Gestão de Fornecedores e Contratos de T.I.",
    objetivo:
      "Selecionar, contratar e avaliar fornecedores de produtos e serviços de T.I., assegurando SLA, custo adequado, conformidade e qualidade das entregas.",
    responsavel: "Gestor de T.I.",
    status: "APROVADO",
    versao: 1,
    entradas: [
      "Necessidades de aquisição de software, hardware e serviços",
      "Contratos vigentes e cláusulas de SLA",
      "Resultados de avaliação de fornecedores",
    ],
    saidas: [
      "Contratos firmados com SLA e responsabilidades claras",
      "Fornecedores avaliados e acompanhados",
      "Renovações ou desligamentos documentados",
    ],
    fornecedores: ["Distribuidores de HW", "Licenciantes de SW", "Provedores de serviços/cloud", "Telefonia/internet"],
    clientes: ["Gestão de T.I.", "Compras", "Financeiro"],
    recursos: [
      "Documentação de contratos",
      "Matriz de avaliação de fornecedores",
      "Processo de contratação/compras",
      "Base de fornecedores homologados",
    ],
    sistemas: ["Sistema financeiro", "Repositório de contratos"],
    equipamentos: [],
    indicadores: [
      ind("SLAs do fornecedor cumpridos", "%", "> 97%", "Mensal"),
      ind("Avaliações de fornecedores no prazo", "%", "100%", "Trimestral"),
      ind("Fornecedores sem contrato vigente", "unidade", "0", "Mensal"),
      ind("Economia obtida em renovações", "%", ">= 5%", "Anual"),
    ],
    riscos: [
      ris("Dependência de único fornecedor crítico", "Média", "Alto", "Homologação de fornecedores alternativos"),
      ris("SLA abaixo do contratado sem cobrança", "Média", "Médio", "Faturamento/multas conforme contrato e trimestre de acompanhamento"),
      ris("Renovação automática desfavorável", "Baixa", "Médio", "Alerta de vigência 90 dias antes do vencimento"),
    ],
    controles: [
      ctl("Acompanhamento mensal dos SLAs de fornecedores", "Gestor de T.I.", "Mensal"),
      ctl("Avaliação semestral de desempenho dos fornecedores", "Gestor de T.I.", "Semestral"),
      ctl("Controle de vigência de contratos", "Gestor de T.I.", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado nas boas práticas de ITIL (Supplier Management). Todo fornecedor crítico possui contrato com SLA e avaliação periódica.",
    subprocessos: [
      sub(
        "Seleção e contratação",
        "Levantamento de necessidades, cotação e contratação de fornecedores.",
        [
          atv("Levantar a necessidade técnica e de negócio", "MANUAL", "Gestor de T.I."),
          atv("Pesquisar fornecedores e solicitar propostas", "MANUAL", "Compras/Gestor de T.I."),
          atv("Avaliar propostas técnica e financeiramente", "MANUAL", "Gestor de T.I."),
          atv("Formalizar o contrato com SLA e penalidades", "MANUAL", "Compras/Financeiro"),
        ]
      ),
      sub(
        "Gestão de SLA e entregas",
        "Acompanhamento da qualidade e conformidade dos serviços contratados.",
        [
          atv("Definir e acordar as metas de SLA", "MANUAL", "Gestor de T.I."),
          atv("Coletar métricas de SLA dos fornecedores", "MANUAL", "Gestor de T.I."),
          atv("Tratar os descumprimentos e acionar cláusulas", "MANUAL", "Gestor de T.I."),
          atv("Registrar reuniões de acompanhamento", "MANUAL", "Gestor de T.I."),
        ]
      ),
      sub(
        "Avaliação de desempenho",
        "Avaliação periódica formal dos fornecedores.",
        [
          atv("Aplicar o questionário de avaliação", "MANUAL", "Gestor de T.I."),
          atv("Consolidar notas por critério (qualidade, prazo, SLA)", "MANUAL", "Gestor de T.I."),
          atv("Definir planos de ação para os pontos críticos", "MANUAL", "Gestor de T.I."),
          atv("Comunicar o resultado ao fornecedor", "MANUAL", "Gestor de T.I."),
        ]
      ),
      sub(
        "Renovação e encerramento",
        "Gestão da vigência, renovações e saída de fornecedores.",
        [
          atv("Monitorar as datas de vencimento dos contratos", "MANUAL", "Gestor de T.I."),
          atv("Negociar renovações e condições", "MANUAL", "Gestor de T.I."),
          atv("Planejar a transição ao encerrar o contrato", "MANUAL", "Gestor de T.I."),
          atv("Encerrar formalmente e arquivar a documentação", "MANUAL", "Gestor de T.I."),
        ]
      ),
    ],
  },

  // ============================================================
  // 012 — GESTÃO DE PROJETOS E DEMANDAS DE T.I.
  // ============================================================
  {
    codigo: "TI.PRO.012",
    nome: "Gestão de Projetos e Demandas de T.I.",
    objetivo:
      "Planejar, executar e entregar projetos e demandas de T.I. com escopo, prazo, custo e qualidade controlados, dentro da priorização aprovada pela gestão.",
    responsavel: "Gestor de Projetos de T.I.",
    status: "APROVADO",
    versao: 1,
    entradas: [
      "Demandas das áreas e projetos solicitados",
      "Priorização e portfólio aprovado pela gestão",
      "Disponibilidade de equipe e orçamento",
    ],
    saidas: [
      "Projeto entregue com escopo validado",
      "Detalhamento de custos, prazos e riscos",
      "Lições aprendidas registradas",
    ],
    fornecedores: ["Áreas solicitantes", "Equipes de T.I.", "Fornecedores terceiros"],
    clientes: ["Diretoria", "Áreas de negócio", "Gestão de T.I."],
    recursos: [
      "Gestor de projetos",
      "Ferramenta de gestão de projetos/backlog",
      "Equipes multidisciplinares",
      "Orçamento aprovado",
    ],
    sistemas: ["Ferramenta de projetos/backlog", "Sistema de chamados"],
    equipamentos: [],
    indicadores: [
      ind("Projetos entregues no prazo", "%", "> 80%", "Mensal"),
      ind("Projetos dentro do orçamento", "%", "> 85%", "Mensal"),
      ind("% de projetos com escopo sem estouro", "%", "> 90%", "Mensal"),
      ind("Demandas abertas acima da capacidade", "unidade", "monitorar", "Semanal"),
    ],
    riscos: [
      ris("Escopo crescente (scope creep) sem controle", "Alta", "Alto", "Comitê de mudanças do projeto e controle de escopo"),
      ris("Dependência de fornecedor atrasando a entrega", "Média", "Médio", "Marcos e cláusulas de atraso no contrato"),
      ris("Conflito de prioridades com a operação", "Média", "Alto", "Priorização trimestral do portfólio com a gestão"),
    ],
    controles: [
      ctl("Reuniões de acompanhamento dos projetos", "Gestor de Projetos", "Semanal"),
      ctl("Comitê de priorização do portfólio", "Gestão de T.I.", "Trimestral"),
      ctl("Revisão de riscos e prazos", "Gestor de Projetos", "Mensal"),
    ],
    observacoes:
      "Processo padrão baseado em boas práticas de gestão de projetos (PMBOK). Projetos implantados seguem ainda o fluxo de Mudanças e Liberação.",
    subprocessos: [
      sub(
        "Iniciação e priorização",
        "Formalização da demanda e obtenção da aprovação de escopo e orçamento.",
        [
          atv("Registrar a demanda com objetivo e benefícios", "MANUAL", "Área solicitante"),
          atv("Avaliar viabilidade técnica e financeira", "MANUAL", "Gestor de Projetos"),
          atv("Priorizar no comitê de portfólio", "DECISAO", "Gestão de T.I."),
          atv("Aprovar o termo de abertura (escopo, prazo, custo)", "MANUAL", "Diretoria"),
        ]
      ),
      sub(
        "Planejamento",
        "Detalhamento do plano de execução do projeto.",
        [
          atv("Definir cronograma, marcos e responsáveis", "MANUAL", "Gestor de Projetos"),
          atv("Detalhar o orçamento e os recursos", "MANUAL", "Gestor de Projetos"),
          atv("Mapear riscos e medidas de mitigação", "MANUAL", "Gestor de Projetos"),
          atv("Alinhar o plano com a área solicitante", "MANUAL", "Gestor de Projetos"),
        ]
      ),
      sub(
        "Execução e monitoramento",
        "Condução das atividades, acompanhamento de prazos e tratativa de desvios.",
        [
          atv("Executar as atividades do projeto", "MANUAL", "Equipe do projeto"),
          atv("Acompanhar cronograma, custos e riscos", "MANUAL", "Gestor de Projetos"),
          atv("Tratar desvios e solicitações de mudança de escopo", "DECISAO", "Comitê do projeto"),
          atv("Comunicar o status às partes interessadas", "MANUAL", "Gestor de Projetos"),
        ]
      ),
      sub(
        "Entrega e validação",
        "Implantação da solução e validação com o cliente interno.",
        [
          atv("Implantar a solução (via Mudanças/Liberação)", "MANUAL", "Equipe do projeto"),
          atv("Validar o resultado com a área solicitante", "MANUAL", "Gestor de Projetos"),
          atv("Treinar e apoiar os usuários na adoção", "MANUAL", "Equipe do projeto"),
          atv("Homologar a entrega final", "DECISAO", "Área solicitante"),
        ]
      ),
      sub(
        "Encerramento e lições aprendidas",
        "Fechamento formal do projeto e registro do aprendizado.",
        [
          atv("Consolidar entregas, resultados e custos", "MANUAL", "Gestor de Projetos"),
          atv("Coletar lições aprendidas com a equipe", "MANUAL", "Gestor de Projetos"),
          atv("Encerrar formalmente e arquivar a documentação", "MANUAL", "Gestor de Projetos"),
          atv("Apresentar os resultados à gestão", "MANUAL", "Gestor de Projetos"),
        ]
      ),
    ],
  },
]

// ---------- Lógica de seed por banco ----------

function normalize(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function json(v) {
  return JSON.stringify(v || [])
}

// postgres.js serializa JS -> jsonb nas colunas jsonb.

async function ensureArea(sql, areaNome) {
  let empresaId
  const [emp] = await sql`SELECT id FROM proc_empresas WHERE nome = ${EMPRESA} LIMIT 1`
  if (emp) {
    empresaId = emp.id
  } else {
    if (dryRun) {
      console.log(`    [dry-run] criaria empresa "${EMPRESA}"`)
      return null
    }
    const [criada] = await sql`INSERT INTO proc_empresas (nome) VALUES (${EMPRESA}) RETURNING id`
    empresaId = criada.id
    console.log(`    → empresa "${EMPRESA}" criada`)
  }

  let siteId
  const [site] = await sql`SELECT id FROM proc_sites WHERE nome = ${SITE_TI} AND empresa_id = ${empresaId} LIMIT 1`
  if (site) {
    siteId = site.id
  } else {
    if (dryRun) {
      console.log(`    [dry-run] criaria site "${SITE_TI}" da empresa "${EMPRESA}"`)
      return null
    }
    const [criado] = await sql`INSERT INTO proc_sites (empresa_id, nome) VALUES (${empresaId}, ${SITE_TI}) RETURNING id`
    siteId = criado.id
    console.log(`    → site "${SITE_TI}" criado`)
  }

  const [area] = await sql`
    SELECT id FROM proc_areas
    WHERE site_id = ${siteId} AND LOWER(nome) = LOWER(${areaNome})
    LIMIT 1
  `
  if (area) return area.id

  if (dryRun) {
    console.log(`    [dry-run] criaria área "${areaNome}" no site "${SITE_TI}"`)
    return null
  }
  const [criada] = await sql`
    INSERT INTO proc_areas (site_id, nome, descricao)
    VALUES (${siteId}, ${areaNome}, ${AREA_DESCRICAO})
    RETURNING id
  `
  console.log(`    → área "${areaNome}" criada`)
  return criada.id
}

async function ensureProcesso(sql, areaId, p) {
  const [exist] = await sql`
    SELECT id FROM proc_processos
    WHERE area_id = ${areaId} AND LOWER(nome) = LOWER(${p.nome})
    LIMIT 1
  `
  if (exist) return { id: exist.id, criado: false }

  if (dryRun) {
    console.log(`    [dry-run] criaria processo "${p.codigo} — ${p.nome}"`)
    return { id: null, criado: false }
  }

  const [row] = await sql`
    INSERT INTO proc_processos (
      area_id, codigo, nome, objetivo, responsavel, status, versao,
      entradas, saidas, fornecedores, clientes, recursos, sistemas, equipamentos,
      indicadores, riscos, controles, links, observacoes
    ) VALUES (
      ${areaId}, ${p.codigo}, ${p.nome}, ${p.objetivo || null}, ${p.responsavel || null},
      ${p.status || "RASCUNHO"}, ${p.versao || 0},
      ${sql.json(p.entradas || [])},
      ${sql.json(p.saidas || [])},
      ${sql.json(p.fornecedores || [])},
      ${sql.json(p.clientes || [])},
      ${sql.json(p.recursos || [])},
      ${sql.json(p.sistemas || [])},
      ${sql.json(p.equipamentos || [])},
      ${sql.json(p.indicadores || [])},
      ${sql.json(p.riscos || [])},
      ${sql.json(p.controles || [])},
      ${sql.json([])},
      ${p.observacoes || null}
    ) RETURNING id
  `
  return { id: row.id, criado: true }
}

async function ensureSubprocesso(sql, processoId, s, idx) {
  const [exist] = await sql`
    SELECT id FROM proc_subprocessos
    WHERE processo_id = ${processoId} AND LOWER(nome) = LOWER(${s.nome})
    LIMIT 1
  `
  if (exist) return { id: exist.id, criado: false }

  if (dryRun) {
    console.log(`      [dry-run] criaria subprocesso "${s.nome}"`)
    return { id: null, criado: false }
  }

  const [row] = await sql`
    INSERT INTO proc_subprocessos (processo_id, nome, descricao, ordem, links)
    VALUES (${processoId}, ${s.nome}, ${s.descricao || null}, ${idx}, ${sql.json([])})
    RETURNING id
  `
  return { id: row.id, criado: true }
}

async function ensureAtividade(sql, subprocessoId, a, idx) {
  const [exist] = await sql`
    SELECT id FROM proc_atividades
    WHERE subprocesso_id = ${subprocessoId} AND LOWER(nome) = LOWER(${a.nome})
    LIMIT 1
  `
  if (exist) return { id: exist.id, criado: false }
  const [row] = await sql`
    INSERT INTO proc_atividades (subprocesso_id, nome, tipo, responsavel, ordem, links, observacoes)
    VALUES (${subprocessoId}, ${a.nome}, ${a.tipo || "MANUAL"}, ${a.responsavel || null}, ${idx}, ${sql.json([])}, ${a.observacoes || null})
    RETURNING id
  `
  return { id: row.id, criado: true }
}

async function seedDb({ name, url }) {
  if (!url) {
    console.log(`[${name}] SEM_URL — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    console.log(`\n[${name}] seed de Processos de T.I.`)
    const areaId = await ensureArea(sql, AREA_TI)
    if (areaId == null) {
      console.log(`  → [dry-run] nenhuma gravação (--dry-run ativo)`)
      await sql.end({ timeout: 5 })
      return
    }

    let processosCriados = 0
    let subprocessosCriados = 0
    let atividadesCriadas = 0

    for (const p of PROCESSOS) {
      const proc = await ensureProcesso(sql, areaId, p)
      if (proc.criado) processosCriados++
      if (!proc.id) continue

      const subs = p.subprocessos || []
      for (let i = 0; i < subs.length; i++) {
        const s = subs[i]
        const subRes = await ensureSubprocesso(sql, proc.id, s, i)
        if (subRes.criado) subprocessosCriados++
        if (!subRes.id) continue

        const atvs = s.atividades || []
        for (let j = 0; j < atvs.length; j++) {
          const aRes = await ensureAtividade(sql, subRes.id, atvs[j], j)
          if (aRes.criado) atividadesCriadas++
        }
      }
    }

    console.log(
      `  [${name}] ${processosCriados} processo(s), ${subprocessosCriados} subprocesso(s), ${atividadesCriadas} atividade(s) criados`
    )
  } catch (err) {
    console.error(`[${name}] erro:`, err.message)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  console.log(
    `${dryRun ? "[DRY-RUN] " : ""}Área: ${AREA_TI} | ${PROCESSOS.length} processos (códigos ${PROCESSOS[0].codigo}–${PROCESSOS[PROCESSOS.length - 1].codigo})`
  )
  for (const db of alvos) {
    await seedDb(db)
  }
  console.log("\nDone!")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})