// Seed do módulo Ativos e Vistorias — categorias + tipos de vistoria da taxonomia.
// Idempotente: só insere registros que ainda não existem (por `nome`).
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   node scripts/seed-vistorias.js                 (todos os bancos)
//   node scripts/seed-vistorias.js --db=pdm_textil (só o principal)
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

const CATEGORIAS = [
  { nome: "Segurança Contra Incêndio", setor: "SEGURANCA", descricao: "Extintores, hidrantes, alarmes, iluminação e rotas de emergência", cor: "#dc2626", icone: "Flame" },
  { nome: "Mecânica", setor: "MECANICA", descricao: "Redutores, bombas, motores, esteiras, teares e máquinas têxteis", cor: "#2563eb", icone: "Cog" },
  { nome: "Elétrica / SPDA", setor: "ELETRICA", descricao: "Quadros, painéis, SPDA, geradores, transformadores e nobreaks", cor: "#eab308", icone: "Zap" },
  { nome: "Ambiental", setor: "AMBIENTAL", descricao: "ETE, resíduos, água, emissões e conformidade ambiental", cor: "#16a34a", icone: "Leaf" },
  { nome: "Predial / Civil", setor: "PREDIAL", descricao: "Estrutura, telhados, hidráulica, portões e ar-condicionado", cor: "#94a3b8", icone: "Building2" },
  { nome: "Logística / Depósito", setor: "LOGISTICA", descricao: "Empilhadeiras, racks, paleteiras, içamento e movimentação", cor: "#f97316", icone: "Truck" },
  { nome: "Equipamentos de Emergência", setor: "SEGURANCA", descricao: "Kits de primeiros socorros, macas, DEA e lava-olhos", cor: "#ef4444", icone: "Cross" },
  { nome: "Administrativo", setor: "ADMINISTRATIVO", descricao: "Infraestrutura administrativa e escritórios", cor: "#64748b", icone: "Briefcase" },
]

function item(pergunta, tipo, obrigatorio = true, unidade) {
  return { ordem: 0, pergunta, tipo, obrigatorio, ...(unidade ? { unidade } : {}) }
}

const TIPOS = [
  // ============ SEGURANCA — Incêndio ============
  {
    nome: "Extintor de Incêndio — Conferência Visual (Mensal)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-23 + NBR 12962",
    procedimento: "Inspeção visual mensal do extintor: lacre, selo, pressão, validade e acesso.",
    checklist: [
      item("Lacre rompido ou ausente?", "SIM_NAO", true),
      item("Selo INMETRO presente e legível?", "SIM_NAO", true),
      item("Manômetro na faixa verde?", "SIM_NAO", true),
      item("Validade da recarga dentro do prazo?", "SIM_NAO", true),
      item("Pressão adequada", "VALOR", false, "kgf/cm²"),
      item("Acesso livre e desobstruído?", "SIM_NAO", true),
      item("Fixação e sinalização íntegras?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Hidrante — Inspeção Visual (Mensal)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-23 + NBR 13714",
    procedimento: "Verificação mensal de acesso, mangueiras, acoplamentos e válvulas dos hidrantes.",
    checklist: [
      item("Acesso ao abrigo desobstruído?", "SIM_NAO", true),
      item("Mangueira sem mofo, cortes ou vazamentos?", "SIM_NAO", true),
      item("Acoplamentos e reduções presentes?", "SIM_NAO", true),
      item("Válvula fecha/abre corretamente?", "SIM_NAO", true),
      item("Esguicho e chave de mangueira no local?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Hidrante — Teste de Pressão/Vazão (Anual)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "ANUAL",
    baseLegal: "NBR 13714",
    procedimento: "Teste hidrostático: pressão residual e vazão na ponta do esguicho.",
    checklist: [
      item("Pressão residual dentro da norma", "VALOR", true, "mca"),
      item("Vazão na ponta conforme projetada", "VALOR", true, "L/min"),
      item("Tubulação sem vazamentos visíveis?", "SIM_NAO", true),
      item("Registro de teste arquivado?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Extintor — Inspeção Técnica (Semestral/Anual)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "SEMESTRAL",
    baseLegal: "NBR 12962",
    procedimento: "Inspeção técnica periódica: pressão, peso, teste parcial e componentes.",
    checklist: [
      item("Peso dentro da tolerância especificada", "VALOR", true, "kg"),
      item("Pressão interna adequada?", "SIM_NAO", true),
      item("Componentes (pinos, alavanca, mangote) íntegros?", "SIM_NAO", true),
      item("Corpo sem corrosão, amassados ou vazamento?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Extintor — Manutenção 2º Nível (5 anos)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "QUINQUENAL",
    baseLegal: "NBR 12962",
    procedimento: "Manutenção de 2º nível a cada 5 anos: troca de carga e limpeza interna.",
    checklist: [
      item("Troca de carga executada?", "SIM_NAO", true),
      item("Limpeza interna do cilindro executada?", "SIM_NAO", true),
      item("Recertificação/etiqueta atualizada?", "SIM_NAO", true),
      item("Laudo da manutenção arquivado?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Iluminação de Emergência (Mensal)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-23 / NBR 5418",
    procedimento: "Teste mensal de 30s da iluminação de emergência e rotas de fuga.",
    checklist: [
      item("Acionamento automático funciona?", "SIM_NAO", true),
      item("Lâmpadas/LEDs todos acesos?", "SIM_NAO", true),
      item("Bateria mantém carga no teste?", "SIM_NAO", true),
      item("Rota de fuga sinalizada e desobstruída?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Saídas de Emergência e Rotas de Fuga (Mensal)",
    categoria: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-23",
    procedimento: "Verificação mensal de desobstrução, sinalização e abertura das saídas de emergência.",
    checklist: [
      item("Portas de emergência abrem para fora?", "SIM_NAO", true),
      item("Sem obstrução no caminho?", "SIM_NAO", true),
      item("Sinalização de saída visível e acesa?", "SIM_NAO", true),
      item("Barra antipânico operante?", "SIM_NAO", false),
    ],
  },
  {
    nome: "NR-12 — Sistemas de Segurança de Máquinas (Mensal)",
    categoria: "Mecânica",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-12",
    procedimento: "Verificação mensal de proteções, botões de emergência e foto-células.",
    checklist: [
      item("Proteções fixas presentes e íntegras?", "SIM_NAO", true),
      item("Intertravamentos funcionando?", "SIM_NAO", true),
      item("Botão/Botoeira de emergência operante?", "SIM_NAO", true),
      item("Foto-células/sensores respondem?", "SIM_NAO", true),
      item("Sinalização de risco no equipamento?", "SIM_NAO", false),
    ],
  },

  // ============ MECANICA ============
  {
    nome: "Ponte Rolante — Checklist Diário",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "DIARIA",
    baseLegal: "NR-11 + NR-12",
    procedimento: "Checklist diário antes do uso: estrutura, cabos, ganchos, freios e limitadores.",
    checklist: [
      item("Estrutura e vias sem trincas visíveis?", "SIM_NAO", true),
      item("Cabos de aço sem fios rompidos?", "SIM_NAO", true),
      item("Gancho sem deformação e com trava?", "SIM_NAO", true),
      item("Freios respondem?", "SIM_NAO", true),
      item("Limitadores de fim de curso operantes?", "SIM_NAO", true),
      item("Botoeiras e comandos funcionando?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Ponte Rolante — Laudo Técnico (Anual)",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "ANUAL",
    baseLegal: "NR-11 + NBR 16147 + ISO 4309/9927",
    procedimento: "Inspeção anual com ensaios não destrutivos, teste de carga e medições.",
    checklist: [
      item("Ensaios não destrutivos executados?", "SIM_NAO", true),
      item("Teste de carga realizado?", "SIM_NAO", true),
      item("Medições dentro da tolerância?", "SIM_NAO", true),
      item("Laudo com ART emitido?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Troca de Óleo — Redutores e Caixas",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "SEMESTRAL",
    baseLegal: "Manual do fabricante",
    procedimento: "Verificação de nível/qualidade e troca do óleo de redutores, caixas e acoplamentos.",
    checklist: [
      item("Nível de óleo correto?", "SIM_NAO", true),
      item("Cor do óleo adequada (sem contaminação)?", "SIM_NAO", true),
      item("Viscosidade dentro da especificação", "VALOR", true, "cSt"),
      item("Sem presença de partículas/água?", "SIM_NAO", true),
      item("Vazamentos no conjunto?", "SIM_NAO", true),
      item("Troca executada no prazo?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Bombas — Inspeção Visual (Mensal)",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "MENSAL",
    baseLegal: "Manual do fabricante",
    procedimento: "Inspeção mensal: vedações, vazamentos, temperatura, vibração e alinhamento de bombas.",
    checklist: [
      item("Vedação da bomba (gaxeta/mech.) sem vazamento?", "SIM_NAO", true),
      item("Temperatura do corpo/motor normal?", "SIM_NAO", true),
      item("Vibração dentro do padrão?", "SIM_NAO", true),
      item("Alinhamento do acoplamento OK?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Esteiras Transportadoras — Inspeção (Mensal)",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "MENSAL",
    baseLegal: "NR-12 / NBR 14562",
    procedimento: "Inspeção mensal de correias, roletes, tambores e tensão das esteiras.",
    checklist: [
      item("Correia sem cortes/desgaste excessivo?", "SIM_NAO", true),
      item("Roletes girando sem travar?", "SIM_NAO", true),
      item("Tambor sem acúmulo de material?", "SIM_NAO", true),
      item("Tensão da correia adequada?", "SIM_NAO", true),
      item("Guarda-corpo nas zonas de risco?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Rolamentos — Verificação (Semestral)",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "SEMESTRAL",
    baseLegal: "ISO 281 / fabricante",
    procedimento: "Avaliação de ruído, temperatura, folga e vibração dos rolamentos.",
    checklist: [
      item("Ruído anormal (apito/impacto)?", "SIM_NAO", true),
      item("Temperatura abaixo do limite", "VALOR", true, "°C"),
      item("Folga dentro da especificação?", "SIM_NAO", true),
      item("Vibração dentro dos níveis ISO 10816?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Compressores — Verificação (Semestral)",
    categoria: "Mecânica",
    setor: "MECANICA",
    periodicidade: "SEMESTRAL",
    baseLegal: "NR-13 (vasos) / fabricante",
    procedimento: "Verificação de condensado, filtros, óleo, temperatura, ruído e válvulas de segurança.",
    checklist: [
      item("Dreno de condensado funcionando?", "SIM_NAO", true),
      item("Filtros de ar/óleo limpos?", "SIM_NAO", true),
      item("Nível de óleo correto?", "SIM_NAO", true),
      item("Válvula de segurança íntegra?", "SIM_NAO", true),
      item("Temperatura e ruído normais?", "SIM_NAO", true),
    ],
  },

  // ============ ELETRICA ============
  {
    nome: "SPDA — Inspeção Visual (Semestral)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "SEMESTRAL",
    baseLegal: "NBR 5419",
    procedimento: "Inspeção visual de captores, descidas, aterramento e corrosão do SPDA.",
    checklist: [
      item("Captores sem corrosão/fixados?", "SIM_NAO", true),
      item("Descidas íntegras e conectadas?", "SIM_NAO", true),
      item("Conexões/abraçadeiras apertadas?", "SIM_NAO", true),
      item("Aterramento sem rompimentos?", "SIM_NAO", true),
      item("Observação de corrosão/anomalia", "OK_OBS", false),
    ],
  },
  {
    nome: "SPDA — Continuidade/Aterramento (1 a 3 anos)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "ANUAL",
    baseLegal: "NBR 5419",
    procedimento: "Medição de continuidade elétrica e resistência de aterramento.",
    checklist: [
      item("Resistência de aterramento", "VALOR", true, "Ω"),
      item("Continuidade das descidas confirmada?", "SIM_NAO", true),
      item("Laudo de medição emitido?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Quadros e Painéis — Inspeção Visual (Mensal)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "MENSAL",
    baseLegal: "NR-10",
    procedimento: "Limpeza, terminais, aquecimento, rótulos e portas dos quadros elétricos.",
    checklist: [
      item("Portas fechadas e travadas?", "SIM_NAO", true),
      item("Terminais sem aquecimento/oxidação?", "SIM_NAO", true),
      item("Disjuntores na posição correta?", "SIM_NAO", true),
      item("Rótulos/identificações legíveis?", "SIM_NAO", true),
      item("Acumulação de poeira/objetos?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Termografia de Quadros (Semestral)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "SEMESTRAL",
    baseLegal: "NR-10 / NBR 15763",
    procedimento: "Inspeção termográfica de pontos quentes, sobrecarga e conexões dos quadros.",
    checklist: [
      item("Ponto quente identificado?", "SIM_NAO", false),
      item("Temperatura máxima localizada", "VALOR", true, "°C"),
      item("Correção executada quando necessário?", "SIM_NAO", true),
      item("Relatório termográfico arquivado?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Grupo Gerador — Teste (Semanal/Mensal)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "SEMANAL",
    baseLegal: "NBR 15643 / fabricante",
    procedimento: "Teste do gerador sem carga (semanal) e com carga (mensal): óleo, água, bateria e filtros.",
    checklist: [
      item("Nível de óleo correto?", "SIM_NAO", true),
      item("Água/arrefecimento no nível?", "SIM_NAO", true),
      item("Bateria carregada (tensão)?", "SIM_NAO", true),
      item("Filtros de ar/óleo/combustível OK?", "SIM_NAO", true),
      item("Partida e estabilização da tensão?", "SIM_NAO", true),
      item("Diesel no nível?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Grupo Gerador — Troca de Óleo/Filtros (250h)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "OUTRA",
    diasIntervalo: 90,
    baseLegal: "Manual do fabricante",
    procedimento: "Troca de óleo e filtros a cada 250h ou conforme manual do fabricante.",
    checklist: [
      item("Horas registradas no trocador", "VALOR", true, "h"),
      item("Óleo trocado?", "SIM_NAO", true),
      item("Filtros de ar/óleo/combustível trocados?", "SIM_NAO", true),
      item("Registro da troca no plano de manutenção?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Transformador — Óleo Dielétrico (DGA) (Anual)",
    categoria: "Elétrica / SPDA",
    setor: "ELETRICA",
    periodicidade: "ANUAL",
    baseLegal: "NBR 5743 / IEC 60422",
    procedimento: "Análise de gases dissolvidos (DGA), umidade, acidez e cor do óleo dielétrico.",
    checklist: [
      item("Análise DGA coletada?", "SIM_NAO", true),
      item("Umidade dentro do limite", "VALOR", true, "ppm"),
      item("Rigidez dielétrica adequada", "VALOR", true, "kV"),
      item("Sem gás fora dos padrões?", "SIM_NAO", true),
    ],
  },

  // ============ AMBIENTAL ============
  {
    nome: "ETE — Análises Físico-Químicas (Mensal)",
    categoria: "Ambiental",
    setor: "AMBIENTAL",
    periodicidade: "MENSAL",
    baseLegal: "CONAMA 430 / estadual",
    procedimento: "Análises mensais de DBO, DQO, pH, óleos/graxas e coliformes do efluente tratado.",
    checklist: [
      item("DBO dentro do limite", "VALOR", true, "mg/L"),
      item("DQO dentro do limite", "VALOR", true, "mg/L"),
      item("pH dentro da faixa", "VALOR", true, "pH"),
      item("Óleos e graxas dentro do limite", "VALOR", true, "mg/L"),
      item("Coliformes dentro do limite", "VALOR", true, "NMP/100mL"),
    ],
  },
  {
    nome: "Potabilidade da Água (Semestral)",
    categoria: "Ambiental",
    setor: "AMBIENTAL",
    periodicidade: "SEMESTRAL",
    baseLegal: "NBR 5626 / Portaria MS 2914",
    procedimento: "Análise microbiológica e físico-química da água de consumo.",
    checklist: [
      item("Coliformes totais ausentes?", "SIM_NAO", true),
      item("Cloro residual dentro da faixa", "VALOR", true, "mg/L"),
      item("Turbidez dentro do limite", "VALOR", true, "NTU"),
      item("pH dentro da faixa", "VALOR", true, "pH"),
    ],
  },
  {
    nome: "Caixa d'Água — Limpeza/Inspeção (Semestral)",
    categoria: "Ambiental",
    setor: "AMBIENTAL",
    periodicidade: "SEMESTRAL",
    baseLegal: "NBR 5626",
    procedimento: "Limpeza, desinfecção e verificação de vedação da caixa d'água.",
    checklist: [
      item("Limpeza executada?", "SIM_NAO", true),
      item("Desinfecção (cloração) executada?", "SIM_NAO", true),
      item("Tampa/tela vedadas?", "SIM_NAO", true),
      item("Extravasor e limpeza operantes?", "SIM_NAO", true),
      item("Laudo de análise pós-limpeza OK?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Resíduos Sólidos — PGRS (Anual)",
    categoria: "Ambiental",
    setor: "AMBIENTAL",
    periodicidade: "ANUAL",
    baseLegal: "CONAMA 313 / Lei 12.305",
    procedimento: "Atualização do PGRS, segregação e destinação de resíduos.",
    checklist: [
      item("PGRS atualizado e divulgado?", "SIM_NAO", true),
      item("Segregação correta nos pontos?", "SIM_NAO", true),
      item("MTRs/destinações arquivados?", "SIM_NAO", true),
      item("Resíduos perigosos acondicionados/rotulados?", "SIM_NAO", true),
    ],
  },

  // ============ PREDIAL ============
  {
    nome: "Estrutura — Manifestações Patológicas (Anual)",
    categoria: "Predial / Civil",
    setor: "PREDIAL",
    periodicidade: "ANUAL",
    baseLegal: "NBR 6118",
    procedimento: "Inspeção anual de trincas, lajes, pilares e manifestações patológicas.",
    checklist: [
      item("Trincas/rachaduras novas detectadas?", "SIM_NAO", true),
      item("Lajes sem deslocamento/infiltração?", "SIM_NAO", true),
      item("Pilares/vigas sem fissuração?", "SIM_NAO", true),
      item("Corrosão de armaduras visível?", "SIM_NAO", true),
      item("Observação de anomalias", "OK_OBS", false),
    ],
  },
  {
    nome: "Telhado/Calhas/Rufos (Anual)",
    categoria: "Predial / Civil",
    setor: "PREDIAL",
    periodicidade: "ANUAL",
    baseLegal: "Boas práticas",
    procedimento: "Inspeção anual de telhas, fixações, calhas, rufos e caimento.",
    checklist: [
      item("Telhas sem quebras/deslocamentos?", "SIM_NAO", true),
      item("Fixações/parafusos apertados?", "SIM_NAO", true),
      item("Calhas limpas e com caimento?", "SIM_NAO", true),
      item("Rufos sem descolamento?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Ar-Condicionado — Filtros/Limpeza (Mensal)",
    categoria: "Predial / Civil",
    setor: "PREDIAL",
    periodicidade: "MENSAL",
    baseLegal: "NBR 14518",
    procedimento: "Limpeza mensal de filtros e verificação de condensadoras.",
    checklist: [
      item("Filtros limpos?", "SIM_NAO", true),
      item("Condensadora sem bloqueio de ar?", "SIM_NAO", true),
      item("Dreno desobstruído?", "SIM_NAO", true),
      item("Sem vazamento de água?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Instalações Hidráulicas/Sanitárias (Semestral)",
    categoria: "Predial / Civil",
    setor: "PREDIAL",
    periodicidade: "SEMESTRAL",
    baseLegal: "Boas práticas",
    procedimento: "Verificação semestral de vazamentos, canos, registros e redes sanitárias.",
    checklist: [
      item("Vazamentos em tubulações?", "SIM_NAO", true),
      item("Registros/válvulas operantes?", "SIM_NAO", true),
      item("Pressão da rede adequada?", "SIM_NAO", true),
      item("Redes sanitárias sem obstrução?", "SIM_NAO", true),
    ],
  },

  // ============ LOGISTICA ============
  {
    nome: "Empilhadeira — Checklist Diário do Operador",
    categoria: "Logística / Depósito",
    setor: "LOGISTICA",
    periodicidade: "DIARIA",
    baseLegal: "NR-11 + NR-12",
    procedimento: "Checklist diário antes do uso: freios, luzes, buzina, pneus, mastro e hidráulico.",
    checklist: [
      item("Freios de serviço e estacionamento?", "SIM_NAO", true),
      item("Luzes e buzina funcionando?", "SIM_NAO", true),
      item("Pneus sem desgaste/cortes?", "SIM_NAO", true),
      item("Mastro e cilindro sem vazamento?", "SIM_NAO", true),
      item("Nível do sistema hidráulico OK?", "SIM_NAO", true),
      item("Garfo e daime sem deformação?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Empilhadeira — Vistoria Competencial (Anual)",
    categoria: "Logística / Depósito",
    setor: "LOGISTICA",
    periodicidade: "ANUAL",
    baseLegal: "NR-11 + NBR 14735",
    procedimento: "Vistoria anual com laudo técnico, ART e teste de carga.",
    checklist: [
      item("Laudo técnico emitido?", "SIM_NAO", true),
      item("Teste de carga realizado?", "SIM_NAO", true),
      item("Anotações de responsabilidade técnica (ART)?", "SIM_NAO", true),
      item("Não conformidades corrigidas?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Racks/Estantes — Inspeção (Anual + pós-impacto)",
    categoria: "Logística / Depósito",
    setor: "LOGISTICA",
    periodicidade: "ANUAL",
    baseLegal: "NBR 14764",
    procedimento: "Inspeção de deformação, fixação, rótulos de capacidade e estado dos racks.",
    checklist: [
      item("Colunas sem deformação/amassados?", "SIM_NAO", true),
      item("Fixações/chumbadores apertados?", "SIM_NAO", true),
      item("Rótulos de capacidade visíveis?", "SIM_NAO", true),
      item("Vigas sem empenamento?", "SIM_NAO", true),
      item("Proteção de coluna presente?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Cintas Têxteis de Içamento (Anual)",
    categoria: "Logística / Depósito",
    setor: "LOGISTICA",
    periodicidade: "ANUAL",
    baseLegal: "NBR 15637",
    procedimento: "Verificação de cortes, costuras e identificação das cintas de içamento.",
    checklist: [
      item("Cortes/fibras rompidas?", "SIM_NAO", true),
      item("Costuras íntegras?", "SIM_NAO", true),
      item("Etiqueta de carga legível?", "SIM_NAO", true),
      item("Critérios de descarte avaliados?", "SIM_NAO", true),
    ],
  },

  // ============ EMERGENCIA ============
  {
    nome: "Kit de Primeiros Socorros (Mensal)",
    categoria: "Equipamentos de Emergência",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NR-07 / sanitária",
    procedimento: "Conferência mensal de validade, completude e reposição do kit.",
    checklist: [
      item("Itens completos?", "SIM_NAO", true),
      item("Materiais dentro da validade?", "SIM_NAO", true),
      item("Sinalização do kit visível?", "SIM_NAO", true),
      item("Reposição necessária registrada?", "SIM_NAO", false),
    ],
  },
  {
    nome: "Desfibrilador (DEA) — Teste (Mensal)",
    categoria: "Equipamentos de Emergência",
    setor: "SEGURANCA",
    periodicidade: "MENSAL",
    baseLegal: "NBR 14710",
    procedimento: "Teste automático do DEA, validade dos eletrodos e bateria.",
    checklist: [
      item("Teste automático passou?", "SIM_NAO", true),
      item("Eletrodos dentro da validade?", "SIM_NAO", true),
      item("Bateria adequada?", "SIM_NAO", true),
      item("Sinalização do local preservada?", "SIM_NAO", true),
    ],
  },
  {
    nome: "Maca/Padiola (Semestral)",
    categoria: "Equipamentos de Emergência",
    setor: "SEGURANCA",
    periodicidade: "SEMESTRAL",
    baseLegal: "Boas práticas",
    procedimento: "Verificação de funcionamento e limpeza da maca/padiola.",
    checklist: [
      item("Estrutura e correias íntegras?", "SIM_NAO", true),
      item("Fixações/imobilizações funcionando?", "SIM_NAO", true),
      item("Limpeza e guarda adequadas?", "SIM_NAO", true),
    ],
  },
]

async function seedDb(name, url) {
  if (!url) {
    console.log(`[${name}] URL ausente — pulando`)
    return
  }
  const sql = postgres(url, { max: 2 })
  try {
    let categoriasCriadas = 0
    let tiposCriados = 0

    for (const c of CATEGORIAS) {
      const [exist] = await sql`SELECT id FROM ativos_categorias WHERE nome = ${c.nome} LIMIT 1`
      if (exist) continue
      await sql`
        INSERT INTO ativos_categorias (nome, setor, descricao, cor, icone)
        VALUES (${c.nome}, ${c.setor}, ${c.descricao}, ${c.cor}, ${c.icone})
      `
      categoriasCriadas++
    }

    for (const [idx, t] of TIPOS.entries()) {
      const [exist] = await sql`SELECT id FROM ativos_tipos_vistoria WHERE nome = ${t.nome} LIMIT 1`
      if (exist) continue

      const categoria = CATEGORIAS.find((c) => c.nome === t.categoria)
      const categoriaId = categoria
        ? (await sql`SELECT id FROM ativos_categorias WHERE nome = ${categoria.nome} LIMIT 1`)[0]?.id ?? null
        : null

      const checklist = (t.checklist || []).map((i, ordem) => ({ ...i, ordem }))
      const diasIntervalo = t.periodicidade === "OUTRA" && t.diasIntervalo ? t.diasIntervalo : null

      await sql`
        INSERT INTO ativos_tipos_vistoria (nome, categoria_id, setor, procedimento, checklist, periodicidade, dias_intervalo, base_legal)
        VALUES (${t.nome}, ${categoriaId}, ${t.setor}, ${t.procedimento}, ${JSON.stringify(checklist)}, ${t.periodicidade}, ${diasIntervalo}, ${t.baseLegal})
      `
      tiposCriados++
      if (idx % 5 === 0) process.stdout.write(".")
    }
    process.stdout.write("\n")
    console.log(`[${name}] categorias criadas: ${categoriasCriadas}, tipos criados: ${tiposCriados}`)
  } catch (err) {
    console.error(`[${name}] erro:`, err.message)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES
  for (const db of alvos) {
    await seedDb(db.name, db.url)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})