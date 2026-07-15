# Requisições de Corte — Documentação

## Visão Geral

O módulo de Requisições de Corte (`/comercial/requisicoes-corte`) gerencia solicitações de corte de tecido na produção têxtil. É um CRUD completo com cadastro, edição, exclusão, controle de status, dashboard com gráficos e geração de PDF.

### Arquitetura

- **Stack**: Next.js App Router + React + TypeScript + Drizzle ORM + PostgreSQL
- **UI**: Páginas client-side (`"use client"`) com chamadas REST para APIs internas
- **Banco**: 2 tabelas normalizadas (cabeçalho + itens) com FK e cascade delete
- **Autenticação**: next-auth com verificação de roles para exclusão

---

## Estrutura de Arquivos

| Caminho | Função |
|---------|--------|
| `src/app/(dashboard)/comercial/requisicoes-corte/page.tsx` | Lista de requisições (306 linhas) |
| `src/app/(dashboard)/comercial/requisicoes-corte/nova/page.tsx` | Criar nova requisição (218 linhas) |
| `src/app/(dashboard)/comercial/requisicoes-corte/[id]/page.tsx` | Detalhe/edição (315 linhas) |
| `src/app/(dashboard)/dashboard/requisicoes-corte/page.tsx` | Dashboard com gráficos (214 linhas) |
| `src/app/api/comercial/requisicoes-corte/route.ts` | API listar/criar (GET/POST) |
| `src/app/api/comercial/requisicoes-corte/[id]/route.ts` | API obter/atualizar/excluir (GET/PUT/DELETE) |
| `src/app/api/comercial/requisicoes-corte/[id]/status/route.ts` | API alterar status (PATCH) |
| `src/app/api/dashboard/requisicoes-corte-stats/route.ts` | API estatísticas do dashboard |
| `src/app/api/dashboard/requisicoes-corte-lista/route.ts` | API listagem filtrada do dashboard |
| `src/lib/db/schema/requisicoes-corte.ts` | Schema Drizzle (2 tabelas) |
| `src/lib/db/migrations/0012_requisicoes_corte.sql` | Migração SQL |
| `src/lib/validation.ts` (linhas 99-112) | Validação Zod |
| `src/lib/gerar-requisicao-corte-pdf.ts` | Geração de PDF (517 linhas) |
| `src/lib/tipos-status.ts` | Registro de tipo de status |
| `src/lib/search-registry.ts` | Registro de busca |
| `src/lib/info-content/comercial.ts` | Conteúdo de ajuda |
| `src/lib/notificar.ts` | Engine de notificações |

---

## Banco de Dados

### `requisicoes_corte` (cabeçalho)

| Coluna | Tipo | Descrição | Regras |
|--------|------|-----------|--------|
| `id` | `SERIAL PK` | ID interno | Auto incremento |
| `requisitante_id` | `INTEGER FK → usuarios.id NOT NULL` | ID do usuário que criou | Obrigatório, vinculado ao usuário logado |
| `status` | `VARCHAR(30) DEFAULT 'SOLICITADO' NOT NULL` | Status atual | `SOLICITADO` | `PROCESSANDO` | `ATENDIDO` |
| `observacoes` | `TEXT` | Observações livres | Opcional |
| `entregue_por` | `VARCHAR(200)` | Nome de quem entregou a requisição | Opcional, campo livre |
| `created_at` | `TIMESTAMP DEFAULT NOW()` | Data de criação | |
| `updated_at` | `TIMESTAMP DEFAULT NOW()` | Data da última alteração | |

### `requisicoes_corte_itens` (itens/linhas de corte)

| Coluna | Tipo | Descrição | Regras |
|--------|------|-----------|--------|
| `id` | `SERIAL PK` | ID interno | Auto incremento |
| `requisicao_corte_id` | `INTEGER FK → requisicoes_corte(id) ON DELETE CASCADE NOT NULL` | Vínculo com o cabeçalho | Excluir a requisição exclui os itens |
| `codigo_produto` | `VARCHAR(100)` | Código do produto (ex: `2.K2620...`) | Opcional |
| `ordem` | `VARCHAR(100)` | Número da ordem de produção | Opcional |
| `artigo` | `VARCHAR(200)` | Artigo do tecido | Opcional |
| `cor` | `VARCHAR(100)` | Cor (ex: `Palha`) | Opcional |
| `desenho` | `VARCHAR(100)` | Código do desenho (ex: `500101`) | Opcional |
| `quantidade` | `VARCHAR(50) NOT NULL` | Quantidade (ex: `2 M`, `150`) | **Obrigatório**. Armazenado como string para aceitar unidades como `"2 M"` |

### Tipos exportados (TypeScript)

```typescript
type RequisicaoCorte   = typeof requisicoesCorte.$inferSelect
type NewRequisicaoCorte = typeof requisicoesCorte.$inferInsert
type RequisicaoCorteItem = typeof requisicoesCorteItens.$inferSelect
type NewRequisicaoCorteItem = typeof requisicoesCorteItens.$inferInsert
```

---

## Validação (Zod) — `src/lib/validation.ts:99-112`

```typescript
const requisicaoCorteItemSchema = z.object({
  codigoProduto: z.string().optional().nullable(),
  ordem: z.string().optional().nullable(),
  artigo: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  desenho: z.string().optional().nullable(),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
})

const requisicaoCorteSchema = z.object({
  itens: z.array(requisicaoCorteItemSchema).min(1, "Adicione pelo menos um item"),
  observacoes: z.string().optional().nullable(),
  entreguePor: z.string().optional().nullable(),
})
```

### Regras de validação

1. **Quantidade**: campo obrigatório em cada item (`min(1)`)
2. **Itens**: array deve ter ao menos 1 elemento
3. **Campos opcionais**: `codigoProduto`, `ordem`, `artigo`, `cor`, `desenho` — podem ser `null`, `undefined` ou string vazia
4. **Campos do cabeçalho**: `observacoes` e `entreguePor` são opcionais

---

## Interface `RequisicaoCorteData` (PDF) — `src/lib/gerar-requisicao-corte-pdf.ts:5-21`

```typescript
interface RequisicaoCorteData {
  id: number
  status: string
  observacoes?: string | null
  entreguePor?: string | null
  createdAt?: string | null
  requisitanteNome?: string | null
  itens: {
    id?: number
    codigoProduto: string
    ordem: string
    artigo: string
    cor: string
    desenho: string
    quantidade: string
  }[]
}
```

---

## Interface `ItemLinha` (UI) — usada nas páginas de criar e editar

```typescript
interface ItemLinha {
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
}
```

---

## Ciclo de Vida do Status

```
SOLICITADO --> PROCESSANDO --> ATENDIDO
```

| Status | Label | Cor (UI) | Descrição |
|--------|-------|----------|-----------|
| `SOLICITADO` | Solicitado | Amber | Acabou de ser criada, aguardando processamento |
| `PROCESSANDO` | Processando | Indigo | Em andamento na produção |
| `ATENDIDO` | Atendido | Green | Finalizada/cortada |

- A alteração de status pode ser feita na página de detalhe via dropdown `Select`
- A rota `PATCH /api/comercial/requisicoes-corte/[id]/status` valida contra `STATUS_VALIDOS = ["SOLICITADO", "PROCESSANDO", "ATENDIDO"]` e dispara notificação `REQUISICAO_CORTE_STATUS`
- O admin pode configurar status personalizados via `GET /api/admin/status?tipo=REQUISICAO_CORTE` (a página de detalhe carrega essas opções)

---

## API — Listar e Criar (`/api/comercial/requisicoes-corte`)

### `GET` — Listar todas

**Autenticação**: `requireAuth()` (next-auth)

**Query SQL**: JOIN com `usuarios` (nome do requisitante) + LEFT JOIN com `requisicoes_corte_itens` com agregação (`COUNT` + `SUM` de quantidade parseada)

**Resposta**: Array de objetos:
```json
[{
  "id": 1,
  "requisitanteId": 3,
  "requisitanteNome": "João",
  "status": "SOLICITADO",
  "observacoes": null,
  "entreguePor": "Vilma",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z",
  "totalCortes": 5,
  "quantidadeTotal": "12.5"
}]
```

**Ordenação**: `createdAt DESC` (mais recentes primeiro)

### `POST` — Criar

**Autenticação**: `requireAuth()` — usa `userId` como `requisitanteId`

**Body**:
```json
{
  "itens": [{ "codigoProduto": "2.K2620", "ordem": "", "artigo": "", "cor": "Palha", "desenho": "500101", "quantidade": "2 M" }],
  "observacoes": "Urgente",
  "entreguePor": "Vilma"
}
```

**Regras**:
- Status é fixado como `"SOLICITADO"` no momento da criação
- Itens são inseridos em bulk (`INSERT` múltiplo)
- Dispara notificação `REQUISICAO_CORTE` via `notificar()`
- Registra log de auditoria via `registrarLog()`

**Resposta**: `201` com o objeto criado

---

## API — Obter, Atualizar, Excluir (`/api/comercial/requisicoes-corte/[id]`)

### `GET` — Obter detalhe

Retorna o cabeçalho (com nome do requisitante via JOIN) + array de itens ordenados por `id`.

**Resposta**:
```json
{
  "id": 1,
  "requisitanteId": 3,
  "requisitanteNome": "João",
  "status": "SOLICITADO",
  "observacoes": "Urgente",
  "entreguePor": "Vilma",
  "createdAt": "...",
  "updatedAt": "...",
  "itens": [{ "id": 1, "codigoProduto": "2.K2620", "quantidade": "2 M", ... }]
}
```

### `PUT` — Atualizar

Atualiza campos do cabeçalho (`observacoes`, `entreguePor`, `status`) e, se `body.itens` for fornecido, **substitui todos os itens** (deleta os existentes e reinsere).

**Regras**:
- `updatedAt` é sempre atualizado para `new Date()`
- A atualização de itens é uma substituição completa (DELETE + INSERT), não incremental
- Registra log de auditoria

### `DELETE` — Excluir

**Autorização**: permite apenas usuários com role `COMERCIAL`, `ADMIN`, `SUDO` ou o próprio requisitante.

**Regras**:
- Exclusão em cascata (DB-level `ON DELETE CASCADE`) remove todos os itens
- Dispara notificação de deleção via `notificarDelecao()`

---

## API — Status (`PATCH /api/comercial/requisicoes-corte/[id]/status`)

```json
{
  "status": "PROCESSANDO",
  "comentario": "Iniciado corte hoje"
}
```

**Validação**: `status` deve pertencer a `["SOLICITADO", "PROCESSANDO", "ATENDIDO"]`

**Ações**:
- Atualiza `status` e `updatedAt`
- Dispara notificação `REQUISICAO_CORTE_STATUS`
- Registra log de auditoria

---

## API — Dashboard Stats (`GET /api/dashboard/requisicoes-corte-stats`)

Três queries paralelas:

1. **Status distribution**: `SELECT status, COUNT(*) FROM requisicoes_corte GROUP BY status`
2. **Total items**: `COUNT(*)` de itens + `SUM` de quantidade (com regex para limpar caracteres não numéricos)
3. **Monthly trend**: últimos 6 meses, `COUNT(*)` agrupado por `YYYY-MM`

**Resposta**:
```json
{
  "totalGeral": 50,
  "solicitados": 20,
  "processando": 15,
  "atendidos": 15,
  "totalItens": 120.5,
  "totalCortes": 200,
  "totalEsteMes": 8,
  "statusDistribution": [{ "status": "SOLICITADO", "total": 20 }, ...],
  "monthlyTrend": [{ "mes": "jan/25", "total": 10 }, ...]
}
```

---

## API — Dashboard Lista (`GET /api/dashboard/requisicoes-corte-lista?filtro=`)

Filtros aceitos:
| Parâmetro | Condição SQL |
|-----------|-------------|
| `total-geral` | Sem filtro (todos) |
| `solicitados` | `status = 'SOLICITADO'` |
| `processando` | `status = 'PROCESSANDO'` |
| `atendidos` | `status = 'ATENDIDO'` |
| `este-mes` | `created_at` dentro do mês corrente |

Retorna array com `id`, `status`, `requisitanteNome`, `totalCortes`, `quantidadeTotal`, `createdAt`.

---

## Páginas — Fluxo do Usuário

### Lista (`/comercial/requisicoes-corte`)

- Tabela com colunas: checkbox, `#`, Requisitante, Cortes, Qtd Total, Status, Data, Ações
- **Status badges**: pills coloridas (amber/indigo/green)
- **Multi-select**: checkboxes para selecionar requisições para PDF
- **Ações por linha**: PDF (individual), Ver (link para detalhe), Excluir (modal de confirmação)
- **PDF em lote**: "PDF (N)" gera PDFs individuais; "Consolidado (N)" gera PDF único com várias páginas
- **Estado vazio**: ícone Scissors + link "Criar primeira requisição"
- Ao clicar na linha (exceto actions), navega para o detalhe

### Criar (`/comercial/requisicoes-corte/nova`)

- Formulário com tabela de itens dinâmica (adicionar/remover linhas)
- Placeholders nos inputs: `2.K2620` (código produto), `Palha` (cor), `500101` (desenho), `2 M` (quantidade)
- Campos adicionais: Observações (textarea), Entregue por (input texto, placeholder `Vilma`)
- **Validação client-side**: pelo menos 1 item com `quantidade` preenchida
- POST para API, redirect para lista em caso de sucesso

### Detalhe/Edição (`/comercial/requisicoes-corte/[id]`)

- Link "Voltar" para a lista
- Cabeçalho: `Requisição #ID`, status badge, total de cortes e quantidade
- Botões: PDF, Salvar
- Tabela de itens editável (add/remove linhas com Inputs)
- Seção "Informações Adicionais": Observações (textarea), Entregue por (input), Status (Select dropdown)
- Status options carregados de `GET /api/admin/status?tipo=REQUISICAO_CORTE` (fallback silencioso se falhar)
- **Regra**: ao menos 1 item com quantidade preenchida para salvar
- PUT para API (substituição completa de itens)

### Dashboard (`/dashboard/requisicoes-corte`)

- **5 cards clicáveis**: Total Geral, Solicitados, Processando, Atendidos, Este Mês
- **2 cards secundários**: Total de Cortes (count de itens), Qtd Total (soma de quantidades)
- **Gráfico de pizza (Recharts)**: distribuição por status
- **Gráfico de linha**: requisições por mês (últimos 6 meses)
- **Modal**: ao clicar em um card, busca a lista filtrada e exibe em modal clicável (navega para o detalhe)

---

## PDF — `src/lib/gerar-requisicao-corte-pdf.ts`

### Funções exportadas

| Função | Descrição |
|--------|-----------|
| `gerarRequisicaoCortePdf(data)` | Gera PDF individual para uma requisição |
| `gerarRequisicaoCortePdfConsolidado(lista)` | Gera PDF consolidado com várias requisições |

### Estrutura do PDF (landscape, jsPDF + jspdf-autotable)

1. **Header** (barra azul): logo + "REQUISIÇÃO DE CORTE" + empresa nome/CNPJ + `Nº {id}` (alinhado à direita)
2. **Link** clicável: "Abrir requisição #ID" (link para a página no sistema)
3. **Box INFORMAÇÕES** (fundo cinza claro):
   - Linha 1: Status | Requisitante | Data de Criação
   - Linha 2: Total Itens | Quantidade Total | Entregue por
4. **Box ITENS DE CORTE** → tabela autoTable com colunas: Cód. Produto, Ordem, Artigo, Cor, Desenho, Quantidade
5. **Box OBSERVAÇÕES** (se houver): texto quebrado em múltiplas linhas, com altura mínima de 20px
6. **Rodapé**: nome da requisição + número da página
7. **Nome do arquivo**: `requisicao-corte-{id}.pdf`

### Tratamento de quantidade

A quantidade é armazenada como string (ex: `"2 M"`, `"150"`, `"1.5 kg"`). No PDF, o cálculo do total faz:
```typescript
parseFloat(item.quantidade.replace(/[^0-9.,]/g, "").replace(",", "."))
```

Isso extrai o valor numérico ignorando unidades e caracteres não numéricos.

---

## Notificações

### Eventos

| Evento | Gatilho | Mensagem |
|--------|---------|----------|
| `REQUISICAO_CORTE` | Criação | `"Nova requisição de corte #{id} criada por {nome} — {n} item(ns)"` |
| `REQUISICAO_CORTE_STATUS` | Mudança de status | `"Requisição de corte #{id} alterada para {status} por {nome} — {comentário}"` |
| Deleção | Exclusão | Notificação genérica via `notificarDelecao()` |

As notificações usam a engine genérica `src/lib/notificar.ts` que consulta `notificacao_regras` para determinar quais roles recebem, cria registros em `notificacoes` e opcionalmente envia email.

---

## Regras de Negócio

1. **Criação**: sempre com status `SOLICITADO` e `requisitanteId` = usuário autenticado
2. **Itens**: ao menos 1 item com `quantidade` preenchida (validado tanto no client quanto no servidor via Zod)
3. **Atualização de itens**: substituição completa (DELETE + INSERT) — todo o array de itens é recriado
4. **Exclusão**: permitida apenas para roles `COMERCIAL`, `ADMIN`, `SUDO` ou o próprio requisitante
5. **Quantidade como string**: armazenada como `VARCHAR` para suportar unidades textuais (ex: `"2 M"`, `"150 metros"`)
6. **Cálculo de total (dashboard)**: a quantidade é parseada removendo caracteres não numéricos via `REGEXP_REPLACE` no PostgreSQL
7. **PDF individual vs consolidado**: "PDF (N)" gera N arquivos separados; "Consolidado (N)" gera 1 arquivo com N páginas
8. **Status configurável**: a página de detalhe carrega opções do admin via `GET /api/admin/status?tipo=REQUISICAO_CORTE`, mas a API de status (`PATCH`) valida apenas contra os 3 status fixos
9. **Dashboard**: cards clicáveis abrem modal com lista filtrada; gráfico de pizza mostra distribuição; gráfico de linha mostra tendência dos últimos 6 meses
