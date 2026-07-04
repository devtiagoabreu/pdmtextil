-- ============================================================
-- SEED: Módulos e Lições de Treinamento CRM
-- Criado por: Tiago de Abreu - Engenheiro de Dados
-- ============================================================

-- Limpa dados existentes para recriar (lições primeiro por causa da FK)
DELETE FROM crm_treino_licoes;
DELETE FROM crm_treino_modulos;

-- Reset sequence
ALTER SEQUENCE crm_treino_modulos_id_seq RESTART WITH 1;
ALTER SEQUENCE crm_treino_licoes_id_seq RESTART WITH 1;

-- ============================================================
-- MÓDULO 1: Boas-Vindas ao CRM — Nossa Nova Cultura
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Boas-Vindas ao CRM — Nossa Nova Cultura', 'Por que estamos adotando o CRM, o que ele muda no nosso dia a dia e como todos ganhamos com isso.', 'GraduationCap', '#6366f1', 1);

-- Lição 1.1
WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 1)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'O que é CRM e por que ele é tão importante?',
$$## 🌟 O que é CRM?

CRM significa **Customer Relationship Management** — ou, em português claro: **Gestão do Relacionamento com o Cliente**.

Imagine que antes do CRM, cada vendedor tinha suas anotações em papéis, blocos de notas, WhatsApp, cabeça... **Cada um do seu jeito**. O CRM é o **lugar único** onde toda a história do cliente fica registrada:

- 📞 Quem ligou, quando e por quê
- 📧 O que foi prometido
- 🤝 Quais visitas já foram feitas
- 💰 Quais propostas estão em andamento
- 📊 Quantas vendas foram fechadas ou perdidas

### Por que a PDM Têxtil está adotando o CRM?

| Antes (sem CRM) | Agora (com CRM) |
|---|---|
| Informação espalhada | Tudo em um lugar só |
| Cliente esquecido | Histórico completo |
| Vendas dependem de uma pessoa | Time trabalha junto |
| Decisão no achismo | Decisão com dados |
| Retrabalho | Eficiência |

> 💡 **Mensagem do Tiago:** "Este CRM foi construído com carinho para ajudar **você** a vender mais e melhor. Não é um sistema de controle — é uma ferramenta de **libertação**. Com ele, você nunca mais vai esquecer um compromisso, perder uma oportunidade ou deixar um cliente sem resposta. **Use com orgulho!**"

### O que muda no meu dia a dia?

1. **Antes:** "Deixa eu ver onde eu anotei o telefone daquele cliente..."
   **Agora:** Abre o CRM, busca pelo nome, **pronto**.

2. **Antes:** "Eu juro que mandei aquela proposta semana passada..."
   **Agora:** O CRM mostra a data, o status, o valor — **sem achismo**.

3. **Antes:** "O fulano que atendia esse cliente saiu da empresa, perdemos o histórico..."
   **Agora:** O histórico **fica na empresa**, não na pessoa.

### Para quem é o CRM?

- ✅ **Comercial (vendedores, representantes, gerentes)** — uso diário
- ✅ **Marketing** — para saber quais campanhas geram leads
- ✅ **Diretoria** — para acompanhar indicadores
- ✅ **Administrativo** — para ver propostas e contratos
- ✅ **Todo mundo que fala com cliente** — sim, você também!

### Como começar?

Não precisa saber tudo de uma vez. Vá módulo por módulo. Comece por este treinamento, depois **abra o CRM e explore**. A melhor forma de aprender é **usando**. E se tiver dúvida, pergunte — o CRM é nosso, de todos nós. 💙

---
*"CRM não é sobre tecnologia, é sobre **pessoas**. Pessoas atendendo melhor outras pessoas."* — Tiago de Abreu
$$, NULL, NULL, 1);

-- Lição 1.2
WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 1)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Como acessar e navegar no CRM',
$$## 🖥️ Acessando o CRM

1. Abra seu navegador (Chrome, Edge, Firefox)
2. Acesse o endereço que sua equipe de TI informou
3. Faça login com seu **usuário e senha** (mesmo do sistema)

### Primeira tela: o Dashboard

Assim que você entrar, vai ver o **Dashboard** — o painel principal do CRM.

![Dashboard CRM](https://placehold.co/800x400/6366f1/ffffff?text=Dashboard)

Ele mostra tudo que importa de um pulo só:

| Área | O que mostra |
|---|---|
| 📊 **Resumo** | Empresas, leads, oportunidades ativas |
| 💰 **Previsão de Vendas** | Quanto está previsto para este mês |
| 📈 **Funil** | Quantas oportunidades em cada etapa |
| 🔄 **Conversão** | Taxa de conversão em vendas |
| 🏆 **Top Empresas** | Maiores oportunidades |
| ⏰ **Timeline Recente** | Últimas atividades |

### Barra de navegação (menu lateral)

No canto esquerdo da tela, você encontra o menu. Clique em **Comercial** e depois em **CRM** para ver todas as telas:

```
📊 Comercial
  └── 🤝 CRM
       ├── 📊 Dashboard
       ├── 🏢 Empresas
       ├── 👥 Contatos
       ├── 📋 Leads
       ├── 💼 Oportunidades
       ├── 📄 Propostas
       ├── 📅 Visitas
       ├── ✅ Tarefas
       ├── 📈 Relatórios
       ├── 💬 WhatsApp
       ├── 📣 Campanhas
       ├── ⚙️ Configurações
       └── 🎓 Treinamento
```

### Dicas de navegação

- 🔍 **Busca** — Use a busca do navegador (Ctrl+F) para achar registros em listas
- 📱 **Responsivo** — Funciona no celular também
- 🌙 **Modo escuro** — Se preferir, ative o modo escuro nas configurações
- ℹ️ **Botão "i"** — Em cada tela, clique no ícone de informação para ver uma explicação rápida

### Seu perfil

No canto superior direito, clique no seu nome para:
- Ver seus dados
- Sair do sistema

> ✅ **Pronto para começar?** Vá para o próximo módulo: **Empresas — A Base de Tudo**
$$, NULL, '/comercial/crm', 2);

-- ============================================================
-- MÓDULO 2: Empresas — A Base de Tudo
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Empresas — A Base de Tudo', 'No CRM da PDM Têxtil, a empresa é o centro de tudo. Aprenda a cadastrar, buscar e manter os dados das empresas organizados.', 'BookOpen', '#f97316', 2);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 2)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando uma nova empresa',
$$## 🏢 Por que a empresa é o centro?

Diferente de outros CRMs que focam em leads ou contatos, aqui na PDM Têxtil a **empresa** é o coração do sistema. Tudo gira em torno dela:

- Contatos trabalham **na** empresa
- Oportunidades são **com** a empresa
- Visitas são **na** empresa
- Propostas são **para** a empresa
- WhatsApp é **com** a empresa

> 🌟 **Regra de ouro:** *Sempre cadastre a empresa primeiro!* Depois você adiciona contatos, oportunidades, etc.

### Criando uma empresa

1. Vá em **CRM → Empresas**
2. Clique no botão **"Nova Empresa"** (geralmente azul ou verde)
3. Preencha os campos:

### Campos do cadastro — explicando um por um

| Campo | Obrigatório? | O que é | Dica de preenchimento |
|---|---|---|---|
| **Razão Social** | ✅ Sim | Nome oficial da empresa, igual no CNPJ | Sem abreviações |
| **Nome Fantasia** | Não | Nome popular, como é conhecida | Como o cliente se apresenta |
| **CNPJ** | ✅ Sim (único) | CPNJ com pontuação | Ex: 00.000.000/0001-00 |
| **Segmento** | Não | Ramo de atuação | Ex: Confecção, Lavanderia, Estamparia |
| **Porte** | Não | Tamanho da empresa | ME, EPP, Médio, Grande |
| **Site** | Não | Endereço do site | Opcional, mas útil |
| **Status** | Não | Situação atual | NOVO (padrão), ATIVO, INATIVO, PROSPECTO |
| **Responsável** | Não | Quem cuida dessa conta | Geralmente você mesmo |

### Depois de salvar

Após criar, você vai para a **página de detalhe da empresa**. Lá você encontra:

- 📋 **Dados da empresa** — Resumo completo
- 👥 **Contatos** — Pessoas que trabalham lá
- 💼 **Oportunidades** — Negócios em andamento
- 📄 **Propostas** — Propostas enviadas
- 📅 **Visitas** — Visitas realizadas/agendadas
- ✅ **Tarefas** — Compromissos pendentes
- 💬 **WhatsApp** — Conversas registradas
- ⏰ **Timeline** — Histórico completo de tudo

> 💡 **Dica importante:** Capriche no cadastro! Um CNPJ correto, segmento bem classificado e dados completos fazem **toda a diferença** na hora de gerar relatórios e na IA sugerir ações.

$$, 'Nenhum. Apenas seu login no sistema.', '/comercial/crm/empresas/nova', 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 2)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Buscando, editando e gerenciando empresas',
$$## 🔍 Como encontrar uma empresa

Na lista de empresas, você pode:

1. **Buscar pelo nome** — Digite na barra de busca
2. **Buscar pelo CNPJ** — Funciona também
3. **Filtrar por status** — NOVO, ATIVO, INATIVO
4. **Filtrar por responsável** — Ver só as suas ou de um colega
5. **Ordenar** — Por nome, data, status

### Editando uma empresa

1. Clique no nome da empresa para abrir o detalhe
2. Clique no botão **Editar** (geralmente um lápis ✏️)
3. Altere os campos necessários
4. Salve

> ⚠️ **Atenção:** O CNPJ não pode ser alterado depois de criado (para evitar duplicidade). Se cadastrou errado, é melhor criar uma nova e inativar a antiga.

### Status das empresas

Cada empresa tem um status que indica o momento do relacionamento:

| Status | Significado | O que fazer |
|---|---|---|
| 🆕 **NOVO** | Acabou de ser cadastrada | Primeiro contato pendente |
| ✅ **ATIVO** | Cliente ativo, com negócios | Manter relacionamento |
| 💤 **INATIVO** | Sem movimento há muito tempo | Tentar reativar |
| 🔍 **PROSPECTO** | Potencial, ainda não comprou | Qualificar e converter |

### Duplicidade de empresas

O sistema **não permite** dois CNPJs iguais. Mas se por acaso você encontrar empresas duplicadas:

1. Mantenha a empresa com mais informações
2. Migre os contatos e oportunidades para ela
3. Inative a duplicada

### Dica de ouro 💛

> **Mantenha os dados sempre atualizados!** Uma empresa com telefone errado, site quebrado ou segmento em branco vale muito menos. Reserve 5 minutos por dia para revisar suas empresas.

$$, 'Empresas criadas', '/comercial/crm/empresas', 2);

-- ============================================================
-- MÓDULO 3: Contatos — As Pessoas por Trás das Empresas
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Contatos — As Pessoas por Trás das Empresas', 'Empresas são feitas de pessoas. Aprenda a cadastrar e gerenciar os contatos de cada empresa.', 'BookOpen', '#22c55e', 3);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 3)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando e gerenciando contatos',
$$## 👤 O que é um contato?

Contato é a **pessoa física** que trabalha na empresa. Pode ser:
- O dono
- O gerente de produção
- O comprador
- O assistente
- A recepcionista

> 🎯 **Todo contato pertence a uma empresa.** Não existe contato solto no sistema. Se a empresa não existe, cadastre ela primeiro!

### Criando um contato

Existem dois jeitos:

**Jeito 1 — Dentro da empresa:**
1. Abra a empresa
2. Vá na aba **Contatos**
3. Clique em **"Novo Contato"**

**Jeito 2 — Pelo menu:**
1. Vá em **CRM → Contatos → Novo Contato**
2. Selecione a empresa

### Campos do contato

| Campo | Obrigatório? | Por que é importante |
|---|---|---|
| **Nome** | ✅ Sim | Óbvio, mas capriche no nome completo |
| **Cargo** | Não | Ajuda a saber com quem está falando |
| **E-mail** | Não | Para enviar propostas e contato |
| **Telefone** | Não | Ramal comercial |
| **Celular** | Não | WhatsApp, contato direto |
| **WhatsApp** | Não | Número do WhatsApp (pode ser diferente do celular) |
| **Principal** | Não | Marque se é a pessoa mais importante da empresa |
| **Observações** | Não | Qualquer info relevante |

### Contato principal

Cada empresa pode ter um **contato principal** — a pessoa mais importante para o relacionamento. Marque a caixinha "Principal" no cadastro.

> 💡 **Dica:** Se você fala sempre com o João, que é o comprador, marque ele como principal. Assim, na lista de empresas, já aparece o contato certo.

### Buscando contatos

Na lista de contatos você pode:
- Buscar por **nome**
- Buscar por **empresa**
- Filtrar por **principal**
- Ver todos ou só os seus

### Editando/excluindo

- **Editar:** Clique no contato, altere, salve
- **Excluir:** Só se realmente estiver errado. Prefira editar.

> 🔒 **Regra:** Se o contato já tem oportunidades, visitas ou propostas vinculadas, não exclua — apenas edite os dados.

$$, 'Empresas cadastradas no sistema', '/comercial/crm/contatos/novo', 1);

-- ============================================================
-- MÓDULO 4: Leads — O Início de Tudo
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Leads — O Início de Tudo', 'Leads são oportunidades em potencial. Entenda como capturar, classificar e nutrir leads até virarem clientes.', 'BookOpen', '#ef4444', 4);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 4)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'O que é um lead e como cadastrar',
$$## 📋 O que é um Lead?

**Lead** é uma pessoa que **demonstrou interesse** nos produtos/serviços da PDM Têxtil, mas **ainda não é cliente**.

Exemplos de leads:
- Alguém que preencheu um formulário no site
- Uma indicação de outro cliente
- Alguém que mandou WhatsApp perguntando preços
- Um visitante de feira que deixou o cartão
- Uma empresa que você pesquisou e parece promissora

> 🔄 **Jornada do Lead:** Lead → Oportunidade → Proposta → Cliente

### Cadastrando um lead

1. Vá em **CRM → Leads → Novo Lead**
2. Informe os dados

### Campos do lead

| Campo | Obrigatório? | Explica |
|---|---|---|
| **Nome** | ✅ Sim | Nome da pessoa |
| **E-mail** | Não | Para contato |
| **Telefone** | Não | Telefone fixo |
| **Celular** | Não | WhatsApp |
| **Empresa** | Não | Onde trabalha |
| **Cargo** | Não | Cargo na empresa |
| **Origem** | ✅ (padrão OUTRO) | De onde veio: SITE, INDICACAO, FEIRA, WHATSAPP, LIGACAO, REDE_SOCIAL, OUTRO |
| **Status** | ✅ (padrão NOVO) | NOVO, CONTATADO, QUALIFICADO, CONVERTIDO, PERDIDO |
| **Descrição** | Não | Como conheceu a gente, o que precisa |
| **Responsável** | Não | Quem vai cuidar |

### Origens do lead — por que isso importa?

Saber de onde o lead veio ajuda a entender **o que está funcionando**:

| Origem | Exemplo |
|---|---|
| 📱 **SITE** | Formulário de contato no site |
| 🙋 **INDICACAO** | "O João da empresa X indicou vocês" |
| 🎪 **FEIRA** | Cartão coletado em evento |
| 💬 **WHATSAPP** | Mensagem no WhatsApp comercial |
| 📞 **LIGACAO** | Telefonou para a empresa |
| 🌐 **REDE_SOCIAL** | Instagram, Facebook, LinkedIn |
| 📌 **OUTRO** | Outras origens |

### Status do lead

| Status | O que significa | Próximo passo |
|---|---|---|
| 🆕 **NOVO** | Acabou de chegar | Entrar em contato |
| 📞 **CONTATADO** | Já falamos com ele | Qualificar |
| 🎯 **QUALIFICADO** | Tem potencial real | Criar oportunidade |
| ✅ **CONVERTIDO** | Virou cliente | Move para empresa/oportunidade |
| ❌ **PERDIDO** | Não vai dar negócio | Registrar motivo |

### Dica de ouro 💛

> **Nem todo lead vira cliente, mas todo lead merece atenção.** Responda rápido, seja educado e registre TUDO no CRM. Um lead tratado com carinho hoje pode ser um grande cliente amanhã.

$$, 'Empresas cadastradas (se o lead for de uma empresa existente)', '/comercial/crm/leads/novo', 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 4)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Gerenciando leads e o score de IA',
$$## 🔍 Como gerenciar seus leads

Na lista de **Leads** você pode:
- Buscar por nome
- Filtrar por **origem** (de onde vieram)
- Filtrar por **status** (NOVO, CONTATADO, etc.)
- Filtrar por **responsável** (seus ou da equipe)
- Ver o **score** (nota de 0 a 100)

### Score de lead — o que é?

O **Score** é uma nota que o sistema dá para cada lead, de **0 a 100**, que indica o **potencial daquele lead**. Quanto maior, melhor!

| Score | Cor | Significado |
|---|---|---|
| 🟢 **70+** | Verde | Lead quente! Grande potencial |
| 🟡 **40-69** | Amarelo | Lead morno, merece atenção |
| 🔴 **< 40** | Vermelho | Lead frio, baixo potencial |

### Como o score é calculado?

A **IA Comercial** analisa automaticamente:
- Segmento da empresa (se é um segmento promissor)
- Porte (empresa grande tem mais potencial)
- Origem do lead (indicação vale mais que site)
- Histórico de conversão de leads similares

### O que fazer com cada lead

| Score | Ação recomendada |
|---|---|
| 🟢 **70+** | **Prioridade máxima!** Contate imediatamente |
| 🟡 **40-69** | Entre em contato, busque qualificar |
| 🔴 **< 40** | Coloque em nutrição, não descarte |

### Convertendo lead em oportunidade

Quando um lead está **QUALIFICADO** e parece promissor:
1. Abra o lead
2. Clique em **"Criar Oportunidade"**
3. Pronto! Agora é uma oportunidade de verdade

> 💡 **Dica:** Se o lead tem empresa vinculada, ótimo. Se não, você pode criar a empresa na hora da conversão.

$$, 'Leads cadastrados', '/comercial/crm/leads', 2);

-- ============================================================
-- MÓDULO 5: Oportunidades — O Coração das Vendas
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Oportunidades — O Coração das Vendas', 'Oportunidades são negócios em andamento. Acompanhe cada etapa do pipeline de vendas e não perca nenhuma venda.', 'BookOpen', '#8b5cf6', 5);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 5)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Criando e gerenciando oportunidades',
$$## 💼 O que é uma Oportunidade?

**Oportunidade** é uma **venda em potencial** que está sendo trabalhada. Diferente do lead (que é só um contato inicial), a oportunidade já tem um negócio sendo discutido.

> 🎯 **Resumo:** Lead é "quem". Oportunidade é "o que".

### Criando uma oportunidade

1. Vá em **CRM → Oportunidades → Nova Oportunidade**
2. Ou dentro de uma **Empresa**, vá na aba Oportunidades

### Campos da oportunidade

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Título** | ✅ Sim | Ex: "Venda de 500m de tecido Oxford" |
| **Descrição** | Não | Detalhes do que o cliente precisa |
| **Valor Estimado** | Não | Quanto você acha que vale o negócio |
| **Status** | ✅ (padrão NOVO) | Etapa do pipeline |
| **Lead** | Não | De qual lead veio (se veio de lead) |
| **Empresa** | Não | Para qual empresa |
| **Contato** | Não | Com quem está falando |
| **Responsável** | Não | Quem está tocando |
| **Data Fechamento Prevista** | Não | Quando acha que vai fechar |
| **Probabilidade** | Não | Chance de fechar (0-100%) |

### Pipeline de vendas — as etapas

Toda oportunidade passa por etapas. Pense como uma escada:

```
    🆕 NOVO
       ⬇️
    📞 QUALIFICACAO
       ⬇️
    📄 PROPOSTA
       ⬇️
    🤝 NEGOCIACAO
       ⬇️
    ✅ FECHADO_GANHO  │  ❌ FECHADO_PERDIDO
```

| Etapa | O que fazer |
|---|---|
| 🆕 **NOVO** | Acabou de identificar. Entenda a necessidade |
| 📞 **QUALIFICACAO** | Descubra orçamento, prazo, decisor |
| 📄 **PROPOSTA** | Envie a proposta formal |
| 🤝 **NEGOCIACAO** | Ajuste preço/prazo/condições |
| ✅ **FECHADO_GANHO** | VENDEU! 🎉 Parabéns! |
| ❌ **FECHADO_PERDIDO** | Não deu. Registre o motivo |

### Probabilidade de fechamento

| Estágio | Probabilidade típica |
|---|---|
| 🆕 NOVO | 10% |
| 📞 QUALIFICACAO | 25% |
| 📄 PROPOSTA | 50% |
| 🤝 NEGOCIACAO | 75% |
| ✅ FECHADO_GANHO | 100% |

> 💡 **Use a probabilidade para priorizar:** Se você tem 20 oportunidades, foque nas que estão em NEGOCIACAO com 75%+.

### Motivo de perda

Se uma oportunidade for perdida, **sempre registre o motivo**:
- ⚠️ **PRECO** — Preço muito alto
- ⚠️ **PRAZO** — Prazo não atendeu
- ⚠️ **CONCORRENCIA** — Escolheu outro fornecedor
- ⚠️ **SEM_NEED** — Não tinha necessidade real
- ⚠️ **OUTRO** — Outros motivos

> Isso ajuda a diretoria a entender **por que estamos perdendo vendas** e tomar ações corretivas.

$$, 'Empresas cadastradas. Contatos cadastrados (se quiser vincular).', '/comercial/crm/oportunidades/nova', 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 5)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Kanban: visualizando oportunidades em etapas',
$$## 📊 O que é o Kanban?

O Kanban é um jeito **visual** de ver suas oportunidades organizadas por etapa. Parece um quadro com colunas:

```
┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│  NOVO    │ │ QUALIFICACAO │ │ PROPOSTA │ │ NEGOCIACAO   │ │ FECHADO_GANHO│ FECHADO_PERDIDO│
│          │ │              │ │          │ │              │ │             │ │              │
│ [Card]   │ │ [Card]       │ │ [Card]   │ │ [Card]       │ │ [Card]      │ │ [Card]       │
│ [Card]   │ │              │ │          │ │              │ │             │ │              │
└──────────┘ └──────────────┘ └──────────┘ └──────────────┘ └─────────────┘ └──────────────┘
```

### Como usar o Kanban

1. Vá em **CRM → Oportunidades** e clique em **Kanban**
2. Veja todas as oportunidades em cards
3. **Arraste** um card de uma coluna para outra para mudar o status

### Informações no card

Cada card mostra:
- 🏷️ Título da oportunidade
- 💰 Valor estimado
- 🏢 Empresa
- 👤 Responsável
- 📅 Data prevista

### Por que o Kanban é tão útil?

| Antes | Agora |
|---|---|
| "Não sei quantas propostas estão em negociação" | "Vejo todas de uma vez" |
| "Preciso perguntar pra cada vendedor" | "O quadro mostra o pipeline completo" |
| "Esqueci de atualizar o status" | "Arrasto e pronto, já atualiza" |

### Dica de ouro 💛

> **Atualize o Kanban todo dia!** No começo do expediente, gaste 2 minutos arrastando cada oportunidade para a etapa correta. Isso muda **completamente** sua visão do negócio.

$$, 'Oportunidades criadas', '/comercial/crm/oportunidades', 2);

-- ============================================================
-- MÓDULO 6: Propostas — Fechando Negócios
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Propostas — Fechando Negócios', 'Crie, envie e acompanhe propostas comerciais. Saiba exatamente quais propostas estão em aberto e quais foram aceitas.', 'BookOpen', '#14b8a6', 6);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 6)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Criando e acompanhando propostas',
$$## 📄 O que é uma Proposta?

Proposta é o **documento formal** que você envia para o cliente com:
- O que está sendo vendido
- Preço
- Condições de pagamento
- Prazo de entrega

### Criando uma proposta

1. Vá em **CRM → Propostas → Nova Proposta**
2. Ou dentro de uma **Oportunidade**, clique em "Criar Proposta"

### Campos da proposta

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Título** | ✅ Sim | Ex: "Proposta de fornecimento Oxford | |
| **Empresa** | ✅ Sim | Para quem é |
| **Oportunidade** | Não | Vincule à oportunidade correspondente |
| **Valor** | Não | Valor total da proposta |
| **Descrição** | Não | Detalhamento do que está sendo proposto |
| **Condições de Pagamento** | Não | Ex: 30/60/90 dias, à vista com desconto |
| **Prazo de Entrega** | Não | Ex: "30 dias após aprovação" |
| **Arquivo** | Não | URL do PDF ou documento |

### Status da proposta

| Status | Significado |
|---|---|
| 📤 **ENVIADA** | Acabou de enviar para o cliente |
| ✅ **ACEITA** | Cliente aprovou! 🎉 |
| ❌ **RECUSADA** | Cliente recusou |
| 🔄 **REVISAO** | Cliente pediu alterações |

### De olho nas propostas

Na lista de propostas, fique de olho:
- 🔴 **Vermelho:** Recusadas — entenda por quê
- 🟡 **Amarelo:** Em revisão — precisa ajustar
- 🟢 **Verde:** Aceitas — comemore! 🎉
- 🔵 **Azul:** Enviadas — aguardando retorno

### Dica de ouro 💛

> **Uma proposta parada há mais de 15 dias provavelmente está perdida.** Se o status é ENVIADA há semanas, ligue para o cliente. Não deixe a proposta esfriar!

$$, 'Oportunidades em andamento (recomendado, mas não obrigatório)', '/comercial/crm/propostas/nova', 1);

-- ============================================================
-- MÓDULO 7: Visitas — Relacionamento que Gera Negócio
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Visitas — Relacionamento que Gera Negócio', 'Registre cada visita comercial: presenciais, por vídeo ou telefone. O histórico de visitas é o que constrói o relacionamento.', 'BookOpen', '#06b6d4', 7);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 7)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Agendando e registrando visitas',
$$## 📅 O que é uma Visita?

Visita é qualquer **interação programada** com o cliente. Pode ser:

| Tipo | O que é |
|---|---|
| 🏢 **PRESENCIAL** | Você foi até a empresa do cliente |
| 📹 **VIDEO** | Chamada de vídeo (Zoom, Meet, WhatsApp) |
| 📞 **TELEFONE** | Ligação telefônica agendada |

> 🌟 **Regra de ouro:** *Toda interação importante com o cliente merece ser registrada como visita!*

### Agendando uma visita

1. Vá em **CRM → Visitas → Nova Visita**
2. Preencha:

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Empresa** | ✅ Sim | Onde será a visita |
| **Data da Visita** | ✅ Sim | Quando |
| **Tipo** | ✅ (padrão PRESENCIAL) | Presencial, Vídeo ou Telefone |
| **Contato** | Não | Com quem vai falar |
| **Oportunidade** | Não | Se for sobre um negócio específico |
| **Status** | ✅ (padrão AGENDADA) | AGENDADA, REALIZADA, CANCELADA |
| **Relato** | Não | O que aconteceu (preencha DEPOIS da visita) |
| **Fotos** | Não | Fotos da visita (se aplicável) |

### Fluxo de uma visita

```
📅 AGENDADA  →  ✅ REALIZADA  →  (relato + fotos)
              ↘  ❌ CANCELADA  →  (motivo)
```

### O relato da visita

Depois de realizar a visita, **preencha o relato**:
- O que o cliente disse?
- Qual o humor dele?
- Há novidades?
- Próximos passos?

> 💡 Um bom relato é objetivo, mas completo. Escreva como se estivesse contando para um colega que não estava lá.

### Fotos na visita

Se for uma visita presencial, **tire fotos**:
- 📸 Do produto na empresa
- 📸 Da equipe do cliente
- 📸 Do ambiente

> As fotos ficam salvas no CRM e ajudam outros vendedores a conhecerem o cliente.

### Dica de ouro 💛

> **Nunca faça uma visita sem registrar no CRM antes.** O simples ato de agendar já organiza sua semana. E depois, o relato é **seu maior patrimônio** — é a prova do trabalho bem feito.

$$, 'Empresas cadastradas', '/comercial/crm/visitas/nova', 1);

-- ============================================================
-- MÓDULO 8: Tarefas — Nunca Mais Esqueça um Compromisso
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Tarefas — Nunca Mais Esqueça um Compromisso', 'Gerencie suas tarefas do dia a dia: ligações, follow-ups, lembretes. O CRM é seu assistente pessoal de vendas.', 'BookOpen', '#eab308', 8);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 8)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Criando e gerenciando tarefas',
$$## ✅ O que é uma Tarefa?

Tarefa é um **compromisso** ou **lembrete** que você cria para não esquecer:

| Tipo | Exemplo |
|---|---|
| 📞 **LIGACAO** | "Ligar para o João amanhã às 10h" |
| 🤝 **REUNIAO** | "Reunião com equipe comercial" |
| 📄 **PROPOSTA** | "Enviar proposta revisada" |
| 📌 **TAREFA** | "Atualizar planilha de preços" |

### Criando uma tarefa

1. Vá em **CRM → Tarefas → Nova Tarefa**
2. Ou dentro de uma **Empresa/Oportunidade**

### Campos da tarefa

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Título** | ✅ Sim | O que precisa ser feito |
| **Tipo** | ✅ (padrão TAREFA) | LIGACAO, REUNIAO, PROPOSTA, TAREFA |
| **Descrição** | Não | Detalhes |
| **Data Prevista** | Não | Quando fazer |
| **Data Conclusão** | Não | Preenche quando fizer |
| **Status** | ✅ (padrão PENDENTE) | PENDENTE, CONCLUIDA, CANCELADA |
| **Responsável** | Não | Quem vai fazer |
| **Empresa** | Não | Relacionar a uma empresa |
| **Oportunidade** | Não | Relacionar a uma oportunidade |

### Gerenciando suas tarefas

Na lista de tarefas, você vê:
- 📋 **Todas as suas tarefas pendentes**
- 📅 Organizadas por data
- 🔍 Filtrar por tipo, status, empresa

### Dica de ouro 💛

> **Crie tarefas para TUDO que você precisa fazer.** Parece exagero, mas é libertador. Com o CRM cuidando dos lembretes, sua cabeça fica livre para pensar em vender. Ao final do dia, marque como concluída e sinta a satisfação. ✅

| Hábito | Como fazer no CRM |
|---|---|
| "Ligar amanhã" | Cria tarefa: LIGACAO para amanhã |
| "Enviar proposta" | Cria tarefa: PROPOSTA vinculada |
| "Não esquecer" | Cria tarefa: TAREFA com descrição |

$$, 'Empresas cadastradas (opcional para vincular)', '/comercial/crm/tarefas/nova', 1);

-- ============================================================
-- MÓDULO 9: Timeline — O Histórico Completo do Cliente
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Timeline — O Histórico Completo do Cliente', 'A timeline registra automaticamente tudo que acontece com cada empresa. É a memória viva do relacionamento.', 'BookOpen', '#ec4899', 9);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 9)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Entendendo e usando a timeline',
$$## ⏰ O que é a Timeline?

A **Timeline** é o **histórico completo** de tudo que aconteceu com uma empresa. Ela é **automática** — você não precisa preencher nada, o próprio CRM registra:

### O que aparece na timeline

| Evento | Como aparece |
|---|---|
| 🏢 **Empresa criada** | Automático |
| 👤 **Contato adicionado** | Automático |
| 💼 **Oportunidade criada** | Automático |
| 🔄 **Oportunidade mudou de etapa** | Automático |
| 📄 **Proposta enviada** | Automático |
| 📅 **Visita agendada/realizada** | Automático |
| ✅ **Tarefa concluída** | Automático |
| 💬 **Mensagem WhatsApp** | Automático |

### Por que a timeline é tão importante?

```
🧑‍💼 Cliente: "Mas vocês prometeram que tal coisa..."
❌ Antes: "Hmm, não me lembro..."
✅ Agora: *abre a timeline* "Olha aqui, no dia 15/03 foi registrado..."

```

> **A timeline é a prova do seu trabalho!** Ela mostra que você:
> - Visitou o cliente
> - Enviou proposta
> - Fez follow-up
> - Cumpriu o que prometeu

### Como acessar

Dentro de qualquer **Empresa**, role para baixo ou clique na aba **Timeline**. Você verá uma linha do tempo com todos os eventos em ordem cronológica (do mais recente para o mais antigo).

### Dica de ouro 💛

> **Sempre que atender um cliente, verifique a timeline primeiro.** Veja o que aconteceu antes. Isso evita repetir perguntas ("Qual seu nome mesmo?") e mostra que você se importa com o histórico.

$$, 'Empresas cadastradas', NULL, 1);

-- ============================================================
-- MÓDULO 10: Dashboard — Seus Números em Um Pulo
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Dashboard — Seus Números em Um Pulo', 'O painel principal do CRM com indicadores, gráficos e métricas para você acompanhar seu desempenho comercial.', 'BookOpen', '#6366f1', 10);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 10)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Entendendo cada indicador do Dashboard',
$$## 📊 Visão Geral

O Dashboard é a **primeira tela** que você vê ao entrar no CRM. Ele foi feito para dar um **raio-x completo** do seu negócio em segundos.

### Cards de Resumo (parte de cima)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Empresas │ │  Leads   │ │ Oportun. │ │ Prop.    │
│   150    │ │    45    │ │   28     │ │   12     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

Cada card mostra o **total ativo** daquele item. Clique no card para ir direto para a lista.

### Funil de Vendas

Mostra quantas oportunidades estão em cada etapa:
```
NOVO: ████████████████ 10
QUALIFICAÇÃO: ██████████ 8
PROPOSTA: ███████ 5
NEGOCIAÇÃO: ████ 3
```

> 📈 **Funil saudável:** Deve ter MAIS oportunidades no topo (NOVO) do que no fundo (NEGOCIACAO). Se o topo está vazio, você não está gerando leads suficientes!

### Previsão de Vendas

Quanto dinheiro está previsto para entrar:
- 💰 **Valor total** das oportunidades em andamento
- 📊 **Por mês** — quanto previsto para este mês, próximo, etc.
- 📉 Leva em conta a **probabilidade** de cada oportunidade

### Conversão

Mostra a **taxa de conversão**:
- De lead → oportunidade
- De oportunidade → proposta
- De proposta → fechado

> Exemplo: Se 10 propostas viram 3 vendas, a taxa de conversão é 30%.

### Top Empresas

As empresas com **maior valor em oportunidades**. Foque nelas! 🎯

### Timeline Recente

As últimas atividades registradas no sistema. Veja o que está rolando agora.

### Ações Rápidas

Links para criar rapidamente:
- ➕ Nova empresa
- ➕ Novo lead
- ➕ Nova oportunidade
- ➕ Nova visita

### Dica de ouro 💛

> **Comece o dia pelo Dashboard.** Em 10 segundos você vê:
> - 📊 Como estão os números
> - ⏰ O que aconteceu recentemente
> - 🎯 Quais são as prioridades

> E termine o dia atualizando o que precisa. **5 minutos de manhã + 5 minutos à noite** fazem milagres!

$$, NULL, '/comercial/crm', 1);

-- ============================================================
-- MÓDULO 11: Relatórios — Enxergando Oportunidades nos Dados
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Relatórios — Enxergando Oportunidades nos Dados', 'Gráficos e análises que transformam dados em decisões. Entenda de onde vêm seus leads, como está o pipeline e muito mais.', 'BookOpen', '#06b6d4', 11);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 11)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Lendo e usando os gráficos de relatórios',
$$## 📈 O que são os Relatórios?

Enquanto o Dashboard mostra o **agora**, os Relatórios mostram as **tendências** e **análises** mais profundas.

### Gráfico 1: Leads por Origem (Pizza)

```
      🍕 Leads por Origem
   ┌──────────────────────┐
   │  SITE        35%  🟣 │
   │  INDICACAO   25%  🟠 │
   │  WHATSAPP    20%  🔵 │
   │  FEIRA       15%  🟢 │
   │  OUTRO        5%  🔴 │
   └──────────────────────┘
```

> ❓ **Pergunta:** De onde estão vindo mais leads?
> ✅ **Ação:** Invista mais no que está funcionando!

### Gráfico 2: Pipeline por Estágio (Barras)

Mostra o valor total de oportunidades em cada etapa.

> ❓ **Pergunta:** Quanto dinheiro está parado em cada etapa?
> ✅ **Ação:** Se PROPOSTA está cheio, foque em fechar!

### Gráfico 3: Oportunidades por Representante

> ❓ **Pergunta:** Quem está com mais negócios?
> ✅ **Ação:** Distribuir melhor as oportunidades?

### Gráfico 4: Propostas por Status

> ❓ **Pergunta:** Quantas propostas foram aceitas vs recusadas?
> ✅ **Ação:** Se muitas recusadas, rever política de preços?

### Gráfico 5: Tarefas por Tipo

> ❓ **Pergunta:** O time está fazendo mais ligações ou reuniões?
> ✅ **Ação:** Equilibrar os tipos de atividade?

### Gráfico 6: Conversão

Mostra a taxa de conversão em cada etapa do funil.

> ❓ **Pergunta:** Onde estamos perdendo mais clientes?
> ✅ **Ação:** Se cai muito em NEGOCIACAO, treinar negociação!

### Dica de ouro 💛

> **Compartilhe os relatórios com o time!** Na reunião semanal, abra os relatórios e discutam juntos. Os dados não mentem — eles mostram onde melhorar. **Não é sobre apontar dedos, é sobre crescer juntos.** 💙

$$, 'Dados inseridos: empresas, leads, oportunidades, propostas, visitas, tarefas', '/comercial/crm/relatorios', 1);

-- ============================================================
-- MÓDULO 12: WhatsApp e Campanhas — Comunicação com o Cliente
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('WhatsApp e Campanhas — Comunicação com o Cliente', 'Integração com WhatsApp para registrar conversas e campanhas de marketing para disparos em massa.', 'BookOpen', '#22c55e', 12);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 12)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'WhatsApp: conversas registradas no CRM',
$$## 💬 WhatsApp integrado ao CRM

As conversas de WhatsApp com clientes podem ser registradas automaticamente no CRM (via integração com Evolution API + n8n).

### Como funciona

1. Cliente manda mensagem no WhatsApp da empresa
2. A mensagem **aparece automaticamente** no CRM
3. Você vê: quem mandou, quando, o que disse
4. Você pode responder pelo CRM ou pelo WhatsApp normal

### Onde ver as mensagens

- Dentro da **Empresa**, na aba **WhatsApp**
- Ou em **CRM → WhatsApp** — lista geral

### Tipos de mensagem

| Tipo | Quando |
|---|---|
| 📥 **RECEBIDA** | Cliente mandou |
| 📤 **ENVIADA** | Você respondeu |

### Marcar como lida

As mensagens não lidas aparecem em destaque. Clique para marcar como lida.

> 🔒 **Privacidade:** O CRM só registra mensagens de contatos que já estão cadastrados. Se um número desconhecido mandar mensagem, aparece como "contato não identificado".

$$, 'Contatos com WhatsApp cadastrado', '/comercial/crm/whatsapp', 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 12)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Campanhas: disparos para múltiplos contatos',
$$## 📣 O que são Campanhas?

Campanhas são **disparos de comunicação** para múltiplos contatos de uma vez. Exemplos:

- 🎄 "Feliz Natal! 🎅"
- 🎂 "Feliz aniversário! 🎉"
- 📢 "Novidade: acabou de chegar tecido X!"
- 📰 "Newsletter mensal"

### Criando uma campanha

1. Vá em **CRM → Campanhas → Nova Campanha**
2. Preencha:

| Campo | Explicação |
|---|---|
| **Nome** | Nome interno da campanha |
| **Tipo** | WHATSAPP (por enquanto) |
| **Descrição** | Para que serve essa campanha |
| **Data Início** | Quando começa |
| **Data Fim** | Quando termina |
| **Orçamento** | Quanto vai custar |
| **Status** | ATIVA, PAUSADA, CONCLUIDA |

### Status da campanha

| Status | Significado |
|---|---|
| 🟢 **ATIVA** | Campanha rodando |
| 🟡 **PAUSADA** | Temporariamente parada |
| ✅ **CONCLUIDA** | Finalizada |

### Métricas da campanha

Depois da campanha, registre:
- 📊 **Leads gerados** — quantos novos leads vieram
- 💰 **Custo de aquisição** — quanto custou cada lead

### Dica de ouro 💛

> **Campanha não é spam!** Dispare mensagens com **valor real** para o cliente. Uma mensagem de aniversário ou uma informação útil é bem-vinda. 10 mensagens de oferta por semana? Isso é spam e afasta cliente.

$$, 'WhatsApp configurado. Contatos com WhatsApp.', '/comercial/crm/campanhas/nova', 2);

-- ============================================================
-- MÓDULO 13: IA Comercial — Sua Inteligência Artificial de Vendas
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('IA Comercial — Sua Inteligência Artificial de Vendas', 'O CRM conta com inteligência artificial para classificar leads, gerar resumos de empresas e prever vendas. Deixe a IA fazer o trabalho pesado.', 'GraduationCap', '#f97316', 13);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 13)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Classificação de leads, resumo de empresas e previsão de vendas',
$$## 🤖 O que a IA Comercial faz?

A **Inteligência Artificial Comercial** ajuda você a vender mais analisando dados que seriam impossíveis de analisar manualmente.

### 1️⃣ Score de Leads

A IA analisa cada lead e dá uma nota de **0 a 100**:

```python
# O que a IA considera:
- Segmento da empresa (moda? decoração?)
- Porte (pequena? média? grande?)
- Origem do lead (indicação vale mais)
- Comportamento similar a clientes que converteram
```

> 🟢 **Score 70+:** Corre atrás! 🔥
> 🟡 **Score 40-69:** Mantenha contato
> 🔴 **Score <40:** Talvez não seja o momento

### Como usar

Na lista de leads, **ordene por score**. Atenda primeiro os leads com maior pontuação. Simples assim.

### 2️⃣ Resumo da Empresa

Na página da empresa, o card **"Resumo IA"** mostra:
- 📝 Um resumo automático dos dados da empresa
- 💡 Sugestões de ações ("Tente oferecer tecido X")
- 📊 Análise do potencial

> 💡 **Exemplo:** "A empresa Têxtil ABC é uma confecção de médio porte em São Paulo. Com base nos dados, sugerimos abordar com amostras de malha para a coleção verão."

### 3️⃣ Previsão de Vendas

A IA analisa as oportunidades e projeta:
- 💰 **Quanto** você deve vender este mês
- 📅 **Previsão** para os próximos meses
- 📊 **Segmentos** que mais vendem

### Botão "Reclassificar"

Se novos dados entrarem, clique em **"Reclassificar"** para a IA reavaliar o lead ou empresa.

### Dica de ouro 💛

> **A IA é sua assistente, não sua chefe.** Ela sugere, mas quem decide é você. Se a IA disse que um lead é frio, mas você sente que tem potencial, **confie no seu taco**. A IA aprende com o tempo — quanto mais você usa, mais precisa ela fica.

$$, 'Leads e empresas cadastrados', '/comercial/crm/leads', 1);

-- ============================================================
-- MÓDULO 14: Regiões e Equipes — Organização Comercial
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Regiões e Equipes — Organização Comercial', 'Entenda a estrutura de regiões e equipes comerciais: diretorias, gerentes regionais e representantes.', 'GraduationCap', '#8b5cf6', 14);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 14)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Estrutura comercial: regiões e equipes',
$$## 🗺️ Organização Comercial

O CRM organiza a força de vendas em uma hierarquia:

```
┌─────────────────────────┐
│     DIRETORIA           │
│  (visão de tudo)        │
└─────────────────────────┘
           ⬇️
┌─────────────────────────┐
│  GERENTE REGIONAL       │
│  (SP, RJ, MG, etc.)     │
└─────────────────────────┘
           ⬇️
┌─────────────────────────┐
│  REPRESENTANTE          │
│  (atende clientes)       │
└─────────────────────────┘
```

### Regiões

Cada **Região** corresponde a um estado ou área geográfica:
- Sudeste, Sul, Nordeste...
- Ou por estado: SP, RJ, MG...

| Região | Gerente Responsável |
|---|---|
| São Paulo | João Silva |
| Rio de Janeiro | Maria Santos |
| Minas Gerais | Carlos Pereira |

> **Para que servem as regiões?** Para organizar as empresas por área e saber quem cobre cada região. Também gera relatórios por região.

### Equipes

Dentro de cada região, as **Equipes** são os grupos de vendedores:

| Equipe | Região | Responsável |
|---|---|---|
| Equipe Alpha | São Paulo | Pedro Costa |
| Equipe Beta | São Paulo | Ana Lima |

### Como configurar?

1. Vá em **CRM → Configurações**
2. Primeiro cadastre as **Regiões**
3. Depois cadastre as **Equipes** vinculadas às regiões

### Dica de ouro 💛

> **A organização comercial é viva.** Regiões mudam, equipes se reestruturam. Mantenha sempre atualizado no CRM. Uma estrutura desatualizada gera relatórios errados e decisões equivocadas.

$$, 'Usuários cadastrados (para vincular como gerentes/responsáveis)', '/comercial/crm/configuracoes', 1);

-- ============================================================
-- MÓDULO 15: O Módulo de Treinamento — Você Está Aqui!
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('O Módulo de Treinamento — Você Está Aqui!', 'Este módulo explica como usar o próprio módulo de treinamento. Sim, é meta! 😄', 'BookOpen', '#14b8a6', 15);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 15)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Como usar este treinamento',
$$## 🎓 Treinamento do Treinamento

Meta, né? 😄 Mas é simples:

### Como navegar

1. Na página inicial do treinamento, você vê todos os **módulos** (caixinhas coloridas)
2. **Clique em um módulo** para expandir e ver as lições
3. **Clique em uma lição** para ler o conteúdo completo

### Funcionalidades

| Funcionalidade | Como usar |
|---|---|
| 📖 **Ler lição** | Clique no título da lição |
| 📄 **Exportar PDF** | Dentro da lição, clique em "Exportar PDF" |
| ⏪⏩ **Navegar** | Use as setas "Anterior" e "Próxima" |
| ℹ️ **Info** | Clique no "i" para dicas rápidas |
| 🔗 **Links POP** | Abre procedimentos em nova aba |
| 🎬 **Vídeos** | Tutoriais em vídeo (quando disponíveis) |

### Pré-cadastros necessários

Algumas lições têm **"Pré-cadastros necessários"** — uma caixinha amarela avisando o que precisa estar pronto antes de usar aquela tela. Preste atenção nela!

### Dica de ouro 💛

> **Treinamento não se lê uma vez e pronto.** Volte sempre que tiver dúvida. O treinamento está aqui para isso. E se algo não estiver claro, **avise o Tiago** — ele atualiza o conteúdo com amor! 💙

"O conhecimento liberta. E o CRM é a ferramenta que liberta seu potencial de vendas." — Tiago de Abreu

$$, 'Nenhum', '/comercial/crm/treinamento', 1);

-- ============================================================
-- MÓDULO 16: Cultura de Vendas — Como Vender Mais e Melhor
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Cultura de Vendas — Como Vender Mais e Melhor', 'Dicas práticas, hábitos diários e mentalidade para criar uma cultura de vendas forte na PDM Têxtil.', 'GraduationCap', '#ef4444', 16);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 16)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Hábitos diários de um vendedor de sucesso',
$$## 🌟 Rotina Diária Recomendada

### ☀️ Manhã (10 min no CRM)

| Horário | O que fazer |
|---|---|
| 08:00 | **Dashboard** — veja os números do dia |
| 08:05 | **Tarefas do dia** — o que precisa fazer hoje |
| 08:10 | **Leads novos** — atenda leads com score alto |

### 📅 Durante o dia

- **Registre TUDO** — cada ligação, cada WhatsApp, cada contato
- **Atualize status** — arraste oportunidades no Kanban
- **Crie tarefas** — se prometeu algo, crie uma tarefa

### 🌆 Fim do dia (5 min no CRM)

| O que fazer |
|---|
| ✅ Marcar tarefas concluídas |
| 📝 Escrever relato de visitas |
| 📊 Ver o que ficou pendente |

### 🏆 Metas

Cada vendedor deve ter metas claras:

| Indicador | Meta semanal |
|---|---|
| 📞 **Novos leads contatados** | 5+ |
| 💼 **Novas oportunidades** | 3+ |
| 📄 **Propostas enviadas** | 2+ |
| 📅 **Visitas realizadas** | 2+ |

### Mindset: O CRM é seu amigo 🧠

Muitas pessoas veem CRM como "mais trabalho para preencher". Mas a verdade é:

```
⛓️ "Preencher CRM" = ✨ "Organizar minha vida"
⛓️ "Ter que registrar" = ✨ "Nunca mais esquecer"
⛓️ "Perder tempo" = ✨ "Investir no meu sucesso"
```

> **Cada minuto gasto no CRM é um minuto INVESTIDO na sua carreira.** Clientes bem atendidos viram clientes fiéis. Clientes fiéis viram indicações. Indicações viram mais vendas. E mais vendas significam **mais comissão pra você**! 🤑

### O poder do hábito

```
Dias 1-7:  "Nossa, que trabalhoso..."
Dias 8-30: "Já estou pegando o jeito"
Dias 31+:  "Não consigo mais viver sem CRM"
```

**Persista!** Em 30 dias o CRM vira parte de você. Prometo! 🤝

$$, 'Todos os módulos anteriores', NULL, 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 16)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Boas práticas e regras de ouro',
$$## 📜 As 10 Regras de Ouro do CRM

### 1️⃣ 🥇 Se não está no CRM, não aconteceu

Se você ligou, visitou, mandou WhatsApp, enviou proposta — **registre**. Se não registrou, é como se não tivesse feito.

### 2️⃣ 🏢 Empresa primeiro, sempre

Antes de cadastrar lead, contato ou oportunidade, **verifique se a empresa já existe**. Se não existe, cadastre.

### 3️⃣ 🔍 Dados limpos = Dados úteis

- Não abreveie nomes ("Cia Txt" em vez de "Companhia Têxtil")
- CNPJ com pontuação
- Segmento correto
- E-mail válido

### 4️⃣ 📝 Relatos completos

Depois de uma visita ou ligação importante, escreva um relato que **qualquer colega entenderia**. Imagine que você vai tirar férias e outro vendedor vai assumir — ele precisa entender tudo.

### 5️⃣ 🔄 Atualize os status

Não deixe oportunidade em "NOVO" por semanas. Se avançou, atualize. Se parou, registre o motivo.

### 6️⃣ 🤝 Compartilhe informação

O CRM não é seu diário secreto. **Compartilhe com o time.** Um lead que não serve pra você pode ser perfeito pra outro colega.

### 7️⃣ 💬 Cliente não é número

Atrás de cada empresa, lead ou oportunidade **tem uma pessoa**. Trate essa pessoa com respeito, atenção e carinho. O CRM é só a ferramenta — o coração é seu.

### 8️⃣ 📊 Dados geram decisões

A diretoria usa os relatórios do CRM para decidir:
- Contratar mais vendedores
- Investir em marketing
- Mudar preços
- Abrir novas regiões

**Se os dados estão errados, as decisões também estarão.** Capriche!

### 9️⃣ ❓ Dúvida? Pergunte!

Ninguém nasce sabendo. Se tiver dúvida:
- Consulte este treinamento
- Pergunte a um colega
- Fale com o Tiago

> "A única pergunta boba é a que não foi feita." 💙

### 🔟 🎯 Venda com amor

O CRM foi feito para te ajudar a **vender mais**, mas também para **atender melhor**. Um cliente bem atendido:
- Volta a comprar
- Indica outros clientes
- Confia na PDM Têxtil

> ## 💙 Mensagem final do Tiago
>
> *"Eu criei este CRM com muito carinho, pensando em cada detalhe para facilitar o dia a dia de vocês. Cada campo, cada tela, cada funcionalidade foi pensada para ajudar vocês a venderem mais e melhor.*
>
> *O CRM não é um sistema de controle. É um sistema de **libertação**. Libertação da papelada, da bagunça, do esquecimento, da ansiedade.*
>
> *Use, explore, erre, aprenda, pergunte, melhore. Este CRM é nosso. Vamos construir juntos uma cultura de vendas incrível na PDM Têxtil!* 🚀
>
> *Com amor,*
> ***Tiago de Abreu***
> *Engenheiro de Dados"*

$$, 'Todos os módulos anteriores', NULL, 2);
