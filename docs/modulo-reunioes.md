# Módulo de Reuniões — Especificação para Reimplantação

> Documento de implantação do módulo **Reuniões** (pauta, participantes, ata,
> encaminhamentos, transcrição, vídeo e links úteis).
> Destinado a **desenvolvedor** e **designer** que vão reimplementar o módulo
> em outra solução (Outro framework/stack permitido — o contrato aqui é
> Framework-agnostic: modelo de dados, API, regras e UX).
> Origem: projeto ISB (Next.js App Router + Prisma + Postgres). Atualizado: **2026-09-11**.

---

## 1. Visão geral

O módulo é um **repositório/histórico de reuniões** de um projeto de integração
entre ERPs. Permite registrar, antes de cada reunião, o que será discutido
(pauta) e quem participa; depois da reunião, a ata, um resumo (curto,
detalhado e de itens de ação), a transcrição da gravação, o link do vídeo,
links úteis e as tarefas/encaminhamentos com responsável, prazo e status.

Fluxo de uso típico:
1. **Antes:** criar a reunião com título, projeto, data/hora, local, montar a
   pauta e listar participantes.
2. **Durante/depois:** preencher ata, resumos e transcrição; marcar status
   `REALIZADA`.
3. **Acompanhamento:** registrar encaminhamentos (responsável/prazo/status),
   link do vídeo e links úteis; filtrar por projeto; abrir nova reunião quando
   os pendentes forem cobrados.

Requisitos-chave (não-funcionais):
- **Idempotência perceptiva:** todo formulário é uma única tela de
  novo/editar com listas dinâmicas.
- **Acessibilidade:** diálogos com foco preso (tab trap), fechar no `Esc`,
  `aria-modal`, estado de erro/carregando anunciáveis.
- **Dark mode** nativo.
- **Autorização** por permissão (ver vs. criar/editar vs. excluir).

---

## 2. Funcionalidades

| # | Funcionalidade | Detalhes |
|---|---|---|
| F1 | Listar reuniões | Ordenadas por **data desc**; card com badges (projeto, status), data/hora local, local, contadores (pautas, participantes, tarefas) e atalhos para vídeo/links |
| F2 | Filtrar por projeto | Select "Todos" + valores do enum; filtro no cliente (sem query na API) |
| F3 | Criar reunião | Modal com formulário completo |
| F4 | Ver detalhes / editar | Modal com formulário pré-preenchido (GET item individual) |
| F5 | Excluir reunião | Modal de confirmação (avisa que remove tudo junto, cascade) |
| F6 | Listas dinâmicas | Pauta, participantes, encaminhamentos e links: adicionar/remover itens antes de salvar |
| F7 | Resumos | `resumoCurto` (1 frase), `resumoDetalhado` (com citações), `resumoItensAcao` (decisões/PDCA) |
| F8 | Transcrição e vídeo | Campos texto livre + URL do vídeo (validado http/https) |
| F9 | Links úteis | Rótulo + URL (+descrição opcional); renderizados como atalhos clicáveis na lista |
| F10 | Encaminhamentos | Tarefa com status (Pendente/Em andamento/Concluído), responsável e prazo |

---

## 3. Modelo de dados (Postgres)

Entidade **Reuniao** agregando 5 coleções. Toda coleção filha usa
`ON DELETE CASCADE` (excluir reunião exclui tudo). Nomes de tabela/coluna
sugeridos (Postgres). Datas em `TIMESTAMP(3)` (UTC) — o front converte
para o timezone local.

```
reunioes
├── id SERIAL PK
├── titulo TEXT NOT NULL
├── projeto TEXT NOT NULL DEFAULT 'INTERNA'   -- enum ver §4
├── data TIMESTAMP(3) NOT NULL
├── local TEXT NULL
├── status TEXT NOT NULL DEFAULT 'AGENDADA'   -- enum ver §4
├── resumoCurto TEXT NULL
├── resumoDetalhado TEXT NULL
├── resumoItensAcao TEXT NULL
├── transcricao TEXT NULL
├── videoUrl TEXT NULL
├── createdAt TIMESTAMP(3) NOT NULL DEFAULT now()
├── updatedAt TIMESTAMP(3) NOT NULL
└── Índices: (data), (projeto)

reuniao_atas                -- 1:1
├── id SERIAL PK
├── reuniaoId INT UNIQUE FK -> reunioes.id (CASCADE)
├── conteudo TEXT NOT NULL
├── criadoPor TEXT NULL      -- nome/email do usuário autenticado
├── createdAt / updatedAt

reuniao_pautas
├── id SERIAL PK
├── reuniaoId INT FK -> reunioes.id (CASCADE)
├── ordem INT NOT NULL DEFAULT 0     -- posição (1-based)
├── descricao TEXT NOT NULL
└── Índice: (reuniaoId)

reuniao_participantes
├── id SERIAL PK
├── reuniaoId INT FK -> reunioes.id (CASCADE)
├── nome TEXT NOT NULL
├── empresa TEXT NULL
├── papel TEXT NULL
└── Índice: (reuniaoId)

reuniao_encaminhamentos
├── id SERIAL PK
├── reuniaoId INT FK -> reunioes.id (CASCADE)
├── descricao TEXT NOT NULL
├── responsavel TEXT NULL
├── prazo TIMESTAMP(3) NULL
├── status TEXT NOT NULL DEFAULT 'PENDENTE'  -- enum ver §4
└── Índice: (reuniaoId)

reuniao_links
├── id SERIAL PK
├── reuniaoId INT FK -> reunioes.id (CASCADE)
├── rotulo TEXT NOT NULL
├── url TEXT NOT NULL
├── descricao TEXT NULL
├── ordem INT NOT NULL DEFAULT 0
├── createdAt TIMESTAMP(3) NOT NULL DEFAULT now()
└── Índice: (reuniaoId)
```

---

## 4. Enums

| Enum | Valores | Label (pt-BR) | Uso |
|---|---|---|---|
| `projeto` | `SYSTEXTIL` · `BLING` · `INTERNA` · `OUTROS` | Systêxtil · Bling · Interna · Outros | Rótulo/badge e filtro |
| `status` (reunião) | `AGENDADA` · `REALIZADA` · `CANCELADA` | Agendada · Realizada · Cancelada | Estado da reunião |
| `status` (encaminhamento) | `PENDENTE` · `EM_ANDAMENTO` · `CONCLUIDO` | Pendente · Em andamento · Concluído | Acompanhamento de tarefa |

> Implementação sugerida: `const` arrays + funções `label(key)` com fallback
> para a própria chave (tolerante a valores desconhecidos).

---

## 5. API (contrato REST)

Base: `/api/reunioes`. Todos os endpoints validam **autenticação** e
**permissão** antes de tocar o banco. Formato de erro padronizado:
`{ "error": "<mensagem>" }`.

| Método | Rota | Permissão | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/reunioes` | `reunioes.read` | `200 { reunioes: [...] }` | 401/403 · 502 |
| POST | `/api/reunioes` | `reunioes.write` | `201 { reuniao }` | 400 (validação) · 401/403 · 502 |
| GET | `/api/reunioes/:id` | `reunioes.read` | `200 { reuniao }` | 404 · 401/403 · 502 |
| PUT | `/api/reunioes/:id` | `reunioes.write` | `200 { reuniao }` | 404 · 400 · 401/403 · 502 |
| DELETE | `/api/reunioes/:id` | `reunioes.delete` | `200 { ok: true }` | 404 · 401/403 · 502 |

### 5.1 GET lista — resposta (item da lista)

```jsonc
{
  "reunioes": [
    {
      "id": 1,
      "titulo": "Rodada 15 — release notes 2026",
      "projeto": "SYSTEXTIL",
      "data": "2026-09-11T15:00:00.000Z",
      "local": "Meet",
      "status": "REALIZADA",
      "videoUrl": "https://meet.google.com/…",
      "links": [ { "id": 1, "rotulo": "Release notes", "url": "https://…" } ],
      "createdAt": "…Z",
      "updatedAt": "…Z",
      "_count": { "pautas": 3, "participantes": 4, "encaminhamentos": 2, "links": 1 }
    }
  ]
}
```

Ordenação: `data` desc; `links` por `ordem` asc. (Para reimplantação em outra
stack: o campo `_count` é só um agregado; pode ser `pautas`, `participants`,
`tasks`, `links` — nomes de contrato livres, desde que documentados.)

### 5.2 Payload de criação/edição (POST/PUT)

```jsonc
{
  "titulo": "Rodada 15 — release notes 2026",        // obrigatório (trim)
  "projeto": "SYSTEXTIL",                            // enum; default INTERNA
  "data": "2026-09-11T15:00:00.000Z",                // ISO válida; obrigatório
  "local": "Meet",                                   // string | null
  "status": "REALIZADA",                             // enum; default AGENDADA
  "resumoCurto": "Uma frase com a essência",         // string | null
  "resumoDetalhado": "…com citações",                // string | null
  "resumoItensAcao": "Decisões e ações…",            // string | null
  "transcricao": "…",                                // string | null
  "videoUrl": "https://…",                           // só http(s):// | null
  "ata": "Conteúdo da ata…",                         // string | null
  "pautas":        [ { "descricao": "Item" } ],
  "participantes": [ { "nome": "Fulano", "empresa": "X", "papel": "Dev" } ],
  "encaminhamentos": [
    { "descricao": "Tarefa", "responsavel": "Jean",
      "prazo": "2026-10-01T12:00:00.000Z", "status": "PENDENTE" }
  ],
  "links": [ { "rotulo": "Release notes", "url": "https://…", "descricao": null } ]
}
```

Regras de validação (backend — o front já aplica igual):
- **titulo**: obrigatório após trim; erro `"O título da reunião é obrigatório."`
- **projeto/status**: se fora do enum, erro `"Projeto inválido."` /
  `"Status de reunião inválido."`
- **data**: parseável; senão `"Data da reunião inválida."`
- **videoUrl/urls**: devem casar `^https?://`; senão erro de link inválido
- **pautas**: descrições vazias são descartadas; `ordem` atribuída pelo servidor
  (posição no array)
- **participantes**: sem `nome` são descartados
- **encaminhamentos**: sem `descricao` descartados; `status` validado contra
  enum (default `PENDENTE`); `prazo` = ISO ou null
- **links**: `url` obrigatória e válida; `rotulo` default `"Link"`
- Arrays ausentes/`null` ⇒ tratados como lista vazia
- Strings opcionais: `""` ⇒ `null` (normalização `trim()`)

### 5.3 GET item — resposta (detalhe completo)

`{ "reuniao": { …campos da lista…, "resumoCurto": …, "resumoDetalhado": …,
"resumoItensAcao": …, "transcricao": …, "ata": { "conteudo": "…" } | null,
"pautas": [{ "id", "ordem", "descricao" }],
"participantes": [{ "id", "nome", "empresa", "papel" }],
"encaminhamentos": [{ "id", "descricao", "responsavel", "prazo", "status" }],
"links": [{ "id", "rotulo", "url", "descricao", "ordem" }] } }`

Ordenações internas: pautas e links por `ordem`; participantes e
encaminhamentos por `id`.

### 5.4 PUT — semântica

Atualização **transacional e destrutiva das coleções**: atualiza os campos
escalares de `reunioes`, apaga **todos** os filhos (pautas, participantes,
encaminhamentos, ata, links) e recria a partir do payload (a ata vira 1:1,
uma só). Assim, o front envia o **estado completo** do formulário.

### 5.5 Auditoria

`ata.criadoPor` é preenchido com o nome/email do usuário autenticado
(quando informado no payload, o payload não põe — o servidor usa o usuário
da sessão; o campo `criadoPor` do payload é fallback de import).

---

## 6. Autorização e integração de menu

- Permissões (chave → label):
  - `reunioes.read` — Reuniões: ver
  - `reunioes.write` — Reuniões: criar e editar
  - `reunioes.delete` — Reuniões: excluir
- Matriz por perfil (role): **admin** ⇒ read+write+delete ·
  **operador** ⇒ read+write · **visualizador** ⇒ read
- A **página** (`/reunioes`) exige `reunioes.read` (rota protegida: sem
  sessão redireciona para login; sem permissão redireciona para o início).
- Registro de menu/página no banco (padrão do ISB): tabela `pages`
  (`/reunioes`, título, descrição, ícone `reunioes`, `sensivel=false`,
  `permisao=reunioes.read`, `disponivel=true`) + `menu_items` vinculando a
  página a todos os menus existentes (ordem = fim da lista) + tabela
  `role_permissions`. Em outra solução, basta replicar o conceito:
  sidebar renderizada dinamicamente a partir de uma tabela de páginas
  (filtrada por permissão do usuário logado).

---

## 7. Frontend — UX/UI

### 7.1 Estrutura de telas

**Uma página única** com 3 estados visuais:
1. **Lista de reuniões** (estado principal)
2. **Modal Novo/Editar** (formulário completo, `max-width ~ 56rem`)
3. **Modal Excluir** (confirmação)

### 7.2 Lista (wireframe textual)

```
┌──────────────────────────────────────────────────────────┐
│ Reuniões  [i]                    [ Nova reunião ]        │
│ Pauta, ata, participantes e encaminhamentos por reunião  │
│ Projeto [Todos ▾]        3 registros                     │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Rodada 15 — release notes 2026                      │  │
│ │ [Systêxtil] [Realizada]                             │  │
│ │ 11/09/2026 · 15:00 · Meet                           │  │
│ │ [2 pauta(s)] [4 participante(s)] [2 tarefa(s)]      │  │
│ │ [▶ Vídeo da gravação ↗] [Release notes ↗]           │  │
│ │                              [Detalhes / Editar][Excluir] │
│ └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Badge projeto** (cores — ver §7.4): Systêxtil = índigo,
  Bling = sky/azul, Outros = âmbar, default = cinza.
- **Badge status**: Realizada = verde-esmeralda,
  Cancelada = vermelho, default = cinza.
- **Vídeo**: botão/atalho vermelho `▶ Vídeo da gravação ↗`
  (só se `videoUrl`).
- **Links úteis**: atalhos azuis `Rótulo ↗` (um por link), `target=_blank`
  + `rel="noopener noreferrer"`.
- **Contadores**: chips cinza com fonte mono.
- Botões por item: `Detalhes / Editar` (contorno) · `Excluir` (contorno
  vermelho, texto vermelho).

### 7.3 Formulário (modal) — blocos na ordem

1. **Dados básicos** (grid 2 colunas):
   - `Título *` (text) — placeholder: `ex.: Rodada 15 — release notes 2026`
   - `Projeto` (select enum)
   - `Data e hora` (`datetime-local`)
   - `Local / link` (text) — placeholder: `ex.: Meet, presencial, telefone…`
   - `Status` (select enum)
2. **Pauta** — lista dinâmica numerada (`1.` `2.`…) de inputs com botão
   `Remover`; header com botão `+ Item de pauta`; vazio ⇒ texto
   `Nenhum item de pauta.`
3. **Participantes** — linhas `Nome *` | `Empresa` | `Papel` + `Remover`;
   botão `+ Participante`; vazio ⇒ `Nenhum participante registrado.`
4. **Resumo e detalhes** — `Resumo curto` (input), `Resumo detalhado (com
   citação)` (textarea), `Resumo de itens de ação` (textarea)
5. **Ata** — textarea (`Decisões, discussões e observações…`)
6. **Transcrição** — textarea mono (`Transcrição completa da gravação…`)
7. **Link do vídeo da gravação** — input `type=url`
8. **Links úteis (documentos e sites)** — cartões com `Rótulo` |
   `URL *` na linha 1 e `Descrição` + `Remover` na linha 2; botão
   `+ Link útil`; vazio ⇒ `Nenhum link adicionado.`
9. **Tarefas (itens de ação)** — linha com `Descrição *` (flex maior),
   select `status`, `Responsável` (text), `Prazo` (`date`) + `Remover`;
   botão `+ Tarefa`; vazio ⇒ `Nenhuma tarefa registrada.`
10. Rodapé: `Cancelar` (ghost) · `Salvar` (primário) — desabilitado se
    `salvando` ou título vazio; mostra `Salvando…` durante o POST/PUT.

Feedback: `notice` (verde, `role="status"`) para criado/atualizado/excluído;
`erro` (vermelho, `role="alert"`) para falhas de validação/rede, exibido
tanto na lista quanto dentro do modal.

### 7.4 Design system (paleta/densidade do ISB)

| Token | Valor |
|---|---|
| Fundo da página | `max-w-5xl mx-auto px-6 py-10`, coluna gap 6 |
| Input | `rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm` — dark: `border-zinc-700` |
| Botão primário | `rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium` (desabilitado: `opacity-50`) |
| Botão ghost | `rounded-full border border-zinc-300 hover:bg-zinc-100` |
| Botão perigo | `rounded-full border border-red-300 text-red-600 hover:bg-red-50` (dark: `border-red-500`) |
| Card da lista | `rounded-xl border border-zinc-200 px-4 py-3` |
| Badge projeto SYSTEXTIL | `bg-indigo-100 text-indigo-700` / dark `bg-indigo-950 text-indigo-300` |
| Badge projeto BLING | `bg-sky-100 text-sky-700` / dark `bg-sky-950 text-sky-300` |
| Badge projeto OUTROS | `bg-amber-100 text-amber-700` / dark `bg-amber-950 text-amber-300` |
| Badge status REALIZADA | `bg-emerald-100 text-emerald-700` / dark `bg-emerald-950 text-emerald-300` |
| Badge status CANCELADA | `bg-red-100 text-red-700` / dark `bg-red-950 text-red-300` |
| Chip contador | `rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-zinc-600` |
| Atalho vídeo | `border-red-300 text-red-600` (sombra clara por cima em hover) |
| Atalho link | `border-blue-300 text-blue-600` |
| Tipografia | Título h1 `text-2xl font-semibold`; subtítulo `text-sm text-zinc-500` |

Todas as cores têm par **light/dark**.

### 7.5 Acessibilidade (obrigatório)

- **Dialog**: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
  apontando para o `<h2>`; foco vai para o 1º campo ao abrir; **tab trap**
  (Tab/Shift+Tab presos dentro); `Esc` fecha; ao fechar, o foco volta ao
  elemento que abriu; `body` scroll travado enquanto aberto. (Componente
  reutilizável — basta replicar essas regras no novo Dialog.)
- **InfoButton (`[i]`)**: botão circular "i" junto ao título com tooltip
  (descrição + exemplo em `<pre>`); abre/fecha, fecha com `Esc` e clique fora;
  `aria-label="Sobre: <título>"`.
- **Estados de erro/sucesso** com `role="alert"`/`role="status"`.

---

## 8. Fluxo de dados no cliente (referência)

1. Mount → `GET /api/reunioes` (e função `carregar()` usada após salvar/excluir).
2. `Nova reunião` / `Detalhes / Editar`:
   - novo → formulário em branco (`projeto=INTERNA`, `status=AGENDADA`,
     `data=agora local`, listas vazias);
   - editar → `GET /api/reunioes/:id`, converte para o formato do form
     (`datetime-local`/`date`, campos `''` para `null`, itens com `key` local).
3. Salvar → monta payload (trim, `'' → null`, `prazo` vira
   `YYYY-MM-DDT12:00:00` local → ISO, itens **novos de cada `key`**), envia
   `POST` ou `PUT`; sucesso → fecha modal + notice + recarrega lista; erro →
   exibe `data.error`.
4. Excluir → modal de confirmação → `DELETE :id` → `{ ok: true }` → recarrega.

> **Detalhe de implementação (importante):** itens dinâmicos (pautas,
> participantes, encaminhamentos, links) usam **`key` local por linha**
> (`useRef` incrementado) apenas para o React controlar os campos; o
> **payload não envia ids** — o servidor recria tudo (POST cria com
> `ordem=i+1`; PUT apaga e recria).

---

## 9. Regras de negócio consolidadas

1. `titulo` é o único campo escalar obrigatório; `data` deve ser válida.
2. URLs (`videoUrl` e `links[].url`) só `http(s)://`.
3. `ordem` de pauta/link = posição no array + 1 (servidor).
4. Ata é 1:1; editar substitui a ata anterior (sem histórico múltiplo).
5. Exclusão é **destrutiva em cascata** (tudo do filho some).
6. `criadoPor` da ata vem da sessão (auditoria), não do cliente.
7. Front e back validam o mesmo conjunto → defensa em profundidade.
8. Erros de banco retornam `502 { error: message }`; erro cliente retorna
   `400`; semi-autorizado `401/403`; inexistente `404`.

---

## 10. Checklist do desenvolvedor

**Backend**
- [ ] Modelos/tabelas (§3) com enums (§4) e índices
- [ ] 5 rotas REST (§5) com validação (§5.2) e autorização (§6)
- [ ] PUT transacional: update + delete-all + create-all + ata (re)create
- [ ] Resposta de lista com agregados (contadores) e ordenação por data desc

**Frontend**
- [ ] Lista (filtro por projeto, cards, badges, atalhos ↗, contadores)
- [ ] Modal novo/editar com todos os blocos (§7.3) e listas dinâmicas
- [ ] Modal de exclusão com aviso de cascata
- [ ] Normalização de payload (§8) e feedback notice/erro
- [ ] Dialog acessível (§7.5), dark mode e tokens (§7.4)
- [ ] Página protegida por permissão de leitura

**Testes sugeridos**
- Criar com todos os blocos preenchidos → recarregar → conferir ordem e valores
- Editar removendo itens → conferir que os filhos antigos sumiram (PUT destrutivo)
- Link inválido (sem `http`) → 400 com mensagem
- Excluir reunião com filhos → cascade + lista sem o item
- Sem permissão `reunioes.write` → 403 ao POST/PUT; sem `delete` → 403 ao DELETE

---

## 11. Referências do código-fonte (ISB)

**repositório**
- https://github.com/devtiagoabreu/isb
| Arquivo | Papel |
|---|---|
| `prisma/schema.prisma` (258–343) | Modelos Reuniao, Ata, Pauta, Participante, Encaminhamento, Link |
| `prisma/migrations/20260909143823_add_reunioes/migration.sql` | DDL inicial (1:1), página/menu/permissões |
| `prisma/migrations/20260909151355_add_reunioes_campos/migration.sql` | Campos de resumo/transcrição/vídeo + tabela `reuniao_links` |
| `prisma/migrations/20260909145500_seed_reunioes_historico/migration.sql` | Exemplos de seed (pautas/atas/encaminhamentos) |
| `lib/reunioes.ts` | Enums, labels, tipos e `validarReuniao()` |
| `app/api/reunioes/route.ts` | GET lista + POST |
| `app/api/reunioes/[id]/route.ts` | GET item + PUT + DELETE |
| `app/(app)/reunioes/page.tsx` | Página protegida (server) |
| `app/(app)/reunioes/client.tsx` | Todo o front (lista + modais) |
| `app/components/dialog.tsx` | Dialog acessível (reutilizável) |
| `app/components/info-button.tsx` | `InfoButton`/`InfoTitle` (tooltip) |
| `lib/auth.ts` (`apiRequire`, `currentUser`, `requireUser`, `requirePermission`) | Autorização |
| `lib/permissions.ts` | Registro de permissões do módulo |

---

## 12. Evolução no repositório atual (pdmtextil) — CRUD de projetos

A implantação atual (Next.js + Drizzle + Postgres, **4 bancos sincronizados**)
substituiu o **enum `projeto`** das reuniões por uma **tabela
`reunioes_projetos`** com FK em `reunioes.projeto_id`:

```
reunioes
├── projeto_id INT NOT NULL DEFAULT 1  -- FK -> reunioes_projetos.id
│                                          (antes: projeto TEXT enum)

reunioes_projetos
├── id SERIAL PK
├── nome TEXT NOT NULL UNIQUE
├── descricao TEXT NULL
├── data_inicio DATE NULL
├── data_fim DATE NULL
├── status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO'
│        -- EM_ANDAMENTO · ENCERRADO · PLANEJADO
├── cor VARCHAR(7) NULL          -- #RRGGBB (badge na UI)
├── ativo BOOLEAN NOT NULL DEFAULT true
├── created_at / updated_at TIMESTAMP DEFAULT now()
└── Índice: idx_reunioes_projetos_status
```

**Seed inicial (idempotente, `ON CONFLICT (nome) DO NOTHING`)**: Interna
(`#64748b`), Systêxtil (`#6366f1`), Bling (`#0ea5e9`), Outros (`#f59e0b`).
O projeto padrão é **id 1 (Interna)**.

### 12.1 Migração de dados

- Coluna legada `reunioes.projeto` é **backfillada** para `projeto_id`
  comparando `upper(btrim(projeto)) = upper(nome)` (linhas órfãs → Interna) e
  **removida** ao final (`DROP COLUMN IF EXISTS projeto` +
  `DROP INDEX IF EXISTS idx_reunioes_projeto`).
- Migration Drizzle: `src/lib/db/migrations/0050_reunioes_projetos.sql`
  (arquivo renomeado de 0031 por ordenação por nome; o journal do Drizzle não
  é usado pelo `migrate-all.js`, que rastreia por nome de arquivo).
- `scripts/migrate.js` (principal) e `scripts/sync-all-dbs.js` (3 secundários)
  têm blocos **idempotentes equivalentes**; o backfill roda só enquanto a
  coluna legada existe (DO block checando `information_schema.columns`).

### 12.2 API

| Método | Rota | Permissão | Sucesso | Erros |
|---|---|---|---|---|
| GET | `/api/reunioes/projetos` | autenticado | `200 { projetos: [...] }` | 401 · 502 |
| POST | `/api/reunioes/projetos` | `reunioes.write` | `201 { projeto }` | 400 (validação/duplicado) · 401/403 · 502 |
| GET | `/api/reunioes/projetos/:id` | autenticado | `200 { projeto }` | 404 · 501 |
| PUT | `/api/reunioes/projetos/:id` | `reunioes.write` | `200 { projeto }` | 404 · 400 · 401/403 · 502 |
| DELETE | `/api/reunioes/projetos/:id` | `reunioes.delete` (admin/sudo) | `200 { ok: true }` | 400 (id 1 ou com reuniões) · 404 · 401/403 · 502 |

- Nome **único** (comparação `lower()`, case-insensitive) → 409.
- `data_fim` não pode ser anterior a `data_inicio`; `cor` deve ser `#RRGGBB`;
  `status` restrito ao enum; `ativo` default `true`.
- **Exclusão bloqueada** para o projeto padrão (`id = 1`) e para projetos com
  reuniões vinculadas (FK RESTRICT) → `400`.
- Listagem de reuniões passa a expor `projetoId` e `projetoNome` (join em
  `reunioes_projetos`); o front filtra por `projetoId` numérico.

### 12.3 UI

- `/reunioes/projetos` — tela de gestão (cards com cor, status, datas e ativo;
  modal novo/editar; exclusão com confirmação). Ações de escrita gated por
  `podeEscreverReuniao`; exclusão por `podeExcluirReuniao` (admin/sudo).
- Select de projeto na página de reuniões é **dinâmico** (busca
  `/api/reunioes/projetos`), ordenado por nome, com default no primeiro
  projeto retornado.
- `user_menu_itens` recebe `Projetos → /reunioes/projetos` (ordem 1) em todo
  menu `Reuniões` (role-based e usuários específicos), idempotente.

### 12.4 Testes

- `src/lib/reunioes.test.ts` — validação `validarProjeto` + `validarReuniao`
  com `projetoId`.
- `src/app/api/reunioes/projetos/route.test.ts` e `[id]/route.test.ts` — CRUD,
  duplicado 409, bloqueios de exclusão, permissões.
- `src/app/api/reunioes/route.test.ts` e `[id]/route.test.ts` — payloads com
  `projetoId`/`projetoNome`.
- `src/app/(dashboard)/reunioes/page.test.tsx` e
  `src/app/(dashboard)/reunioes/projetos/page.test.tsx` — listas, filtro,
  criação/edição/exclusão e gate de permissão.