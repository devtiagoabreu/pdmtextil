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

### Dicas

- Use o **nome completo** da organização, sem abreviações — isso garante consistência nas consultas.
- Se a empresa pertence a um grupo maior, cadastre a razão social exata.
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

### Dicas

- Se a empresa tem filiais em cidades diferentes, cada filial é um site.
- Use nomes que diferenciem unidades do mesmo grupo (ex: "PDM São Paulo" e "PDM Campinas").
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
- Expedição e Logística
- Qualidade e Controle
- TI Corporativa

### Regras importantes

1. **Toda área pertence a um site.**
2. Cada área pode conter **vários processos**.
3. Excluir uma área exige que ela **não tenha processos vinculados**.

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

### Além dos campos

O processo guarda também listas que descrevem o contexto:

- **Entradas** e **Saídas** — listas de texto (uma linha por item)
- **Fornecedores** e **Clientes** — quem entrega e quem recebe
- **Indicadores**, **Riscos** e **Controles** — uma linha por item na edição

### Regras importantes

1. **Todo processo pertence a uma área.**
2. O **status** reflete a situação do documento do processo.
3. Alterar a **versão é manual** — incremente quando houver mudança relevante no conteúdo.

### Boa prática de preenchimento

| Campo | Bom exemplo | Exemplo ruim |
|---|---|---|
| Nome | Beneficiamento de Malha | Beneficiamento |
| Entradas | Malha em rolo (cru) | Entrada |
| Saídas | Malha acabada, enxugada | Saída |
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

### Exemplo de decomposição

```
Processo: Beneficiamento de Malha
├── 1. Recebimento de matéria-prima
├── 2. Pré-tratamento
├── 3. Tingimento
└── 4. Acabamento e expedição
```

### Dica

A divisão em subprocessos deve seguir a **lógica das fases**: cada subprocesso corresponde a uma fase de negócio, não a micro-passos. Micro-passos ficam nas atividades.
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

### Boa prática

Escreva a atividade como **verbo + objeto**:
- **Sim:** Conferir peso da malha recebida
- **Sim:** Validar fatura contra pedido
- **Não:** Peso / Validação
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

### 3. Um responsável por processo

Todo processo deve ter um **dono** claramente identificado. Sem dono, o processo não evolui.

### 4. Cadastre de cima para baixo

Sempre empresa -> site -> área -> processo -> subprocesso -> atividade. Pular níveis gera órfãos e confusão.

### 5. Atualize o status e a versão

Não deixe um processo em "Rascunho" por meses. Quando mudar o conteúdo, **incremente a versão**.

### 6. Escreva para quem vai ler

Outra pessoa (ou o seu eu do futuro) precisa entender o processo **sem te perguntar**. Se não fizer sentido sozinho, melhore a descrição.

### 7. Processo vivo, não burocracia

Documentação existe para **ajudar**, não para preencher papel. Se um campo não agrega, questione.
$$, 'Módulos 1 a 5', NULL, 1);

-- Lição 6.2
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 6)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Exemplo completo: Beneficiamento de Malha',
$$## Caso prático

Veja como montar o mapeamento de ponta a ponta.

### 1. Empresa

- Nome: PDM Têxtil

### 2. Site

- Nome: PDM São Paulo

### 3. Área

- Nome: Beneficiamento de Malha

### 4. Processo

- Nome: Beneficiamento de Malha — Acabamento
- Responsável: Coordenador de Acabamento
- Status: Aprovado / Versão: 1.2
- Entradas: Malha pré-tratada, corantes, fórmula técnica
- Saídas: Malha acabada enxugada, laudo de qualidade
- Indicadores: % de retrabalho, tempo de ciclo

### 5. Subprocessos

1. Recebimento de matéria-prima
2. Pré-tratamento
3. Tingimento
4. Acabamento e expedição

### 6. Atividades (exemplo no Tingimento)

| Ordem | Atividade | Tipo |
|---|---|---|
| 1 | Preparar banho de corante | Manual |
| 2 | Carga da máquina | Manual |
| 3 | Rodar ciclo de tingimento | Automática |
| 4 | Cor aprovada? | Decisão |
| 5 | Aguardar resfriamento | Espera |
| 6 | Descarregar malha | Manual |

### 7. Diagrama

Use **Fluxograma** para esse fluxo e **BPMN** se precisar de raias por papel (Operador, Qualidade, Supervisão).
$$, 'Módulos 1 a 5', '/processos/processos', 2);
