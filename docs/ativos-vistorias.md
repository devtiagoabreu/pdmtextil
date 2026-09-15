# Ativos e Vistorias — PDM Pro Têxtil

Documentação técnica e de uso do módulo **Ativos e Vistorias** do PDM Pro Têxtil
(Next.js 15 App Router + React 19 + Drizzle ORM + PostgreSQL).

Este documento descreve **como o módulo foi construído e deve ser usado**: cadastro de
ativos (patrimônio imobilizado), catálogo de vistorias periódicas com checklist,
agendamento recorrente (calendar-based), execução de vistorias com registro de
conformidade e dashboard de acompanhamento. Serve tanto para quem mantém o código quanto
para quem usa o sistema.

---

## 1. Visão geral

A fábrica precisa manter **ativos** (máquinas, extintores, hidrantes, SPDA, bombas,
compressoras, predial, etc.) sob **vistorias periódicas obrigatórias** — por exigência
legal (NRs, NBRs, órgãos ambientais) ou por boa prática de manutenção preventiva
(troca de óleo, lubrificação, etc.).

O módulo organiza isso em 5 entidades:

```
Categoria (setor responsável)
   └─ Ativo (bem imobilizado: máquinas, extintores, SPDA, predial...)
        └─ Tipo de Vistoria (checklist + periodicidade + base legal)
             └─ Plano de Vistoria (ativos × tipo de vistoria = agenda)
                  └─ Vistoria (ocorrência executada, uma a uma)
```

- Menu no app: **Ativos** (módulo novo em `telas-disponiveis.ts`).
- Registrado na busca global (`search-registry.ts`, prefixo `ativos-*`) e no sistema de
  ajuda contextual (`info-content/ativos.ts`).
- Todas as telas seguem o padrão de listas/cadastros do PDM (busca, tabela,
  editar/excluir, botão de ajuda, toasts, modal de confirmação). Exclusões com vínculo
  são bloqueadas (`fkError`).
- Toda ação de escrita grava log (`registrarLog`) e dispara notificação (`notificar`).

---

## 2. Pesquisa de domínio (benchmark)

Antes de modelar, foi feito levantamento de **todos os tipos de vistoria periódica** de
uma fábrica têxtil brasileira (ver `docs/taxonomia-vistorias.md`) e estudo de ferramentas
CMMS open source e pagas:

| Ferramenta | Tipo | Stack | Licença | Observação |
|---|---|---|---|---|
| **Atlas CMMS** | OS | Java + React + Docker | AGPL-3.0 | Melhor OS p/ chão de fábrica; pt-BR; mobile |
| **ERPNext Assets+Maintenance** | OS | Python/Frappe | GPL-3.0 | Modelo de PM auto-gerando "logs" inspiro o agendador |
| **Odoo Maintenance** | OS | Python | LGPL-3.0 | PM básico via cron |
| **openMAINT** | OS | Java/ExtJS | AGPL-3.0 | Foco em facilities; pesado; ruim p/ fábrica |
| Fiix / Limble / MaintainX / UpKeep / eMaint | Pago | SaaS | — | CMMS completos, $20–85/usuário/mês |

**Decisão**: o módulo é **nativo do PDM** (reusa login, menus, permissões, multi-banco e
padrões de cadastro) em vez de integrar um CMMS externo. O desenho do agendador segue o
conceito de **plano → ocorrências geradas automaticamente** do ERPNext Maintenance.

---

## 3. Modelo de dados

Schema em `src/lib/db/schema/ativos.ts`, exportado no barrel `schema/index.ts`.
Todas as tabelas seguem o padrão: `id serial pk`, `ativo boolean default true`,
`created_at`/`updated_at` com `defaultNow()`, FKs com `onDelete: "cascade"`.

### 3.1 Categorias — `ativos_categorias`

Colunas: `nome varchar(100)`, `setor varchar(30)`, `descricao text`, `cor varchar(20)`,
`icone varchar(50)`, `ativo`.

`setor` é enum declarado no schema:

| Valor | Label (front) | Responsável típico |
|---|---|---|
| `MECANICA` | Mecânica | Manutenção/mecânicos |
| `ELETRICA` | Elétrica | Eletricistas/NR-10 |
| `SEGURANCA` | Segurança | SESMT/brigada |
| `AMBIENTAL` | Ambiental | SGA/CETESB |
| `PREDIAL` | Predial/Civil | Administrativo/facilities |
| `LOGISTICA` | Logística | Depósito/expedição |
| `ADMINISTRATIVO` | Administrativo | Administração |

Exemplos de categoria (seed): Segurança Contra Incêndio, Mecânica, Elétrica/SPDA,
Ambiental, Predial/Civil, Logística, Equipamentos de Emergência.

### 3.2 Ativos — `ativos`

Patrimônio imobilizado. Colunas:

- `codigo varchar(40)` — código interno **único** (ex.: `MAQ-001`, `EXT-042`, `SPD-01`).
- `nome varchar(200)` — obrigatório (ex.: "Extintor CO2 6kg – Expedição").
- `categoriaId int FK` → `ativos_categorias` (cascade).
- `localizacao varchar(200)` — setor/andar/área físico (texto livre). Pode referenciar
  `proc_sites`/`proc_areas` da Engenharia de Processos em versão futura.
- Dados técnicos: `fabricante`, `modelo`, `numSerie`, `anoFabricacao int`,
  `dataAquisicao date`, `valorAquisicao numeric(12,2)`, `valorResidual numeric(12,2)`,
  `vidaUtilAnos int`.
- `status varchar(30)` — enum: **ATIVO | MANUTENCAO | INATIVO | BAIXADO**
  (default `ATIVO`).
- `maquinaId int FK` → `maquinas` (tabela existente de `maqoper.ts`), **opcional** —
  vinculo quando o ativo corresponder a uma máquina de produção já cadastrada.
- `responsavelId int FK` → `usuarios` (custodiante/responsável), opcional.
- `observacoes text`, `anexos jsonb` (array de `{ url, nome }`).

Regras:
- Código único; duplicidade é rejeitada (409).
- Mudar `status` para `BAIXADO` não exclui o histórico de vistorias.
- Exclusão bloqueada se houver planos de vistoria vinculados.

### 3.3 Tipos de vistoria — `ativos_tipos_vistoria`

É o **modelo/template** de vistoria (reaproveitável por vários ativos). Colunas:

- `nome varchar(200)` — ex.: "Vistoria mensal de extintores".
- `categoriaId int FK` → `ativos_categorias` (cascade), opcional.
- `setor varchar(30)` — enum de setor (denormalizado p/ filtros rápidos).
- `procedimento text` — instrução longa de como executar.
- `checklist jsonb` — `VistoriaItemTemplate[]` (ver abaixo).
- `periodicidade varchar(20)` — enum:
  **DIARIA | SEMANAL | MENSAL | TRIMESTRAL | SEMESTRAL | ANUAL | BIENAL | TRIENAL |
  QUINQUENAL | OUTRA**.
- `diasIntervalo int` — intervalo em dias usado no agendamento
  (default segue tabela: DIARIA=1, SEMANAL=7, MENSAL=30, TRIMESTRAL=90, SEMESTRAL=180,
  ANUAL=365, BIENAL=730, TRIENAL=1095, QUINQUENAL=1825). Para `OUTRA` é **obrigatório**.
- `baseLegal varchar(200)` — ex.: "NR-23 + NBR 12962", "NR-13", "NBR 5419".
- `ativo boolean`.

`checklist` — formato de cada item:

```ts
export type VistoriaItemTemplate = {
  ordem: number
  pergunta: string            // ex.: "Manômetro na faixa verde?"
  tipo: "SIM_NAO" | "OK_OBS" | "VALOR" | "TEXTO"
  obrigatorio?: boolean
  unidade?: string            // p/ VALOR: ex. "kgf/cm²"
}
```

### 3.4 Planos de vistoria — `ativos_planos_vistoria`

Relaciona **um ativo a um tipo de vistoria** e mantém o pivô do agendamento.

- `ativoId int FK` → `ativos` (cascade).
- `tipoVistoriaId int FK` → `ativos_tipos_vistoria` (cascade).
- `responsavelId int FK` → `usuarios` (executor padrão).
- `diasIntervalo int` — **override** opcional da periodicidade do tipo.
- `proximaData date` — próxima data programada (recalculada ao executar).
- `ativo boolean` — plano ativo gera vistorias; inativo não.

Constraint `unique(ativoId, tipoVistoriaId)`: **um ativo não tem o mesmo tipo de vistoria
duas vezes**.

### 3.5 Vistorias — `ativos_vistorias`

Ocorrência executável (work order leve de inspeção). Colunas:

- `planoId int FK` → `ativos_planos_vistoria` (cascade).
- `ativoId int FK` e `tipoVistoriaId int FK` — denormalizados p/ consulta rápida.
- `status varchar(20)` — enum: **PENDENTE | EM_ANDAMENTO | CONCLUIDA | NAO_CONFORME |
  CANCELADA**.
- `dataProgramada date` (default a data gerada no agendamento).
- `dataRealizada date` — preenchida ao concluir.
- `executadoPorId int FK` → `usuarios`.
- `resultado varchar(20)` — enum: **CONFORME | PARCIAL | NAO_CONFORME**.
- `checklistResposta jsonb` — `VistoriaResposta[]` (abaixo).
- `observacoes text`, `custo numeric(12,2)`, `anexos jsonb`.
- `createdById int FK` → `usuarios`.

```ts
export type VistoriaResposta = {
  ordem: number
  valor: string | number | null  // SIM/NAO ou valor lido ou texto
  observacao?: string
  conforme: boolean              // item aprovado?
}
```

---

## 4. Regras de negócio

### 4.1 Agendamento (núcleo)

Lógica em `src/lib/ativos/agendamento.ts` (teste unitário em
`src/lib/ativos/agendamento.test.ts`):

- `diasDaPeriodicidade(periodicidade)` → tabela de intervalos (acima).
- `proximaData(periodicidade, dataBase, diasOverride?)` → `dataBase + dias` (locale
  veio: adição de dias de calendário via `date-fns`/`Date`).
- `gerarOcorrencias(plano)` → fecha a janela de 12 meses: partindo de `proximaData`,
  cria registros `PENDENTE` em `ativos_vistorias` dentro do horizonte. Não duplica
  ocorrências já existentes para o mesmo plano na mesma `dataProgramada`.
- Ao **criar/editar plano**: recalcula `proximaData` e gera ocorrências.
- Ao **concluir uma vistoria**: preenche `dataRealizada`, `resultado`,
  `executadoPorId`, `checklistResposta`; avança o plano: `proximaData =
  dataRealizada + diasIntervalo`; **gera a próxima ocorrência** se ainda não existir.

**Vencida (atrasada)** = Vistoria com `status` ≠ `CONCLUIDA`/`CANCELADA` e
`dataProgramada <= hoje`. **Próximas** = `dataProgramada` dentro dos próximos N dias.

### 4.2 Resultado

- `resultado = NAO_CONFORME` quando **qualquer item `NÃO`/`conforme=false`**.
- `resultado = PARCIAL` quando alguma observação sem reprovar o item.
- `resultado = CONFORME` quando todos os itens aprovados.
- Regra aplicada no front (execução) e validada conforme abaixo.

### 4.3 Manual/automação

- Vistorias também podem ser **criadas manualmente** (`POST /api/ativos/vistorias`),
  fora de plano (plano vazio), para inspeções pontuais — ex.: pós-acidente,
  pré-quarentena, auditoria externa.
- Aprovar/negar item, anexar fotos/laudos e registrar custo são opções na execução.

---

## 5. Telas / URLs

Módulo em `src/app/(dashboard)/ativos/` (a área `(dashboard)` já é protegida pelo
middleware; o matcher ganha `/ativos`).

| URL | Tela | Descrição |
|---|---|---|
| `/ativos` | Home | Cards de acesso por sub-módulo (padrão `processos/page.tsx`) |
| `/ativos/dashboard` | Dashboard | Cards: total de ativos, vistorias pendentes, **atrasadas**, concluídas no mês, compliance % por setor + lista de próximas |
| `/ativos/ativos` | Lista de ativos | Busca por código/nome/marca/n° série; filtros por categoria/status/setor |
| `/ativos/ativos/novo` | Form novo | 
| `/ativos/ativos/[id]/editar` | Form edição |
| `/ativos/ativos/[id]` | Ficha do ativo | Dados + planos de vistoria + **histórico** de vistorias |
| `/ativos/categorias` | Categorias | CRUD simples |
| `/ativos/tipos-vistoria` | Tipos de vistoria | Lista com badge de periodicidade e base legal |
| `/ativos/tipos-vistoria/novo`, `[id]/editar` | Form tipo | **Editor de checklist** (lista de itens: pergunta + tipo + obrigatório) |
| `/ativos/planos` | Planos | Vincular ativo×tipo, executores, periodicidade |
| `/ativos/planos/novo`, `[id]/editar` | Form plano |
| `/ativos/vistorias` | **Agenda (central)** | Filtros por status/setor/ativo; atrasadas em **vermelho**, próximas em **amarelo**; botão "Executar" abre dialog com checklist dinâmico |

A tela de vistorias é a de uso diário (administrativo, mecânicos, SESMT, ambiental).

---

## 6. Rotas de API

Raiz `src/app/api/ativos/`. Todas com `export const dynamic = "force-dynamic"`,
`requireAuth()`, `validateRequest` (zod), `handleApiError`, e `registrarLog`+`notificar`
nos POST/PUT/DELETE.

| Rota | Métodos | Comportamento |
|---|---|---|
| `/api/ativos/categorias` | GET, POST | Lista (q, setor) / cria |
| `/api/ativos/categorias/[id]` | GET, PUT, DELETE | Detalhe/atualiza/exclui |
| `/api/ativos/ativos` | GET, POST | Lista (q, categoria, setor, status) / cria |
| `/api/ativos/ativos/[id]` | GET, PUT, DELETE | Ficha (detalhe + planos + histórico), atualiza, exclui |
| `/api/ativos/tipos-vistoria` | GET, POST | Lista (setor, periodicidade) / cria |
| `/api/ativos/tipos-vistoria/[id]` | GET, PUT, DELETE | |
| `/api/ativos/planos` | GET, POST | Lista (com joins ativo/tipo) / cria (+gera ocorrências) |
| `/api/ativos/planos/[id]` | GET, PUT, DELETE | |
| `/api/ativos/planos/[id]/gerar` | POST | Regera ocorrências do plano (idempotente) |
| `/api/ativos/vistorias` | GET, POST | GET filtros: `status`, `setor`, `atrasadas`, `proximas`, `ativoId`; POST manual |
| `/api/ativos/vistorias/[id]` | GET, PUT | PUT executa/conclui (checklist, resultado, datas) |
| `/api/ativos/dashboard` | GET | Resumo: totais, pendentes, atrasadas, concluídas mês, compliance por setor, próximas |
| `/api/ativos/vistorias/download` | GET | (opcional) export CSV/XLSX via `ExportarDados` no client |

Regras:
- DELETE de ativo/categoria/tipo com vínculo retorna `{ fkError: true }` (409).
- Excluir **plano** não apaga o histórico de vistorias concluídas
  (FK `plano_id` com `onDelete: "set null"` no bomba? → decisão: vistorias concluídas
  mantêm `plano_id`; na exclusão do plano, vistorias pendentes são canceladas).
- `PATCH /api/ativos/vistorias/bulk` (fase 2 se necessário) — por ora execução é
  individual.

---

## 7. Validações (zod) — `src/lib/validation.ts`

- `ativoCategoriaSchema` — `nome` (min 2), `setor` (enum), `descricao` opcional.
- `ativoSchema` — `codigo` (regex sensata), `nome`, `categoriaId` (int+), `status` enum,
  numéricos/técnicos opcionais, `maquinaId`/`responsavelId` ints opcionais.
- `tipoVistoriaSchema` — `nome`, `setor` enum, `periodicidade` enum; se `OUTRA`
  → `diasIntervalo` obrigatório; `checklist` = array de `VistoriaItemTemplate` validado
  item a item.
- `planoVistoriaSchema` — `ativoId`, `tipoVistoriaId`, `diasIntervalo` opcional (int > 0).
- `vistoriaSchema` (POST manual) — `ativoId`/`tipoVistoriaId`/`planoId` opcional.
- `vistoriaConclusaoSchema` (PUT) — status, `dataRealizada`, `resultado`, respostas.

---

## 8. Seed — `scripts/seed-vistorias.ts`

Popula os 4 bancos (idempotente, `IF NOT EXISTS` por nome) com:

1. **Categorias** (setor): Segurança Contra Incêndio (SEGURANCA), Mecânica (MECANICA),
   Elétrica/SPDA (ELETRICA), Ambiental (AMBIENTAL), Predial/Civil (PREDIAL),
   Logística (LOGISTICA), Equipamentos de Emergência (SEGURANCA).
2. **Tipos de vistoria** do catálogo `docs/taxonomia-vistorias.md` — cada um com
   periodicidade, `baseLegal` e `checklist` inicial (ex.: extintor mensal, teste de
   pressão de hidrante anual, SPDA semestral, troca de óleo de gerador 250h/PERIODICIDADE,
   inspeção de ponte rolante anual, potabilidade semestral...).

O usuário cria **ativos** e **planos** a partir desses tipos, ou cria tipos próprios.

---

## 9. Multi-banco e migrations

Seguir o fluxo obrigatório do projeto (AGENTS.md):

```
npx drizzle-kit generate
npm run db:migrate
npm run db:migrate:all
node scripts/sync-all-dbs.js
node scripts/compare-schemas.js
```

`scripts/sync-all-dbs.js` ganha as novas tabelas/colunas com `IF NOT EXISTS` para o banco
Neon.

---

## 10. Testes

| Cobertura | Arquivo | Estratégia |
|---|---|---|
| Lógica de agendamento | `src/lib/ativos/agendamento.test.ts` | Unitário puro (node) |
| Categorias (lista) | `ativos/categorias/page.test.tsx` | `listPageSpec` |
| Categorias (form) | `.../categorias/form.test.tsx` | `formPageSpec` |
| Ativos (lista) | `ativos/ativos/page.test.tsx` | `listPageSpec` |
| Tipos de vistoria (form com checklist) | `.../tipos-vistoria/form.test.tsx` | Custom (jsdom, `createFetchMock`) |
| Agenda de vistorias | `ativos/vistorias/page.test.tsx` | Custom (jsdom): filtros, atrasada, executar checklist |
| Dashboard | `ativos/dashboard/page.test.tsx` | Custom (jsdom) |

Critério de aceite: suíte completa verde — `npm run test`.

---

## 11. Fase 2 (evolução planejada)

- **Períodico por medição** (horas-máquina, km, peças) p/ troca de óleo a cada 250h etc.
- **Não conformidade → ação corretiva / ordem de serviço** com responsável, prazo, custo.
- **Ordens de serviço corretivas avulsas** e integração com estoque de peças.
- **QR code** colado no ativo abrindo a ficha/vistoria no mobile.
- **Depreciação contábil** simples (custo → residual por vida útil) e export Excel/PDF.
- Integração com `proc_sites`/`proc_areas` da Engenharia de Processos.

---