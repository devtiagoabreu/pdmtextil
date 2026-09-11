-- ============================================================
-- SEED: Módulos e Lições de Treinamento Engenharia de Processos
-- ============================================================

-- Limpa dados existentes para recriar (lições primeiro por causa da FK)
DELETE FROM proc_treino_licoes;
DELETE FROM proc_treino_modulos;

-- Reset sequence
ALTER SEQUENCE proc_treino_modulos_id_seq RESTART WITH 1;
ALTER SEQUENCE proc_treino_licoes_id_seq RESTART WITH 1;

-- ============================================================
-- MÓDULO 1: Boas-Vindas à Engenharia de Processos
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Boas-Vindas à Engenharia de Processos', 'Por que documentar processos, o que isso muda na rotina da PDM Têxtil e como todos ganhamos com um mapeamento claro e vivo.', 'GraduationCap', '#0ea5e9', 1);

-- Lição 1.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 1)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'O que é Engenharia de Processos e por que ela importa?',
$$## O que é Engenharia de Processos?

**Engenharia de Processos** é a disciplina de **documentar, mapear e melhorar** a forma como o trabalho acontece. Em vez de depender de "quem sabe como faz", o conhecimento fica registrado: **todos sabem como fazer**.

Imagine que, antes do mapeamento, cada equipe executava do seu jeito, com anotações soltas e decisões na memória. Com a documentação, o fluxo fica visível e padronizado:

- Quais empresas e unidades existem
- Quais áreas executam cada etapa
- Qual a sequência das atividades
- Quem é responsável por cada parte
- Quais os indicadores e riscos envolvidos

### Por que a PDM Têxtil está documentando processos?

| Antes (sem mapeamento) | Agora (com documentação) |
|---|---|
| Conhecimento na cabeça das pessoas | Conhecimento registrado |
| Repetição de erros | Melhoria contínua |
| Dependência de uma pessoa | Time trabalha junto |
| Decisão no achismo | Decisão com dados |
| Treinamento lento | Integração acelerada |

> **Mensagem:** "Processos bem documentados transformam conhecimento em resultado. Cada atividade mapeada é um passo rumo à melhoria contínua."

### O que muda no meu dia a dia?

1. **Antes:** "Deixa eu lembrar como essa etapa era feita..." — **Agora:** abro o processo documentado e consulto o fluxo.
2. **Antes:** "Eu juro que essa tarefa sempre foi assim..." — **Agora:** o diagrama mostra a sequência e o responsável, **sem achismo**.
3. **Antes:** "O fulano que sabia fazer isso saiu, perdemos o conhecimento..." — **Agora:** o processo **fica na organização**, não na pessoa.

### Para quem é a Engenharia de Processos?

- **Gerentes e supervisores** — para padronizar e melhorar o fluxo
- **Operação** — para executar com clareza e segurança
- **Qualidade** — para auditorias e certificações
- **Diretoria** — para enxergar gargalos e tomar decisões
- **Novos colaboradores** — para aprender mais rápido

### Como começar?

Não precisa mapear tudo de uma vez. Vá módulo por módulo: comece por este treinamento, depois **abra o módulo Processos e explore**. A melhor forma de aprender é usando. E se tiver dúvida, pergunte — a documentação é nossa, de todos nós.

---
*"Processo não é burocracia. É clareza: todos sabem o que fazer, quem faz e por quê."*
$$, NULL, '/processos', 1);

-- Lição 1.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 1)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'A hierarquia do mapeamento: a espinha dorsal do módulo',
$$## A Hierarquia

Todo o módulo de Processos se organiza em uma hierarquia fixa. É a espinha dorsal que dá liga a tudo:

```
Empresa
  └── Site
       └── Área
            └── Processo
                 └── Subprocesso
                      └── Atividade
```

### Cada nível, um papel

| Nível | Papel |
|---|---|
| **Empresa** | Organização no nível mais alto |
| **Site** | Unidade física (planta, filial) de uma empresa |
| **Área** | Setor/departamento dentro de um site |
| **Processo** | Objeto central: documenta objetivo, responsável, entradas e saídas |
| **Subprocesso** | Grande etapa em que o processo é decomposto |
| **Atividade** | Ação concreta executada dentro do subprocesso |

### Uma regra de ouro

> **Sempre desça de cima para baixo.** Cadastre a empresa, depois o site, depois a área, depois o processo. Pular etapas quebra a hierarquia e dificulta a consulta.

### Por que essa hierarquia?

- **Navegação natural**: você sabe onde cada processo mora.
- **Reusabilidade**: uma atividade pode aparecer em vários fluxos.
- **Relatórios por nível**: dá para agrupar indicadores por área, site ou empresa.
$$, 'Nenhum', '/processos', 2);

-- ============================================================
-- MÓDULO 2: Empresas e Sites
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Empresas e Sites', 'Como cadastrar as organizações e as unidades físicas que hospedam os processos da PDM Têxtil.', 'Building2', '#0284c7', 2);

-- Lição 2.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 2)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando uma Empresa',
$$## Empresas

A **Empresa** é o nível mais alto da hierarquia. Representa uma organização do grupo.

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome da organização (obrigatório) |
| **CNPJ** | CNPJ da empresa (opcional) |
| **Status** | Ativo ou inativo |

### Regras importantes

1. Uma empresa pode ter **um ou mais sites** (unidades físicas).
2. **Empresas inativas** não aparecem na seleção de novos cadastros.
3. Só é possível **excluir** uma empresa que **não tenha sites vinculados**.

### Como preencher

Pense que quem consulta depois precisa saber **qual organização** está falando — não basta um apelido de memória.

| Campo | Como preencher | Exemplo |
|---|---|---|
| **Nome** | Razão social ou nome completo, sem abreviações | PDM Têxtil Ltda (não "PDM") |
| **CNPJ** | Somente números | 00.000.000/0001-00 |
| **Status** | Mantenha **Ativo** enquanto a organização existir | Ativo |

### Dúvidas comuns

- **Tenho uma só empresa?** Cadastre uma única empresa. Se o grupo tiver mais (ex.: a firma de confecção separada), cadastre cada uma.
- **Mudou o CNPJ?** Atualize no cadastro da mesma empresa. Não crie outra igual.
- **A empresa fechou?** Marque como inativa em vez de excluir — a documentação dos processos continua consultável.

> Dica: use o **nome completo** da organização, sem abreviações — isso garante consistência nas consultas e evita duas empresas "PDM" que na verdade são a mesma.
$$, 'Acesso ao módulo Processos (tela Empresas)', '/processos/empresas', 1);

-- Lição 2.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 2)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando um Site',
$$## Sites

O **Site** é a unidade física (planta, filial) de uma empresa. É dentro dos sites que as áreas operam.

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome da unidade/filial (obrigatório) |
| **Empresa** | Empresa à qual o site pertence (obrigatório) |
| **Cidade/UF** | Localização da unidade (opcional) |

### Regras importantes

1. **Todo site pertence a uma empresa** — escolha a empresa certa antes de salvar.
2. Cada site pode conter **várias áreas**.
3. Só é possível **excluir** um site **sem áreas vinculadas**.

### Como preencher

O site é o **endereço físico** do trabalho. Se a fábrica tem mais de uma unidade, cada uma é um site.

| Campo | Como preencher | Exemplo |
|---|---|---|
| **Nome** | Nome da unidade/filial | PDM São Paulo — Planta de Tecelagem |
| **Empresa** | A organização dona da unidade | PDM Têxtil Ltda |
| **Cidade/UF** | Onde a unidade fica | São Paulo / SP |

### Exemplos de sites na fábrica

- **PDM São Paulo** — matriz (tecelagem + beneficiamento + expedição)
- **PDM Campinas** — filial (apenas beneficiamento e expedição)
- **PDM Minas** — unidade de urdimento

### Dúvidas comuns

- **"Tenho uma fábrica só, preciso de site?"** Sim — crie um único site ligado à sua empresa. Sem site, não dá para cadastrar áreas.
- **"Dois setores no mesmo galpão são dois sites?"** Não. Se é o mesmo local físico, é **um site com duas áreas**.
- **"Abrimos uma filial em outra cidade."** Crie um **novo site** para a filial.

> Dica: use nomes que diferenciem unidades do mesmo grupo (ex.: "PDM São Paulo" e "PDM Campinas") e sempre confira se a empresa selecionada é a correta — cada site nasce dentro de uma empresa.
$$, 'Empresa cadastrada', '/processos/sites', 2);

-- ============================================================
-- MÓDULO 3: Áreas e Processos
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Áreas e Processos', 'Os setores que executam o trabalho e o objeto central do mapeamento: o Processo, com seu objetivo, entradas, saídas e responsáveis.', 'FolderTree', '#0369a1', 3);

-- Lição 3.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 3)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando uma Área',
$$## Áreas

A **Área** representa um setor ou departamento dentro de um site — é onde os processos são executados.

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome do setor/departamento (obrigatório) |
| **Site** | Site ao qual a área pertence (obrigatório) |

### Exemplos realistas

- Beneficiamento de Malha
- Tecelagem
- Urdimento
- Expedição e Logística
- Recebimento de Matéria-Prima
- Qualidade e Controle
- Manutenção
- TI Corporativa

### Regras importantes

1. **Toda área pertence a um site.**
2. Cada área pode conter **vários processos**.
3. Excluir uma área exige que ela **não tenha processos vinculados**.

### Como preencher

A área é o **setor** — o nome precisa ser o mesmo que o pessoal usa no chão de fábrica. Se no dia a dia chamam de "expedição", cadastre "Expedição e Logística" se preferir, mas **não invente nomes que ninguém reconhece**.

| Campo | Como preencher | Exemplo |
|---|---|---|
| **Nome** | Nome do setor, reconhecível pelo time | Expedição e Logística |
| **Site** | A unidade física onde o setor fica | PDM São Paulo |

### Exemplo: como fica o site com suas áreas

```
PDM São Paulo (site)
├── Recebimento de Matéria-Prima
├── Tecelagem
├── Urdimento
├── Beneficiamento
├── Expedição e Logística
└── Qualidade e Controle
```

A partir daqui, cada **processo** que você cadastrar vai ser alocado dentro de uma dessas áreas (ex.: o processo "Recepção de fio" fica na área "Recebimento de Matéria-Prima").

> Dê preferência a nomes que o time já usa no dia a dia. A área documentada precisa ser reconhecível por quem executa o processo.
$$, 'Site cadastrado', '/processos/areas', 1);

-- Lição 3.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 3)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando um Processo — o coração do módulo',
$$## Processos

O **Processo** é o objeto central do mapeamento. Ele documenta o fluxo de trabalho de uma área com objetivo, entradas, saídas e responsabilidades.

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome do processo (ex: Beneficiamento de Malha) — obrigatório |
| **Código** | Código de referência (opcional) |
| **Responsável** | Dono do processo |
| **Status** | Situação do documento (Rascunho, Em revisão, Aprovado...) |
| **Versão** | Versão do documento |

### Como preencher (pensando em quem vai ler)

Pense que outra pessoa abrirá esse processo daqui a meses **sem te perguntar nada**. Quanto mais claro e específico, melhor. Para cada campo, o ideal é responder a uma pergunta simples. Veja abaixo como preencher cada lista.

---

### Entradas — o que entra para o processo acontecer?

Pergunta-guia: **"O que precisa chegar para esse processo rodar?"** Pode ser matéria-prima, insumo, documento ou informação. **Uma linha por item**, sem vírgulas longas.

| Bom exemplo | Exemplo ruim | Por quê |
|---|---|---|
| Malha crua (rolo) | Entrada | "Entrada" não diz nada a quem consulta |
| Fio de urdume | Fio | Não diz qual fio |
| Ordem de Produção (OP) de tecelagem | OP | Sigla sem contexto |

> Dica: cite o **estado** da matéria (crua, tingida, acabada) e, se achar útil, a **unidade** (rolo, kg, partida).

### Saídas — o que o processo entrega?

Pergunta-guia: **"O que sai quando o processo termina?"** Pode ser produto, documento, informação ou serviço. Uma linha por item.

| Bom exemplo | Exemplo ruim | Por quê |
|---|---|---|
| Malha beneficiada acabada | Saída | Não diz o que é |
| Laudo de qualidade do lote | Laudo | Não diz qual laudo |
| Roteiro de produção preenchido | Roteiro | Sem contexto |

### Fornecedores — quem entrega as entradas?

Pergunta-guia: **"Quem fornece o que entra?"** Pode ser outra área da própria fábrica (fornecedor **interno**) ou uma empresa externa (**fornecedor externo**). Faça como no dia a dia: cada fornecedor em uma linha.

- O **setor de tecelagem** entrega o tecido cru → considerado fornecedor do processo de beneficiamento.
- A **tinturaria terceirizada** é fornecedor externo.
- A **transportadora/expedição** entrega malha recebida do fornecedor.

### Clientes — quem recebe as saídas?

Pergunta-guia: **"Quem recebe o que sai?"** Assim como nos fornecedores, pode ser interno ou externo.

- **Expedição** recebe o lote pronto para embarque.
- A **confecção/alfaiataria** é o cliente final da malha beneficiada.
- Outra **área interna** que usa a saída como entrada do próximo processo.

### Indicadores — como saber se o processo está indo bem?

Pergunta-guia: **"Como medimos se este processo funciona?"** Na edição, cada indicador é uma linha com nome, unidade, meta e frequência. Seja mensurável — não dá para gerir o que não se mede.

| Bom exemplo | Exemplo ruim | Por quê |
|---|---|---|
| % de retrabalho | Qualidade | "Qualidade" não é mensurável |
| Tempo de ciclo do tingimento | Rapidez | Sem unidade e meta |
| Produtividade (kg/hora) | Produção | Sem unidade definida |

> Modelo de linha: **Nome do indicador (unidade) — meta — frequência**. Ex.: "Retrabalho (%) — meta < 2% — mensal".

### Riscos — o que pode dar errado?

Pergunta-guia: **"O que pode acontecer de ruim nesse processo?"** Na edição, cada risco é uma linha com descrição, probabilidade, impacto e controle. Pense nos problemas que já aconteceram — eles são os melhores candidatos.

| Exemplo de linha de risco |
|---|
| Descrição: Atraso na entrega de fio / Probabilidade: Média / Impacto: Alto / Controle: conferência de prazo no recebimento |
| Descrição: Quebra de máquina no beneficiamento / Probabilidade: Baixa / Impacto: Alto / Controle: manutenção preventiva programada |

### Controles — o que já existe para evitar problema?

Pergunta-guia: **"O que a fábrica já faz para garantir que o processo sai certo?"** Um controle para cada linha.

| Exemplo de controle |
|---|
| Conferência de peso da matéria-prima na recepção |
| Inspeção visual de defeitos antes do embarque |
| Alarme de temperatura na máquina de tingimento |
| Alvará de funcionamento do roteiro de produção antes de iniciar a ordem |

---

### Regras importantes

1. **Todo processo pertence a uma área.**
2. O **status** reflete a situação do documento do processo.
3. Alterar a **versão é manual** — incremente quando houver mudança relevante no conteúdo.

### Boa prática de preenchimento

Pense sempre em **escrever para um leigo da fábrica**. Se o nome precisa de sigla, escreva a sigla e o nome por extenso na primeira menção. Evite genérico: "Entrada", "Saída", "Processo", "Fio".

| Campo | Bom exemplo | Exemplo ruim | Por quê |
|---|---|---|---|
| Nome | Recebimento de Matéria-Prima | Recebimento | Não diz de quê |
| Entradas | Malha crua em rolo; Fio de urdume; OP de tecelagem | Entrada | Não diz o que entra |
| Saídas | Malha pré-tratada; Laudo de qualidade | Saída | Não diz o que sai |
| Fornecedores | Tecelagem (interno); Fornecedor de fios | Fornecedor | Não diz quem fornece |
| Clientes | Expedição; Confecção | Cliente | Não diz quem recebe |
| Indicadores | Retrabalho (%) — meta < 2% — mensal | Qualidade | Não é mensurável |
| Riscos | Atraso de fio / Média / Alto / Conferência de prazo | Risco | Sem estrutura |
| Controles | Inspeção visual de defeitos | Controle | Não diz qual controle |

### Exemplo preenchido (processo real da fábrica)

**Processo: Recebimento de Matéria-Prima**

- **Entradas:** Malha crua em rolo; Fio de urdume; Nota fiscal; Ordem de Compra
- **Saídas:** Matéria-prima conferida e armazenada; Laudo de recebimento
- **Fornecedores:** Transportadora terceirizada; Fornecedor de fios (externo)
- **Clientes:** Tecelagem (urdimento); Beneficiamento; Comprador de matérias-primas
- **Indicadores:** Atraso de entrega (%) — meta < 3% — semanal; Conferências em dia (%) — meta 100% — mensal
- **Riscos:** (1) Produto divergente do pedido — Média/Alta/Conferência no recebimento; (2) Atraso de transporte — Média/Média/Acompanhamento com a transportadora
- **Controles:** Conferência de peso e rolos; Conferência de nota fiscal vs. ordem de compra; Inspeção visual rápida de avarias
$$, 'Área cadastrada', '/processos/processos', 2);

-- Lição 3.3
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 3)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Status e versão: controlando a maturidade do documento',
$$## Status e Versão do Processo

O **status** e a **versão** trabalham juntos para dar segurança a quem consulta um processo.

### Status (maturidade do documento)

| Status | Significado |
|---|---|
| **Rascunho** | Ainda sendo escrito, pode mudar muito |
| **Em revisão** | Aguardando validação de um responsável |
| **Aprovado** | É a referência oficial |
| **Desatualizado** | Precisa ser revisado ou eliminado |

### Versão (mudança de conteúdo)

- A versão é **editada manualmente**.
- **Incremente sempre** que houver alteração relevante (ex: nova etapa, mudança de responsável).
- Mantenha a convenção do time (ex: 1.0, 1.1, 2.0).

### Como usar na prática

```
Escrevi o processo -> Status: Rascunho (v1.0)
Validei com o responsável -> Status: Em revisão (v1.0)
Aprovado em reunião -> Status: Aprovado (v1.0)
Mudou uma etapa -> incrementa -> Aprovado (v1.1)
```

> **Regra de ouro:** quem consulta o processo precisa confiar que está lendo a versão certa e atualizada. Status e versão bem mantidos evitam retrabalho e erro de execução.
$$, 'Processo cadastrado', '/processos/processos', 3);

-- ============================================================
-- MÓDULO 4: Subprocessos e Atividades
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Subprocessos e Atividades', 'A decomposição do processo em grandes etapas e, dentro delas, as ações concretas que o time executa.', 'ListTree', '#075985', 4);

-- Lição 4.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 4)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Criando Subprocessos',
$$## Subprocessos

O **Subprocesso** é uma grande etapa em que o processo é decomposto. Ele simplifica a leitura: em vez de um longo fluxo contínuo, o processo é dividido em blocos lógicos.

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome da etapa (ex: Recebimento de matéria-prima) |
| **Processo** | Processo ao qual pertence |
| **Ordem** | Sequência de execução dentro do processo |

### Regras importantes

1. **Todo subprocesso pertence a um processo.**
2. A **ordem** define a sequência de execução.
3. **Subprocessos inativos** não aparecem no detalhe do processo.

### Como preencher

O subprocesso é uma **fase** do processo. Para saber onde cortar, pergunte: **"qual é o fim de cada etapa?"** Quando muda o que o trabalho está fazendo, é um novo subprocesso.

| Campo | Como preencher | Exemplo |
|---|---|---|
| **Nome** | Nome da fase, iniciando por substantivo | Recebimento de matéria-prima |
| **Processo** | O processo dono da fase | Recebimento de Matéria-Prima |
| **Ordem** | Sequência: 1, 2, 3... | 1 |

### Exemplo de decomposição

```
Processo: Beneficiamento de Malha
├── 1. Recebimento de matéria-prima
├── 2. Pré-tratamento
├── 3. Tingimento
└── 4. Acabamento e expedição
```

### Mais exemplos de decomposição na fábrica

**Processo: Lançamento de Ordem de Produção de Tecelagem**
```
├── 1. Recepção da OP e conferência de dados
├── 2. Preparação do urdume
├── 3. Programação das máquinas
└── 4. Distribuição da OP para o chão de fábrica
```

**Processo: Expedição**
```
├── 1. Separação dos pedidos
├── 2. Conferência de quantidades e etiquetas
├── 3. Emissão de romaneio e nota fiscal
└── 4. Carregamento e saída do caminhão
```

### Dica

A divisão em subprocessos deve seguir a **lógica das fases**: cada subprocesso corresponde a uma fase de negócio, não a micro-passos. Micro-passos ficam nas atividades.

- **Subprocesso (fase):** "Tingimento".
- **Atividade (passo):** "Preparar banho de corante", "Rodar ciclo na máquina".

> Se a lista de subprocessos ficou com mais de 10 itens, revise: provavelmente há fases que podem ser agrupadas.
$$, 'Processo cadastrado', '/processos/subprocessos', 1);

-- Lição 4.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 4)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Tipos de Atividade: Manual, Automática, Decisão ou Espera',
$$## Atividades

A **Atividade** é a unidade de execução do mapeamento: uma ação concreta executada dentro de um subprocesso.

### Os 4 tipos de atividade

| Tipo | O que é | Exemplo |
|---|---|---|
| **Manual** | Executada por uma pessoa | Conferir peso da mala |
| **Automática** | Executada por sistema/equipamento | Imprimir etiqueta automaticamente |
| **Decisão** | Um desvio/condição que ramifica o fluxo | Aprovado? Sim/Não (retrabalho) |
| **Espera** | O fluxo aguarda algo acontecer | Aguardando suprimento chegar |

### Por que o tipo importa?

- O tipo define a **natureza** da atividade e ajuda a ler o fluxo rapidamente.
- No **diagrama**, atividades de **decisão** viram o losango que ramifica o fluxo.
- Classificar bem revela **gargalos** (muitas esperas) e **oportunidades de automação** (muitas manuais repetitivas).

### Regras importantes

1. **Toda atividade pertence a um subprocesso.**
2. O **tipo** define a natureza: Manual, Automática, Decisão ou Espera.
3. A **ordem** define a sequência de execução dentro do subprocesso.

### Como preencher

A atividade é o **passo concreto** da rotina. Escreva como **verbo + objeto** — quem lê precisa entender o que FAZER, não apenas o que é.

| Tipo | Exemplos de bom preenchimento | Exemplo ruim |
|---|---|---|
| Manual | Conferir peso da malha recebida | Peso |
| Manual | Registrar entrada da OP no sistema | OP |
| Automática | Imprimir etiqueta de lote automaticamente | Etiqueta |
| Decisão | Cor do lote aprovada? (Sim = segue / Não = retrabalho) | Aprovado? |
| Espera | Aguardar resfriamento da máquina | Esperar |

### Boa prática

Escreva a atividade como **verbo + objeto**:
- **Sim:** Conferir peso da malha recebida
- **Sim:** Validar fatura contra pedido
- **Sim:** Registrar ordem de produção de urdimento
- **Não:** Peso / Validação / OR / Etapa 3

### Dúvida comum: "Decisão" vs "Espera"

- **Decisão** é um **desvio** que muda o caminho: *"Cor aprovada? Sim → segue / Não → retrabalho"*.
- **Espera** é quando o fluxo **para aguardando algo acontecer**: *"Aguardar chegada do fio"* ou *"Aguardar programação"*.
- Regra rápida: se há **dois caminhos possíveis**, é decisão. Se há **um caminho com pausa**, é espera.
$$, 'Subprocesso cadastrado', '/processos/atividades', 2);

-- ============================================================
-- MÓDULO 5: Diagramas
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Diagramas', 'A representação visual dos processos: o modelo semântico como fonte única e as representações Mermaid, BPMN e Canvas derivadas dele.', 'Workflow', '#0284c7', 5);

-- Lição 5.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 5)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Entendendo o modelo semântico',
$$## Modelo Semântico: a fonte única da verdade

O diagrama de processos funciona com uma ideia central: **um conhecimento, múltiplas representações**.

### A hierarquia das representações

```
Modelo Semântico (o que de fato é salvo)
   ├── Mermaid (texto/fluxo diagramável)
   ├── BPMN (padrão de modelagem)
   └── Canvas (edição visual livre)
```

### Como funciona na prática

- O **modelo semântico** guarda atividades, decisões e fluxos — **é o que de fato é salvo**.
- As abas **Mermaid**, **BPMN** e **Canvas** são representações editadas a partir do modelo.
- Na aba **Mermaid**, salvar o texto **re-importa o modelo semântico** (o texto vira fonte).
- **Toda alteração no modelo** deriva automaticamente Mermaid e resumo markdown.

### Regra de ouro

> **Não edite a representação como se fosse a fonte.** A fonte é o modelo. Se você precisa mudar o fluxo, mude o modelo — as representações acompanham.
$$, 'Processo mapeado', '/processos/visual', 1);

-- Lição 5.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 5)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Criando e organizando diagramas',
$$## Diagramas na prática

### Campos do cadastro

| Campo | Descrição |
|---|---|
| **Nome** | Nome do diagrama/processo |
| **Tipo** | Fluxograma, BPMN, Mapa mental ou Canvas livre |
| **Descrição** | Resumo do diagrama (opcional) |

### Boas práticas de organização

1. **Nome claro** — o nome do diagrama deve permitir identificar o processo sem abrir o arquivo.
2. **Tipo adequado** — use o tipo que melhor representa sua necessidade:
   - **Fluxograma** para fluxos simples de passos.
   - **BPMN** para processos com papéis/raias e padrão formal.
   - **Mapa mental** para explorar ideias e relacionamentos.
   - **Canvas livre** para diagramas fora do padrão.
3. **Descrição curta** — uma frase resumindo o que o diagrama mostra ajuda quem pesquisa depois.

### Onde encerra o ciclo

Os diagramas são a **representação visual** de processos que já foram mapeados nas telas de Processos. Use os diagramas para **comunicar** o fluxo, treinar o time e auditar o desenho.
$$, 'Módulo 4 (Subprocessos e Atividades)', '/processos/visual', 2);

-- ============================================================
-- MÓDULO 6: Boas Práticas no Mapeamento
-- ============================================================
INSERT INTO proc_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Boas Práticas no Mapeamento', 'Como manter a documentação viva, consistente e útil para o dia a dia da organização.', 'ShieldCheck', '#0c4a6e', 6);

-- Lição 6.1
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 6)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Os mandamentos da documentação de processos',
$$## Os Mandamentos

### 1. Se não está documentado, não é padrão

Se o time executa de um jeito, mas o documento diz outra coisa, **o documento está errado** — atualize-o.

### 2. Dados limpos = dados úteis

- Não abreveie nomes ("Benef." em vez de "Beneficiamento")
- Use nomes consistentes entre empresa, site, área e processo
- Revise entradas/saídas com o time de operação

> **Exemplo:** Se no chão de fábrica a área se chama "Expedição", não crie um processo com nome "Despacho de Mercadorias" — quem consulta não vai encontrar. Use o nome que o time reconhece.

### 3. Um responsável por processo

Todo processo deve ter um **dono** claramente identificado. Sem dono, o processo não evolui. O responsável não precisa executar tudo — ele responde por manter o processo atualizado e aprovado.

### 4. Cadastre de cima para baixo

Sempre empresa -> site -> área -> processo -> subprocesso -> atividade. Pular níveis gera órfãos e confusão.

### 5. Atualize o status e a versão

Não deixe um processo em "Rascunho" por meses. Quando mudar o conteúdo, **incremente a versão**.

### 6. Escreva para quem vai ler

Outra pessoa (ou o seu eu do futuro) precisa entender o processo **sem te perguntar**. Se não fizer sentido sozinho, melhore a descrição.

> **Como testar:** leia o que você escreveu em voz alta. Se precisou explicar "aqui eu quis dizer...", reescreva. Um bom processo é aquele que passa na mão de um colaborador **novo na área** sem dúvidas.

### 7. Processo vivo, não burocracia

Documentação existe para **ajudar**, não para preencher papel. Se um campo não agrega, questione. O objetivo é que o processo documentado **reflita a rotina real** — e que a rotina siga o processo documentado.
$$, 'Módulos 1 a 5', NULL, 1);

-- Lição 6.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 6)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Exemplo completo: Beneficiamento de Malha',
$$## Caso prático

Veja como montar o mapeamento de ponta a ponta, seguindo a hierarquia completa. Primeiro a visão geral; depois o detalhe de processos reais da fábrica.

### 1. Empresa

- Nome: PDM Têxtil

### 2. Site

- Nome: PDM São Paulo

### 3. Áreas cadastradas

1. Recebimento de Matéria-Prima
2. Urdimento
3. Tecelagem
4. Beneficiamento
5. Expedição e Logística

### 4. Processos da fábrica

| Área | Processo |
|---|---|
| Recebimento de Matéria-Prima | Recebimento e conferência de matéria-prima |
| Urdimento | Lançamento de OP de urdimento |
| Tecelagem | Lançamento de OP de tecelagem |
| Beneficiamento | Beneficiamento de Malha — Acabamento |
| Expedição e Logística | Expedição de pedidos |

### 5. Exemplo completo — Processo "Beneficiamento de Malha — Acabamento"

- **Responsável:** Coordenador de Acabamento
- **Status:** Aprovado / **Versão:** 1.2
- Entradas: Malha pré-tratada, corantes, fórmula técnica
- Saídas: Malha acabada enxugada, laudo de qualidade
- **Indicadores:** % de retrabalho — meta < 2% — mensal; tempo de ciclo (h/partida) — semanal; produtividade (kg/hora) — diária
- **Riscos:** Atraso de formulação — Média/Alta/Conferência de fórmula; quebra de máquina — Baixa/Alta/Manutenção preventiva
- **Controles:** Inspeção visual de defeitos; conferência de peso; alarme de temperatura

### 6. Subprocessos

1. Recebimento de matéria-prima
2. Pré-tratamento
3. Tingimento
4. Acabamento e expedição

### 7. Atividades (exemplo no Tingimento)

| Ordem | Atividade | Tipo |
|---|---|---|
| 1 | Preparar banho de corante | Manual |
| 2 | Carga da máquina | Manual |
| 3 | Rodar ciclo de tingimento | Automática |
| 4 | Cor aprovada? | Decisão |
| 5 | Aguardar resfriamento | Espera |
| 6 | Descarregar malha | Manual |

### 8. Exemplo rápido — Processo "Recebimento de Matéria-Prima"

- **Subprocessos:** 1. Recepção do veículo; 2. Conferência de danos; 3. Conferência de peso e quantidade; 4. Armazenagem
- **Atividades da conferência:** 1. Conferir peso da malha (Manual); 2. Conferir nota vs ordem de compra (Manual); 3. Conferido? (Decisão); 4. Aguardar liberação do almoxarifado (Espera)

### 9. Exemplo rápido — Processo "Expedição de Pedidos"

- **Subprocessos:** 1. Separação dos pedidos; 2. Conferência de quantidades; 3. Emissão de romaneio e nota; 4. Carregamento e saída
- **Atividades do carregamento:** 1. Organizar carga no caminhão (Manual); 2. Conferir romaneio vs carga (Manual); 3. Conferido? (Decisão); 4. Aguardar liberação da portaria (Espera)

### 10. Lançamento de OP (tecelagem, urdimento, beneficiamento)

O lançamento de **ordens de produção** pode ser mapeado como processo em cada área:

| Área | Subprocessos sugeridos |
|---|---|
| Urdimento | 1. Recepção da OP; 2. Programação do urdume; 3. Execução do urdimento; 4. Conferência e liberação |
| Tecelagem | 1. Recepção da OP; 2. Programação das máquinas; 3. Tecelagem; 4. Conferência e liberação do tecido |
| Beneficiamento | 1. Recepção da OP; 2. Programação do banho; 3. Execução do beneficiamento; 4. Conferência e liberação |

### 11. Roteiro de produção

O **roteiro de produção** nasce do mapeamento: é a sequência ordenada de subprocessos e atividades (recepção → conferência → execução → liberação) que o time segue. Com os processos documentados, o roteiro deixa de depender de memória e vira consulta rápida por área.

### 12. Diagrama

Use **Fluxograma** para esses fluxos e **BPMN** se precisar de raias por papel (Operador, Qualidade, Supervisão, Programação). Detalhe o **modelo semântico** com atividades e decisões — Mermaid, BPMN e Canvas acompanham automaticamente.
$$, 'Módulos 1 a 5', '/processos/processos', 2);
