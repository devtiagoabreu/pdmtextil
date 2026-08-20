# API Systêxtil IPLM — Documentação da Integração Existente

> Documentação completa da integração do PDM Pro Têxtil com a API do ERP Systêxtil (IPLM).
> Esta API é consumida via proxy genérico de integração do PDM.

---

## Visão Geral

A integração com o Systêxtil ERP é feita através de um **módulo de integrações genérico** que permite conectar a qualquer API externa. As credenciais, URLs e endpoints são configurados no banco de dados (tabela `integracoes`), não no código.

### Arquitetura

```
PDM (Frontend) → /api/integracao/{id}/executar → Proxy (Next.js API Route) → Systêxtil API Cloud
```

### Componentes Principais

| Componente | Caminho | Função |
|---|---|---|
| Proxy de Execução | `src/app/api/integracao/[id]/executar/route.ts` | Proxy GET que adiciona auth e encaminha para a API externa |
| Proxy de Teste | `src/app/api/admin/integracoes/[id]/testar/route.ts` | Endpoint admin para testar conexões com debug |
| Listar Integrações | `src/app/api/integracao/listar/route.ts` | Lista integrações ativas, filtrável por tela |
| Importar Dados | `src/app/api/integracao/importar/route.ts` | Importação genérica com mapping e dedup |
| Importar Clientes (legado) | `src/app/api/cadastros/clientes/importar-api/route.ts` | Importação específica de clientes |
| CRUD Admin | `src/app/api/admin/integracoes/route.ts` | CRUD completo da tabela `integracoes` |
| Schema DB | `src/lib/db/schema/integracoes.ts` | Schema Drizzle da tabela `integracoes` |
| Modal de Importação | `src/components/integracao/ImportarApiModal.tsx` | Modal UI para importar dados de APIs externas |
| Página Admin | `src/app/(dashboard)/admin/configuracoes/integracoes/page.tsx` | CRUD visual de integrações |

---

## Base URLs

| Ambiente | URL |
|---|---|
| QA | `https://qa-api-{customerid}.systextilapps.com.br/` |
| Produção | `https://api-{customerid}.systextilapps.com.br/` |

Onde `{customerid}` é o identificador único do cliente no Systêxtil.

---

## Autenticação

### OAuth2 Client Credentials (Principal)

O Systêxtil usa OAuth2 via Oracle Cloud IDCS.

**Importante:** As credenciais devem ser enviadas via **Basic Auth header**, não no body do POST.

```
POST https://idcs-03651be63851489595548b9127721fa1.identity.oraclecloud.com/oauth2/v1/token
Authorization: Basic Base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope={scope}
```

**Scopes disponíveis:**
- `QAS` — acesso ao ambiente de QA
- `PRD` — acesso ao ambiente de Produção
- `C0405:QA` — token QA (variante)
- `C0405:PRD` — token PRD (variante)

**Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Uso posterior: `Authorization: Bearer {access_token}`

### APIKey (Alternativa)

Header: `APIKey: {sua_chave}`

### Configuração no Banco

As credenciais são armazenadas na tabela `integracoes`:

```json
{
  "tipoAuth": "oauth2",
  "authConfig": {
    "grant_type": "client_credentials",
    "client_id": "xxx",
    "client_secret": "xxx",
    "token_url": "https://idcs-...",
    "scope": "PRD"
  },
  "baseUrl": "https://api-{customerid}.systextilapps.com.br/"
}
```

---

## Como Chamar a API via PDM

### 1. Via Proxy de Execução (Recomendado para UI)

```
GET /api/integracao/{idIntegracao}/executar?tela={tela}
```

O proxy:
1. Busca a config da integração no banco
2. Obtém o token OAuth2 (ou usa APIKey)
3. Faz GET na URL configurada
4. Retorna a resposta com metadata

### 2. Via Modal de Importação (UI)

O componente `ImportarApiModal` é usado em 11 páginas do PDM para importar dados:

| Página | Entidade |
|---|---|
| Cadastros > Clientes | Clientes |
| Cadastros > Fornecedores | Fornecedores |
| Cadastros > Fios | Fios |
| Cadastros > Bases Urdume | Bases Urdume |
| Cadastros > Cores | Cores |
| Cadastros > Estampas | Estampas |
| Cadastros > Produtos Químicos | Produtos Químicos |
| Cadastros > Produto Cru | Produto Cru |
| Comercial > Clientes | Clientes (comercial) |
| Comercial > Representantes | Representantes |
| CRM > Pessoas | Pessoas (CRM) |

### 3. Exemplo: Romaneios de Expedição

```
GET /api/integracao/{id}/executar?tela=romaneios
```

Retorna array de `Rolo` com ~35 campos (romaneio, código_rolo, produto, lote, quantidade, peso, etc.)

---

## Entidades Integradas (Uso Atual no PDM)

A tabela a seguir lista as entidades que o PDM já importa ou consulta via a API Systêxtil:

| Entidade | Endpoint Systêxtil | Uso no PDM |
|---|---|---|
| Cliente | `/pessoa/v1/cliente` | Importação de cadastro de clientes |
| Fornecedor | `/pessoa/v1/fornecedor` | Importação de cadastro de fornecedores |
| Representante | `/pessoa/v1/representante` | Importação de representantes |
| Produto | `/material/v1/produto` | Referência de produtos |
| Funcionário | `/pessoa/v1/funcionario` | Dados de funcionários |
| Romaneios (via genérico) | Consulta customizada | Expedição — grouped rolos |

---

## Campo `idIntegracao`

Virtually todas as tabelas do PDM possuem o campo `idIntegracao` (varchar 100) para vincular registros do PDM com seus equivalentes no Systêxtil. Tabelas com este campo:

- `clientes`, `fornecedores`, `representantes`
- `fios` (e sub-tabelas: tipos_fio, acabamentos_fio, processos_fio)
- `bases_urdume`
- `cores` (e `cores_solidas`)
- `estampas`
- `produtos_quimicos`
- `produto_cru` (também `idIntegracaoErpCru` para segunda integração)
- `usuarios`
- `maqoper` (e sub-tabelas)
- `solicitacoes`
- `anexos`
- `acabamentos`
- `romaneios`
- `crm_pessoas`, `crm_leads`
- `requisicoes_amostra_comercial`

---

## Limitações e Cuidados

1. **Timeout:** O proxy usa timeout de 15 segundos
2. **Rate Limits:** A API Systêxtil pode ter rate limits (não documentados explicitamente)
3. **Sync vs Async:** A API suporta query `sync=true|false` para requisições síncronas/assíncronas
4. **OAuth2 Basic Auth:** As credenciais DEVEM ser enviadas via Basic Auth header, não no body (erro comum)
5. **Tokens Cache:** O proxy obtém um novo token a cada request (oportunidade de melhoria com cache)
6. **Documentação Oficial:** [https://ajuda.systextil.com.br/api](https://ajuda.systextil.com.br/api)

---

## Referências

- Documentação completa da API: `systextil/api_doc.md`
- Documentação de romaneios: `docs/romaneios_expedicao.md`
- Learning base: `.agent/skills/learning.md` (Seção 45: Módulo de Integrações)
- Site oficial: [https://ajuda.systextil.com.br/api](https://ajuda.systextil.com.br/api)
