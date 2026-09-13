# Engenharia de Processos — PDM Pro Têxtil

Documentação técnica e de uso do módulo **Engenharia de Processos** do PDM Pro Têxtil
(Next.js 15 App Router + React 19 + Drizzle ORM + PostgreSQL).

Este documento descreve **como o módulo foi construído**: hierarquia de dados, telas,
rotas de API, editor visual de diagramas (modelo semântico → Mermaid/BPMN/Canvas),
persistência de estilos BPMN, treinamento interno e integrações com o restante do app.
Serve tanto para quem mantém o código quanto para quem usa o sistema e precisa ser
orientado pelo NotebookLM.

---

## 1. Visão geral

O módulo de Engenharia de Processos organiza e documenta os processos da organização em
uma **hierarquia padronizada** e oferece um **studio visual de diagramas** onde um mesmo
processo pode ser representado em vários formatos (Mermaid, BPMN 2.0 e canvas à mão livre)
sempre derivados de um **modelo semântico** que é a fonte única da verdade.

- Menu no app: **Processos** (ícone GitBranch).
- Módulo registrado no menu, na busca global (`search-registry.ts`, prefixo `processos-*`),
  em `telas-disponiveis.ts` (`processos: "Processos"`) e no sistema de ajuda contextual
  (`info-content/processos.ts`).
- Todas as telas possuem o padrão de listas/cadastros do PDM (busca, tabela, editar/excluir,
  botão de ajuda, toasts, modal de confirmação). Exclusões com vínculo são bloqueadas
  (modal de "Exclusão não permitida").
- Toda ação de escrita grava log (`registrarLog`) e dispara notificação (`notificar`).

---

## 2. Hierarquia de dados

A hierarquia é fixa e vale para o módulo inteiro:

```
Empresa → Site → Área → Processo → Subprocesso → Atividade
```

Cada nível tem seu cadastro próprio e páginas em `/processos/...`:

| Tabela (PostgreSQL) | Entidade | Nível |
|---|---|---|
| `proc_empresas` | Empresa | 1 |
| `proc_sites` | Site / unidade física | 2 |
| `proc_areas` | Área / departamento | 3 |
| `proc_processos` | Processo (objeto central) | 4 |
| `proc_subprocessos` | Subprocesso (etapa) | 5 |
| `proc_atividades` | Atividade (unidade de execução) | 6 |

Todas as tabelas seguem o mesmo padrão de schema:

- `id serial pk`, `nome varchar(200) not null`, `ativo boolean default true`,
  `created_at`/`updated_at` timestamps com `defaultNow()`.
- FK para o nível pai com `onDelete: "cascade"` (excluir pai apaga os filhos),
  declarada **no Drizzle**. As FKs reais do banco foram sincronizadas para `CASCADE`
  nos 4 bancos via `scripts/sync-fk-*`.

### 2.1 Empresas — `proc_empresas`

Colunas: `nome` (obrigatório), `cnpj varchar(18)`, `segmento varchar(100)`,
`observacoes text`, `ativo`.

Regras de negócio:
- Empresas inativas não aparecem na seleção de novos cadastros (filtro `ativo = true`
  nos selects dos formulários).
- Só é possível excluir uma empresa **sem sites vinculados** (caso contrário o backend
  devolve erro e o front mostra "Exclusão não permitida").

### 2.2 Sites — `proc_sites`

Colunas: `empresa_id int FK` (cascade), `nome`, `cidade varchar(100)`,
`uf varchar(2)` (2 caracteres), `ativo`.

Regra: todo site pertence a uma empresa; cada site pode conter várias áreas.
Exclusão bloqueada se houver áreas vinculadas.

### 2.3 Áreas — `proc_areas`

Colunas: `site_id int FK` (cascade), `nome`, `descricao text`, `ativo`.

Regra: toda área pertence a um site; cada área pode conter vários processos.
Exclusão bloqueada se houver processos vinculados.

### 2.4 Processos — `proc_processos` (objeto central)

Colunas e tipos:

- `area_id int FK` (cascade) — obrigatório.
- `codigo varchar(30)` — código de referência opcional.
- `nome varchar(200)` — obrigatório.
- `objetivo text` — objetivo do processo.
- `responsavel varchar(150)` — dono do processo.
- `status varchar(30)` — enum declarado:
  **RASCUNHO | APROVADO | PADRONIZADO | OBSOLETO** (default `RASCUNHO`).
  Labels no front: Rascunho / Aprovado / Padronizado / Obsoleto.
  Cores do badge: slate, blue, green, red (dark-mode preparado).
- `versao int` (default `0`) — **edição manual**: incremente quando o documento mudar.
- Listas `jsonb string[]` (default `[]`): `entradas`, `saidas`, `fornecedores`,
  `clientes`, `recursos`, `sistemas`, `equipamentos`.
- Listas `jsonb` de objetos (default `[]`):
  - `indicadores`: `{ nome, unidade, meta, frequencia }`
  - `riscos`: `{ descricao, probabilidade, impacto, controle }`
  - `controles`: `{ descricao, responsavel, frequencia }`
- `observacoes text`, `ativo`.

O formulário de processo monta essas listas com botões "Adicionar" e remoção por item.

### 2.5 Subprocessos — `proc_subprocessos`

Colunas: `processo_id int FK` (cascade), `nome`, `descricao text`,
`ordem int default 0` (sequência de execução), `ativo`.

Subprocessos inativos não aparecem no detalhe do processo.

### 2.6 Atividades — `proc_atividades`

Colunas: `subprocesso_id int FK` (cascade), `nome`, `tipo varchar(30)`,
`responsavel varchar(150)`, `ordem int default 0`, `observacoes text`, `ativo`.

`tipo` é um enum: **MANUAL | AUTOMATICA | DECISAO | ESPERA**
(Labels: Manual, Automática, Decisão, Espera).

---

## 3. Diagramas — "Process Studio" (`/processos/visual`)

Uso em tela: lista de diagramas (`GET /api/processos/diagramas`) com busca por nome/tipo/
descrição, colunas Nome/Tipo/Descrição/Status/ Ações, botão "Novo Diagrama". O detalhe
(`/processos/visual/[id]`) abre o editor com abas.

Tabela: `proc_diagramas`

- `id`, `nome` (obrigatório), `tipo` (enum **FLUXOGRAMA | BPMN | MAPAMENTAL | LIVRE**,
  default `FLUXOGRAMA`), `descricao text`.
- `modelo jsonb` — o **modelo semântico** (objeto JSON, ver seção 4).
- `bpmnXml text` — XML BPMN 2.0 (gerado do modelo ou editado manualmente).
- `canvas jsonb` — cena do Excalidraw `{ elements, files }`.
- `mermaid text` — código Mermaid persistido.
- `markdown text` — resumo markdown derivado (persistido no backend).
- `ativo`.

Slogan do editor: **"Um conhecimento, múltiplas representações."**

### 3.1 Aba "Modelo semântico"

Header comum do editor (todas as abas): **Nome***, **Tipo de diagrama** (dropdown com os 4
tipos), **Descrição** e checkbox **Ativo**.

A aba modelo lista três seções editáveis:

- **Atividades**: cada item tem `id` (automático: `A1`, `A2`, ... — prefixo `A` + número),
  Nome, Responsável e Sistema. Campos com `aria-label` para testes.
- **Decisões**: cada item tem `id` (`D1`, ...) e a pergunta (placeholder "NF conferida?").
- **Fluxos**: cada item tem `id` (`F1`, ...), selects de **Origem** e **Destino**
  (opções: Início, cada atividade, cada decisão, Fim) e **Rótulo** (ex.: "SIM").

Botões da aba:
- **Salvar modelo**: `PUT /api/processos/diagramas/[id]` gravando `{ nome, tipo, descricao,
  ativo, modelo }`. O backend deriva e grava `mermaid`, `markdown` e mantém `modelo`.
- **Gerar BPMN do modelo**: roda `modeloParaBpmn(modelo)` no cliente e substitui o XML
  atual (não salva — na aba BPMN há um botão "Salvar BPMN").
- **Gerar canvas do modelo**: roda `modeloParaCanvasExcalidraw(modelo)` no cliente e
  substitui o canvas (não salva — na aba Canvas há "Salvar canvas").

Heurística do botão "Fluxo" (`adicionarFluxo`): pega a primeira atividade ainda não
conectada como origem (senão `inicio`) e o primeiro nó diferente como destino (senão `fim`),
criando `{ id: F(n+1), de, para, rotulo: "" }`.

### 3.2 Aba "Texto Mermaid"

Pode-se editar o texto livremente. O texto **mostrado** é o override se existir, senão o
gerado do modelo (`modeloParaMermaid(modelo, tipo)`).

- **Salvar texto**: `PUT` gravando `{ ..., mermaid: texto }`. No backend,
  `mermaidParaModelo(texto)` **reconstrói o modelo semântico** a partir do texto e grava
  `modelo`, `mermaid` e `markdown`. Se o texto não tiver nenhuma seta `-->`, o backend
  devolve 400 com o erro de parse.
- **Importar texto → modelo**: no cliente, `mermaidParaModelo(texto)`; se válido, atualiza
  o modelo e marca o override do texto (para não perder o que o usuário escreveu).

### 3.3 Aba "BPMN"

Editor **bpmn-js** (carregado com `next/dynamic`, `ssr: false`). Ver seção 5.

- Botões: **Gerar do modelo** (regenera o XML a partir do modelo semântico) e
  **Salvar BPMN** (`PUT` gravando `{ modelo, bpmnXml }`).
- O XML pode ser exportado/baixado pelo próprio menu nativo do bpmn-js.

### 3.4 Aba "Canvas"

Editor **Excalidraw** (`@excalidraw/excalidraw`, `ssr: false`), à mão livre — indicado para
mapas mentais. O estado é `{ elements, files }`.

- Botões: **Gerar do modelo** (`modeloParaCanvasExcalidraw`) e **Salvar canvas**
  (`PUT` gravando `{ modelo, canvas }`).

### 3.5 Aba "Exportar"

Exporta as representações derivadas do modelo atual (sem depender de salvar):

- **Mermaid**: botões **Copiar** e **Baixar `.mmd`** (`diagrama.mmd`).
- **Resumo (markdown)**: **Copiar** e **Baixar `.md`** (`resumo.md`).
- **Modelo semântico (JSON)**: **Copiar** e **Baixar `.json`** (`modelo.json`, Pretty-print
  com `JSON.stringify(modelo, null, 2)`).
- Nota: o BPMN 2.0 editável está pronto na aba BPMN (XML exportável pelo próprio editor).

---

## 4. Modelo semântico — formato e utilitários

Tipo `ModeloProcesso` (tipado em `src/lib/processos/diagrama/types.ts`):

```ts
interface ModeloProcesso {
  schemaVersion?: string   // "1"
  nome?: string
  objetivo?: string
  atividades: AtividadeSemantica[]  // { id, nome, responsavel?, sistema?, descricao? }
  decisoes: DecisaoSemantica[]      // { id, pergunta }
  fluxos: FluxoSemantico[]          // { id, de, para, rotulo? }
}
```

- IDs reservados: `inicio` (INICIO_ID) e `fim` (FIM_ID).
- Geradores de id (`modelo-semantico.ts`): `novoIdAtividade`/`novoIdDecisao`/`novoIdFluxo`
  calculam o maior número do prefixo (`A`, `D`, `F`) e incrementam.
- `modeloVazio(nome)` retorna `{ schemaVersion:"1", nome, objetivo:"", atividades:[],
  decisoes:[], fluxos:[] }`.
- `normalizarModelo` (no editor) garante que qualquer JSON lido vire um modelo completo
  com as 6 chaves (atividades/decisoes/fluxos sempre arrays).
- `resumoModelo(modelo)` → `{ atividades, decisoes, fluxos, nos }`.
- `nomeDoNo(modelo, id)` resolve `inicio`→"Início", `fim`→"Fim", atividade pelo nome,
  decisão pela pergunta.

O modelo é o que de fato é a "fonte da verdade": ao salvar modelo, Mermaid e markdown são
derivados no backend (`derivarRepresentacoes`); ao salvar texto Mermaid, o modelo é
**reconstruído** (o texto vira fonte). BPMN e Canvas são derivados no cliente e salvos
separadamente.

---

## 5. Editor BPMN (bpmn-js)

Componente: `src/components/processos/bpmn-editor.tsx` (+ CSS `bpmn-editor.css`).

### 5.1 Montagem

- Carrega `bpmn-js/lib/Modeler` dinamicamente (`import()`), sem SSR.
- Instância criada com `container`, `keyboard: { bindTo: document }` e
  `moddleExtensions: { pdm: PDM_MODDLE_EXTENSION }` (obrigatório para persistir estilos;
  ver 5.5).
- No mount: `importXML(xml)` → `canvas.zoom("fit-viewport")` →
  `reaplicarTodosEstilos(container, elementRegistry)` (aplica nos labels os estilos de
  texto gravados no XML).
- `commandStack.changed` → `saveXML({ format: true })` → se o XML mudou, chama `onChange`
  (o pai guarda o XML no estado). A mesma persistência acontece ao usar o painel de estilos.
- Quando o pai muda o XML (prop `xml`), o editor reimporta e reaplica estilos.
- Escuta `selection.changed`: ao selecionar **exatamente um** nó (e não o canvas), abre o
  painel de estilos preenchido com os valores do elemento.
- Cleanup no unmount: `modeler.destroy()`.

### 5.2 Painel de estilos

Ao selecionar uma forma/conexão:

- **Preenchimento** (cor de fill) — `modeling.setColor(el, { fill, stroke })`.
- **Borda** (stroke).
- **Cor do texto** — grava `pdm:textFill` e aplica CSS no `.djs-label`.
- **Família** — dropdown com 8 fontes: Arial, Helvetica, Verdana, Tahoma,
  Times New Roman, Georgia, Courier New, Trebuchet MS.
- **Tamanho** — dropdown 10, 11, 12, 13, 14, 15, 16, 18, 20.
- **N** (negrito) e **I** (itálico) — toggles.
- **Limpar estilos** (ícone de reiniciar no topo do painel): `setColor(fill/stroke
  undefined)` exatamente para os defaults (`#ffffff` / `#333333`), `limparEstilosTexto(di)`
  (remove todos os atributos `pdm:*`), volta os controles aos defaults (texto `#000000`,
  Arial, 14, normal) e fecha o painel.
- Defaults: fill `#ffffff`, stroke `#333333`, texto `#000000`, Arial 14.
  Ao aplicar cor, valores iguais aos defaults são enviados como `undefined` (não geram
  atributo no XML).

### 5.3 Fundo claro/escuro no editor

- Estado `escuro` inicializado a partir de
  `document.documentElement.classList.contains("dark")` (com guard de `typeof window`).
- Botão **Escuro/Claro** (lua/sol, `aria-label` "Fundo escuro"/"Fundo claro") alterna e
  escreve `data-escuro="true|false"` no container do canvas.
- O container alterna `bg-white`/`bg-slate-900` e border por slot. O CSS
  (`bpmn-editor.css`) usa `[data-escuro="true"]` para sobrepor cores nativas do bpmn-js:
  fundo da palette, popup menu, context pad, tooltip e canvas fill.
- **Legibilidade do texto na edição direta** (double-click): override
  `.djs-direct-editing-content { color: #0f172a }` para o conteúdo de edição nunca herdar
  a cor clara dos labels em dark (ficava invisível). Labels em dark mantêm `#e2e8f0`
  (`.djs-label`), sem `!important`.

### 5.4 Persistência de estilos no XML (namespace `pdm`)

Arquivo: `src/lib/processos/diagrama/estilos-bpmn.ts`.

- Sufixo: prefixo `pdm:` aplicado às chaves: `pdm:textFill`, `pdm:fontFamily`,
  `pdm:fontSize` (Integer), `pdm:fontWeight`, `pdm:fontStyle`.
- **Namespace**: `PDM_NAMESPACE_URI = "http://pdm.pro/textil/diagrama"`.
- **`PDM_MODDLE_EXTENSION`**: descreve o tipo `PdmEstilos` (superClass `Element`) com as 5
  propriedades como atributos. **Sem essa extensão o moddle descarta os atributos `pdm:*`
  ao serializar o XML** (estilos se perdem no save/reload).
- `salvarEstilosTexto(di, estilos)`: grava os atributos em `di.$attrs`. Como `$attrs` é
  read-only no moddle quando ausente, é criado com
  `Object.defineProperty(alvo, "$attrs", { value:{}, writable:true, configurable:true,
  enumerable:true })`. Valores `undefined` são removidos; retorna `true` se havia o que salvar.
- `lerEstilosTexto(di)`: lê `$attrs`; `fontSize` é recebido como string pelo bpmn-js e é
  coagido a número (`Number(...)`), do contrário o CSS `font-size` viraria inválido.
- `limparEstilosTexto(di)`: remove todos os atributos que começam com `pdm:`.
- `estilosTextoParaCss(estilos)`: mapeia para CSS aplicável no label
  (`fill`, `fontFamily`, `fontSize: "Xpx"`, fontWeight, fontStyle).
- `reaplicarTodosEstilos`: percorre `elementRegistry.getAll()`, lê estilos de cada
  `businessObject.di` e aplica no `.djs-label` (`[data-element-id="..."] .djs-label`) nas
  propriedades de texto (nome do elemento no diagrama).

### 5.5 Geração BPMN a partir do modelo

`src/lib/processos/diagrama/bpmn.ts` — `modeloParaBpmn(modelo)`:

- Layout em grade: colunas a cada 240px, linhas a cada 160px, margem (80,80).
- Nós: startEvent (40×40), endEvent (40×40) — condições para criar Início/Fim: existe
  atividade com id reservado OU não há fluxos OU algum fluxo usa o id;
  tasks (tarefa 150×80) para atividades; exclusiveGateway (50×50) para decisões.
- Fluxos: `sequenceFlow` com `sourceRef`/`targetRef`; se há rótulo, vira `name` + 
  `conditionExpression` `tFormalExpression` com o rótulo.
- DI: BPMNShape com Bounds para cada nó; BPMNEdge com waypoints nos centros.
- `targetNamespace` = `http://pdmtextil.com.br/processos`; nome do processo = nome do modelo
  (default "Processo"); `isExecutable="false"`.
- Escapes XML aplicados (`xmlEscape`) e acentos preservados (`esc`).

---

## 6. Mermaid

`src/lib/processos/diagrama/mermaid.ts`.

### Geração (`modeloParaMermaid(modelo, tipo?)`)

- `tipo === "MAPAMENTAL"` → `mindmap`:
  - raiz `raiz((Nome))`, cada atividade em nível 1, e na linha seguinte (nível 2) os extras
    `Responsável: X · Sistema: Y`; cada decisão vira item de nível 1.
- Senão → `flowchart TD`:
  - `inicio((Início))`, atividades `id["nome"]`, decisões `id{pergunta}`, `fim([Fim])`.
  - fluxos com rótulo → `de -->|rótulo| para`; sem rótulo → `de --> para`.

### Import (`mermaidParaModelo(texto)`)

Detecta `mindmap` (primeira linha) ou `flowchart`/`graph`.

- **Flowchart**: para cada linha de declaração conexa, parser de nós
  `parseNodeSpec`: `A(( ))`=início, `B([ ])`=fim, `X{ }`=decisão, `A[ ]`=atividade,
  id puro=atividade. Linhas marcadas como declaração (`flowchart`, `%%`, `#`, `er`,
  `classDef`, `click`) são ignoradas. Cria fluxos entre itens adjacentes (sem self-loop,
  sem duplicar; rótulo preenche o fluxo existente se vazio). Erro se não houver `-->`.
- **Mindmap**: mede indentação relativa à raiz (2 espaços por nível); nível 1 → atividade;
  nível 2 → `Responsável:`/`Sistema:` (senão descrição da atividade).

---

## 7. Canvas Excalidraw a partir do modelo

`src/lib/processos/diagrama/excalidraw.ts` — `modeloParaCanvasExcalidraw(modelo)`:

- Grade: colunas a cada 260px, linhas a cada 140px, margem (40,20); Início/Fim 120×60,
  atividades/decisões 200×60.
- Gera `text` elements para nós (fonte 20, alinhado ao centro) e `arrow` elements para os
  fluxos (stroke `#94a3b8`, `endArrowhead: "arrow"`), com rótulos como textos no meio do
  caminho.
- Saída: `{ elements: [...], files: {} }`, seeds sequenciais determinísticos.
- O componente `canvas-excalidraw.tsx` apenas embrulha o `Excalidraw` dynamic (ssr false),
  com `initialData` e `onChange` gravando `{ elements, files }`.

---

## 8. Resumo markdown

`src/lib/processos/diagrama/markdown.ts` — `modeloParaMarkdown(modelo)`: título `# nome`,
objetivo em negrito, linha de resumo (`N atividades · M decisões · P fluxos · Q nós`),
seção Atividades (lista numerada com responsável/sistema/descrição), Decisões (bullets com
pergunta e id) e Fluxos (`origem → destino (rótulo)` com nomes resolvidos).

---

## 9. Rotas de API

Todas usam `requireAuth()` (sessão valida) e `handleApiError`. Prefixo `/api/processos`.

| Rota | Ações |
|---|---|
| `/api/processos/empresas` e `/[id]` | CRUD de empresas (validação `procEmpresaSchema`) |
| `/api/processos/sites` e `/[id]` | CRUD de sites (`procSiteSchema`) |
| `/api/processos/areas` e `/[id]` | CRUD de áreas (`procAreaSchema`) |
| `/api/processos/processos` e `/[id]` | CRUD de processos (`procProcessoSchema`) |
| `/api/processos/subprocessos` e `/[id]` | CRUD de subprocessos (`procSubprocessoSchema`) |
| `/api/processos/atividades` e `/[id]` | CRUD de atividades (`procAtividadeSchema`) |
| `/api/processos/diagramas` e `/[id]` | CRUD de diagramas (ver abaixo) |
| `/api/processos/treinamento...` | Treinamento (ver seção 11) |

Delays de exclusão: FKs `cascade` no banco; no front, exclusão de registro com vínculo
mostra modal de bloqueio ("não pode ser excluído"). Exclusão de diagrama é restrita a
**ADMIN/SUDO** (403 caso contrário).

### Validações de diagrama (`procDiagramaSchema`)

- `nome` obrigatório (≤200).
- `tipo` no enum `FLUXOGRAMA|BPMN|MAPAMENTAL|LIVRE`.
- `modelo` opcional, validado por sub-schema `procDiagramaModeloSchema`:
  atividades `{ id(≤20, obrigatório), nome(obrigatório, ≤200), responsavel, sistema,
  descricao }`; decisões `{ id, pergunta(≤300, obrigatória) }`; fluxos
  `{ id, de, para, rotulo(≤100) }`. Todos com defaults vazios.
- `bpmnXml`/`mermaid`/`markdown` strings opcionais; `canvas` qualquer JSON; `ativo` boolean.

### POST/PUT de diagramas (derivações no servidor)

Função `derivarRepresentacoes` (presente em `route.ts` e `[id]/route.ts`):

1. Se veio `modelo` → grava `modelo`, deriva `mermaid = modeloParaMermaid(modelo, tipo)` e
   `markdown = modeloParaMarkdown(modelo)`.
2. Senão, se veio `mermaid` (string não vazia) → parse `mermaidParaModelo`; se inválido,
   **400** com a mensagem do parser; senão grava `modelo` reconstruído, `mermaid` original e
   `markdown` derivado.
3. Senão → mantém os valores existentes.

Posteriormente grava `bpmnXml` e `canvas` só se enviados (no PUT respectivo).

### Logs e notificações

- POST diagrama: log `CADASTRO/criar` → notificação `PROC_DIAGRAMA_CRIADA` apontando para
  `/processos/visual/[id]`.
- PUT: log `ATUALIZACAO/atualizar` → notificação `PROC_DIAGRAMA_ATUALIZADA`.
- DELETE (só ADMIN/SUDO): `notificarDelecao`.
- Os demais CRUDs seguem o padrão geral de logs/notificações do PDM.

---

## 10. Telas / URLs

| URL | Conteúdo |
|---|---|
| `/processos` | Lista hierárquica por Área com filtros; acesso a todos os cadastros |
| `/processos/empresas(/:id)` | Lista/form de Empresas |
| `/processos/sites(/:id)` | Lista/form de Sites |
| `/processos/areas(/:id)` | Lista/form de Áreas |
| `/processos/processos(/:id)` | Lista/form de Processos (indicadores, riscos, controles, listas) |
| `/processos/subprocessos(/:id)` | Lista/form de Subprocessos |
| `/processos/atividades(/:id)` | Lista/form de Atividades |
| `/processos/visual(/:id)` | Diagramas: lista e editor de abas ("Process Studio") |
| `/processos/treinamento(/:id)` | Treinamento (lições públicas) |
| `/processos/treinamento/admin(/:id)` | Gerenciar módulos/lições |
| `/processos/treinamento/exportar-pdf` | Exporta todo o treinamento em PDF |

O módulo usa o padrão visual geral do PDM (tabelas com hover, badges de status, modais de
confirmação, inputs com rótulo, toasts do `sonner`) e funciona em dark mode.

---

## 11. Treinamento da Engenharia de Processos

Tabelas (schemas `proc-treino-modulos.ts` / `proc-treino-licoes.ts`):

- `proc_treino_modulos`: `id`, `titulo` (obrigatório), `descricao`, `icone`
  (default "GraduationCap"), `cor` (default `#0ea5e9`), `ordem`, `ativo`.
- `proc_treino_licoes`: `id`, `modulo_id FK` (cascade — excluir módulo apaga lições),
  `titulo`, `conteudo_md` (markdown, obrigatório), `pre_requisitos`, `links_pop` e
  `links_video` (`jsonb` de `{ label, url, descricao }`), `pathname_relacionado`
  (tela do módulo de processos relacionada), `ordem`, `ativo`.

Páginas:

- `/processos/treinamento` — módulos ativos em acordeões com suas lições ativas; cada lição
  aponta para a tela relacionada; botão "Exportar Treinamento Completo"
  (`/processos/treinamento/exportar-pdf`).
- `/processos/treinamento/[id]` — lição individual com conteúdo renderizado, botão Exportar
  PDF e navegação anterior/próxima.
- `/processos/treinamento/admin` — CRUD de módulos e lições; "Novo Módulo" cria módulo com
  título e descrição; "Nova Lição" cadastra lição com módulo, título, ordem, pathname
  relacionado, pré-requisitos e conteúdo markdown.
- `/processos/treinamento/exportar-pdf` — gera PDF com todos os módulos e lições ativas
  (`api/processos/treinamento/exportar-pdf`).

Conteúdo atual inclui, no **Módulo Diagramas**, lições sobre: conceitos da Engenharia de
Processos, hierarquia e cadastros, e especificamente do editor BPMN (5.3 estilos de formas
e texto, 5.4 fundo claro/escuro, 5.5 modelo semântico e texto Mermaid na prática). A
população inicial é feita por seed SQL idempotente
(`scripts/seed-treinamento-bpmn-processos.sql` + runners `.cjs`), aplicada nos 4 bancos
(main `pdm_textil`, `pdm_pro_textil`, `pdm_ibirapuera` e Neon), com re-execução sem
duplicação (chave por título no módulo de ordem 5).

---

## 12. Dependências técnicas

- **bpmn-js** (+ CSS oficiais `diagram-js.css`, `bpmn-embedded.css`, `bpmn-js.css`) e
  **bpmn-moddle** (registrado em `src/types/modules.d.ts` como `declare module
  "bpmn-moddle"`).
- **@excalidraw/excalidraw** (carregado dinamicamente; blobs/textos em `files`).
- **zod** (schemas de validação das rotas) + `validateRequest` + `handleApiError`.
- **TanStack Query** (listas; `retry: false` em testes), `sonner` (toasts),
  `lucide-react` (ícones), Tailwind.
- **Drizzle ORM / PostgreSQL** — 4 bancos com schema replicado (`pdm_textil`,
  `pdm_pro_textil`, `pdm_ibirapuera`, Neon). Qualquer mudança de schema do módulo deve ser
  replicada nos 4 (ver `AGENTS.md`).

---

## 13. Fluxos recomendados no dia a dia

1. **Cadastrar a estrutura**: Empresa → Site → Área — nessa ordem (selects encadeados).
2. **Documentar o Processo**: nome, objetivo, responsável, status, versão e as listas de
   entradas/saídas/fornecedores/clientes/recursos/sistemas/equipamentos; adicionar
   indicadores, riscos e controles com seus formulários próprios. Status reflete a
   maturidade do documento (Rascunho → Aprovado → Padronizado; Obsoleto quando retirado).
3. **Decompor**: Subprocessos (ordem = sequência) e Atividades dentro de cada subprocesso
   (tipo: Manual/Automática/Decisão/Espera, ordem, responsável).
4. **Criar o diagrama** em `/processos/visual`: defina Nome, Tipo e preencha o **modelo
   semântico** (atividades, decisões, fluxos) — esta é a fonte da verdade.
5. **Representações**: gere Mermaid/BPMN/Canvas a partir do modelo, ajuste finos nas abas e
   salve cada uma. Tudo que precisa compartilhar está na aba Exportar
   (`.mmd`, `.md`, `.json`).
6. **Estilização BPMN** (aba BPMN): selecione um elemento, abra "Estilos", ajuste
   preenchimento/borda/cor do texto/fonte/tamanho/negrito/itálico. Os estilos ficam
   gravados no próprio XML (namespace `pdm`) e sobrevivem a salvar e reabrir. Use
   "Limpar estilos" para voltar aos padrão. Alterne fundo claro/escuro conforme o tema do app.
7. **Treinamento**: use `/processos/treinamento` para consultar a documentação campo a
   campo de cada tela.

---

## 14. Notas para quem desenvolve

- Nunca quebre o contrato do modelo semântico (as chaves `atividades`, `decisoes`, `fluxos`
  e ids únicos `A*`/`D*`/`F*` + `inicio`/`fim`); dele dependem Mermaid, BPMN, Canvas e o
  backend que re-deriva representações.
- Mudanças na serialização do BPMN precisam manter a extensão `pdm` no `moddleExtensions`,
  senão os estilos de texto somem ao salvar/reabrir.
- Testes cobrem: parse/geração Mermaid (roundtrip), BPMN (geração + roundtrip de estilos),
  editor de abas e listas de diagramas, CRUDs por schema validation, e as lições de
  treinamento (`page.test.tsx`, `route.test.ts`, factories `list-page-spec`/
  `form-page-spec`). Rodar: `npm run test`.
- Suíte atual: mais de 1.400 testes; `npm run test` é critério de aceite de toda entrega.