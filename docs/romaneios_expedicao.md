# Romaneios de Expedição — Documentação

## Arquitetura Geral

A página `/documentos/romaneios` (componente em `src/app/(dashboard)/documentos/romaneios/page.tsx`) **não lê do banco local**. Ela busca dados **ao vivo** de uma API externa através do sistema de integrações.

### Fluxo dos dados

1. **On mount** → `GET /api/integracao/listar?tela=romaneios`
   - Retorna integrações ativas com `telas` contendo `"romaneios"`
   - Resposta: `[{ id, nome, baseUrl, tipoAuth, telas }]`
2. **Usuário clica "Carregar Todos"** → `GET /api/integracao/{id}/executar`
   - O backend carrega a integração do banco, monta headers de autenticação conforme `tipoAuth` e faz um `GET` no `baseUrl` da integração com timeout de 15s
   - Resposta: `{ success, status, responseBody, time, request, requestHeaders }`
3. **Client-side** extrai `responseBody`:
   - `body?.items || (Array.isArray(body) ? body : body?.data || [])`
4. **Client-side** agrupa o array flat de `Rolo` pelo campo `romaneio` em `GrupoRomaneio[]`
5. **Exibição**: cada grupo vira um card com cabeçalho (dados do cliente + totais) e tabela expandível de rolos

---

## Interface `Rolo` — Campos retornados pela API externa

A API externa deve retornar um array de objetos planos (cada objeto = um rolo). Cada rolo repete os dados do cliente/pedido/romaneio (a "capa" é inferida do primeiro rolo do grupo).

| # | Campo | Tipo | Obrigatório | Descrição | Uso |
|---|-------|------|-------------|-----------|-----|
| 1 | `romaneio` | `number` | Sim | Número do romaneio de expedição | Chave de agrupamento. Identificador único do manifesto |
| 2 | `codigo_rolo` | `number` | Sim | Código/número sequencial do rolo | Identificador individual do rolo na tabela |
| 3 | `produto` | `string` | — | Nome/código do produto têxtil | Agrupamento secundário: rolos são agrupados por produto |
| 4 | `narrativa` | `string` | — | Descrição/narrativa do produto | Exibido na tabela (truncado em 200px) |
| 5 | `lote` | `number` | — | Número do lote de produção | Dados do rolo (não usado para agrupamento) |
| 6 | `lote_produto` | `string` | — | Identificação do lote do produto | Agrupamento terciário: rolos são agrupados por lote dentro de cada produto |
| 7 | `quantidade` | `number` | — | Metragem do rolo em metros | Usado no somatório de metragem total do grupo. Formatado com 1 casa decimal |
| 8 | `peso_bruto` | `number` | — | Peso bruto do rolo em kg | Usado no somatório de peso bruto total. Formatado com 4 casas decimais |
| 9 | `peso_liquido` | `number` | — | Peso líquido do rolo em kg | Usado no somatório de peso líquido total. Formatado com 4 casas decimais |
| 10 | `data_entrada` | `string` | — | Data de entrada do rolo no estoque | Exibido no PDF (não usado na tabela da tela) |
| 11 | `op` | `number` | — | Número da Ordem de Produção | Dados do rolo (não exibido na UI principal) |
| 12 | `nome_operador` | `string` | — | Nome do operador que produziu | Dados do rolo (não exibido na UI principal) |
| 13 | `largura` | `number` | — | Largura do tecido em metros | Exibido na coluna "Largura" da tabela. Formatado com 1 casa decimal |
| 14 | `gramatura` | `number` | — | Gramatura do tecido (g/m²) | Disponível para PDF futuro (não exibido atualmente) |
| 15 | `endereco_rolo` | `string \| null` | — | Endereço de armazenagem no depósito | Exibido na coluna "Endereço" da tabela |
| 16 | `pedido` | `number` | — | Número do pedido de venda | Exibido no card do grupo. Usado no filtro de busca |
| 17 | `situacao` | `string` | — | Situação/status do romaneio | Dados do romaneio (não exibido na UI principal) |
| 18 | `emissao` | `string` | — | Data de emissão do romaneio | Exibido no PDF na seção "PEDIDO" |
| 19 | `entrega` | `string` | — | Data prevista de entrega | Exibido no PDF na seção "PEDIDO" |
| 20 | `chegada` | `string \| null` | — | Data de chegada/efetivação | Exibido no PDF |
| 21 | `cnpj` | `string` | — | CNPJ do cliente | Exibido no card do grupo e no PDF |
| 22 | `nome_cliente` | `string` | — | Razão social / Nome do cliente | Exibido como título no card do grupo e no PDF |
| 23 | `fantasia` | `string` | — | Nome fantasia do cliente | Exibido no PDF |
| 24 | `cidade` | `string` | — | Cidade do cliente | Exibido no card do grupo e no PDF |
| 25 | `uf` | `string` | — | UF do cliente | Exibido no card do grupo e no PDF |
| 26 | `nome_represenante` | `string` | — | Nome do representante comercial | Exibido no card do grupo e no PDF |
| 27 | `nome_regiao` | `string` | — | Nome da região de vendas | Exibido no PDF ao lado do representante |
| 28 | `linha` | `string` | — | Linha de produto | Dados do romaneio (não exibido na UI principal) |
| 29 | `grupo` | `string` | — | Grupo de produto | Dados do romaneio (não exibido na UI principal) |
| 30 | `sub` | `string` | — | Subgrupo de produto | Dados do romaneio (não exibido na UI principal) |
| 31 | `cor` | `string` | — | Cor do produto | Disponível para exibição futura |
| 32 | `vendido` | `number` | — | Quantidade vendida do rolo | Dados do rolo |
| 33 | `saldo` | `number` | — | Saldo restante do rolo | Dados do rolo |
| 34 | `unitario` | `number` | — | Valor unitário | Dados do rolo |
| 35 | `valor_vendido` | `number` | — | Valor total vendido do rolo | Dados do rolo |

### Observações sobre os campos

- **Campos obrigatórios para o funcionamento**: `romaneio` (agrupamento) e `codigo_rolo` (identificação). Os demais podem vir vazios que a UI trata com fallback `—`
- **Campos quebrados na API (typo)**: `nome_represenante` tem erro de digitação no código ("representante" sem o segundo 'e'). O campo `nome_representante` no banco corrige a grafia. A integração precisa enviar exatamente como `nome_represenante` ou o mapping deve ajustar
- **Campos de data**: São strings ISO e convertidas via `new Date(data).toLocaleDateString("pt-BR")` para exibição. Se inválidas, fallback para o valor cru

---

## Interface `GrupoRomaneio` — Agrupamento client-side

```typescript
interface GrupoRomaneio {
  romaneio: number
  capa: Rolo            // primeiro rolo do grupo (usado como cabeçalho)
  rolos: Rolo[]         // todos os rolos do grupo
  totalRolos: number    // rolos.length
  totalMetragem: number // soma de quantidade de todos os rolos
  totalPesoBruto: number// soma de peso_bruto de todos os rolos
  totalPesoLiquido: number // soma de peso_liquido de todos os rolos
}
```

### Regras de agrupamento

1. **Grupo principal**: rolos são agrupados pelo campo `romaneio` (Map `<number, GrupoRomaneio>`)
2. **Ordenação**: grupos ordenados por `romaneio` decrescente (mais recente primeiro)
3. **Capa**: o primeiro rolo encontrado na iteração vira a `capa` (cabeçalho). Todos os rolos do mesmo grupo devem ter os mesmos dados de cliente/pedido
4. **Dentro de cada grupo**, rolos são agrupados em:
   - **Produto** (`rolo.produto` ou `"SEM PRODUTO"`) → ordenado alfabeticamente
   - **Lote** (`rolo.lote_produto` ou `"SEM LOTE"`) → ordenado alfabeticamente dentro do produto
5. Subtotais calculados por lote, totais por produto, total geral do grupo

---

## Comportamento da Busca

- **"Carregar Todos"**: Limpa o filtro (`searchTerm = ""`) e chama `buscar()` sem parâmetro → executa a integração, carrega todos os dados da API
- **"Buscar"**: Faz **filtragem client-side** exclusivamente — NÃO chama a API novamente
  - Filtra o array `itens` (já carregado) comparando `String(item.pedido).includes(termo)` OU `String(item.romaneio).includes(termo)`
- **"Limpar Filtro"**: Volta a exibir todos os itens previamente carregados

> ⚠️ A busca NÃO consulta a API externa nem o banco local. Apenas filtra o que já está em memória.

---

## Geração de PDF

Usa **jsPDF** + **jspdf-autotable** (importados dinâmicos no client).

### Três modos

| Modo | Função | Descrição |
|------|--------|-----------|
| **PDF individual** | `gerarPdf(numero)` | Gera um PDF para um romaneio específico |
| **PDF consolidado** | `gerarPdfConsolidado()` | Todos os romaneios selecionados em um único PDF (um por página) |
| **PDFs separados** | `gerarPdfsSelecionados()` | Um arquivo PDF por romaneio selecionado (chama `gerarPdf` em loop) |

### Estrutura do PDF (cada página = um romaneio)

1. **Header** (barra azul) — logo + nome + CNPJ + endereço da empresa (via `GET /api/admin/config/empresa`)
2. **Título** "Romaneio Nº X"
3. **Box "Capa"** (arredondado, fundo cinza claro):
   - CLIENTE: nome, CNPJ, cidade/UF, fantasia
   - REPRESENTANTE: nome, região
   - TOTAIS: total de rolos, metragem, peso bruto, peso líquido
4. **Box "PEDIDO"**: número, emissão, entrega
5. **Tabela de rolos** (autoTable):
   - Agrupada por PRODUTO (roxo) → LOTE (azul) → rolos individuais
   - Colunas: `#`, `Cód. Rolo`, `Produto`, `Narrativa`, `Lote`, `Metragem`, `P. Bruto`, `P. Líquido`, `Largura`, `Endereço`
   - Subtotais por lote, subtotais por produto, total geral
6. **Rodapé**: número do romaneio e página a cada página

### Orientação

- **Retrato** (portrait) ou **Paisagem** (landscape), selecionável por toggle na UI
- Ajustes de layout (fontes, margens, espaçamentos) adaptados conforme orientação

---

## Banco de Dados (não usado na consulta atual)

Existem duas tabelas definidas via Drizzle em `src/lib/db/schema/romaneios.ts` (migração `0013_romaneios.sql`), porém **a página de romaneios NÃO lê dessas tabelas**. Elas foram criadas para suporte futuro de importação.

### `romaneios` (cabeçalho)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `SERIAL PK` | ID interno |
| `romaneio` | `INTEGER UNIQUE` | Número do romaneio (chave natural) |
| `pedido` | `INTEGER` | Número do pedido |
| `cnpj` | `VARCHAR(18)` | CNPJ do cliente |
| `nome_cliente` | `VARCHAR(200)` | Nome do cliente |
| `fantasia` | `VARCHAR(200)` | Nome fantasia |
| `cidade` | `VARCHAR(100)` | Cidade |
| `uf` | `VARCHAR(2)` | UF |
| `nome_representante` | `VARCHAR(200)` | Representante |
| `nome_regiao` | `VARCHAR(100)` | Região |
| `situacao` | `VARCHAR(30)` | Situação |
| `emissao` | `TIMESTAMP` | Data de emissão |
| `entrega` | `TIMESTAMP` | Data de entrega |
| `chegada` | `TIMESTAMP` | Data de chegada |
| `periodo` | `INTEGER` | Período |
| `linha` | `VARCHAR(100)` | Linha |
| `grupo` | `VARCHAR(100)` | Grupo |
| `sub` | `VARCHAR(100)` | Subgrupo |
| `total_pecas` | `INTEGER DEFAULT 0` | Total de peças/rolos |
| `total_metragem` | `NUMERIC(12,2)` | Total em metros |
| `total_peso_bruto` | `NUMERIC(12,4)` | Total peso bruto |
| `total_peso_liquido` | `NUMERIC(12,4)` | Total peso líquido |
| `id_integracao` | `VARCHAR(100)` | ID da integração origem |
| `created_at` / `updated_at` | `TIMESTAMP` | Controle |

### `romaneio_pecas` (itens/rolos)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `SERIAL PK` | ID interno |
| `romaneio_id` | `INTEGER FK → romaneios(id) CASCADE` | Vínculo com o cabeçalho |
| `codigo_rolo` | `INTEGER NOT NULL` | Código do rolo |
| `produto` | `VARCHAR(100)` | Nome do produto |
| `narrativa` | `TEXT` | Descrição |
| `lote` | `INTEGER` | Número do lote |
| `lote_produto` | `VARCHAR(50)` | Lote do produto |
| `quantidade` | `NUMERIC(12,2)` | Metragem |
| `peso_bruto` | `NUMERIC(12,4)` | Peso bruto |
| `peso_líquido` | `NUMERIC(12,4)` | Peso líquido |
| `data_entrada` | `TIMESTAMP` | Data de entrada |
| `op` | `INTEGER` | Ordem de produção |
| `nome_operador` | `VARCHAR(100)` | Operador |
| `largura` | `NUMERIC(8,2)` | Largura em metros |
| `gramatura` | `NUMERIC(8,2)` | Gramatura g/m² |
| `endereco_rolo` | `VARCHAR(50)` | Endereço no depósito |
| `nuance` | `VARCHAR(50)` | Nuance |
| `qualidade` | `INTEGER` | Qualidade |
| `pontuacao` | `NUMERIC(8,2)` | Pontuação |
| `cor` | `VARCHAR(100)` | Cor |
| `vendido` | `NUMERIC(12,2)` | Quantidade vendida |
| `saldo` | `NUMERIC(12,2)` | Saldo |
| `unitario` | `NUMERIC(12,4)` | Valor unitário |
| `valor_vendido` | `NUMERIC(12,2)` | Valor total vendido |
| `created_at` | `TIMESTAMP` | Controle |

---

## Integration API (`/api/integracao/{id}/executar`)

### Método
`GET`

### Autenticação
Protegida por next-auth — requer sessão ativa.

### Funcionamento

1. Carrega o registro da integração do banco (`integracoes` table)
2. Conforme `tipoAuth`, monta os headers de autorização:
   - **`bearer`**: `Authorization: Bearer {token}`
   - **`basic`**: `Authorization: Basic {base64(username:password)}`
   - **`api_key`**: header ou query param conforme config (`key_name`, `in`)
   - **`oauth2`**: primeiro obtém token via `client_credentials` no `token_url`, depois usa Bearer
3. Faz `GET` na `baseUrl` + query params (exceto `tela`) com timeout de **15 segundos**
4. Retorna metadados da requisição (URL, headers mascarados) e resposta

### Resposta da API

```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "time": 1234,
  "responseBody": { "items": [ ... ] },
  "request": { "url": "...", "method": "GET" },
  "requestHeaders": { "Authorization": "Bearer xxxx****abc123" }
}
```

### Extração dos itens (client-side)

```typescript
const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
```

Ordem de precedência:
1. `body.items` (array)
2. `body` diretamente se for array
3. `body.data` (array)

---

## Admin — Configuração de Integração (`/admin/configuracoes/integracoes`)

### Campos mapeáveis para a tela `romaneios`

Os campos disponíveis para mapeamento estão definidos em `PDM_CAMPOS_POR_TELA.romaneios` no arquivo `src/app/(dashboard)/admin/configuracoes/integracoes/page.tsx:57-99`.

| Label | Campo PDM | Tipo Esperado |
|-------|-----------|---------------|
| Romaneio | `romaneio` | number |
| Pedido | `pedido` | number |
| CNPJ | `cnpj` | string |
| Nome Cliente | `nomeCliente` | string |
| Fantasia | `fantasia` | string |
| Cidade | `cidade` | string |
| UF | `uf` | string |
| Representante | `nomeRepresentante` | string |
| Região | `nomeRegiao` | string |
| Situação | `situacao` | string |
| Emissão | `emissao` | string (data) |
| Entrega | `entrega` | string (data) |
| Chegada | `chegada` | string (data) |
| Período | `periodo` | number |
| Linha | `linha` | string |
| Grupo | `grupo` | string |
| Sub | `sub` | string |
| Cód. Rolo | `codigoRolo` | number |
| Produto | `produto` | string |
| Narrativa | `narrativa` | string |
| Lote | `lote` | number |
| Lote Produto | `loteProduto` | string |
| Quantidade (m) | `quantidade` | number |
| Peso Bruto | `pesoBruto` | number |
| Peso Líquido | `pesoLiquido` | number |
| Data Entrada | `dataEntrada` | string (data) |
| OP | `op` | number |
| Operador | `nomeOperador` | string |
| Largura | `largura` | number |
| Gramatura | `gramatura` | number |
| Endereço Rolo | `enderecoRolo` | string |
| Nuance | `nuance` | string |
| Qualidade | `qualidade` | number |
| Pontuação | `pontuacao` | number |
| Cor | `cor` | string |
| Vendido | `vendido` | number |
| Saldo | `saldo` | number |
| Unitário | `unitario` | number |
| Valor Vendido | `valorVendido` | number |
| ID Integração | `idIntegracao` | string |

> ⚠️ O mapping é **bidirecional**: o admin configura qual campo da API (ex: `ROMANEIO`) mapeia para qual campo PDM (ex: `romaneio`). O campo PDM usa **camelCase** (ex: `nomeCliente`) enquanto as colunas do banco usam **snake_case** (ex: `nome_cliente`).

---

## Regras de negócio documentadas

1. **Agrupamento primário**: campo `romaneio`. Todos os rolos com mesmo `romaneio` formam um grupo
2. **Capa**: primeiro rolo do grupo vira cabeçalho; dados de cliente/pedido devem ser consistentes entre todos os rolos do mesmo grupo
3. **Agrupamento secundário (tabela)**: `produto` → `lote_produto`, ambos ordenados alfabeticamente
4. **Filtro de busca**: exclusivamente client-side, sobre dados já carregados; filtra por `pedido` ou `romaneio`
5. **"Carregar Todos" sempre chama a API** (nunca usa cache)
6. **Dados NÃO são persistidos** — sempre obtidos ao vivo da integração (as tabelas `romaneios` e `romaneio_pecas` existem no banco mas não são usadas na página atual)
7. **Seleção de PDF**: permite selecionar múltiplos romaneios via checkbox para gerar PDF consolidado ou PDFs individuais
8. **Formatação**:
   - Metragem: 1 casa decimal, sufixo " m"
   - Peso: 4 casas decimais, sufixo " kg"
   - Data: locale `pt-BR`
   - Fallback para valores nulos: `"—"`
