---
name: pdm-systextil-api
description: Integração com a API do ERP Systêxtil (IPLM + Full). Use ao criar, modificar ou depurar integrações com o Systêxtil — imports de dados, consultas, proxy de API, autenticação OAuth2, mapeamento de campos, novos endpoints, webhooks e CRUD via API.
---

# PDM — Skill: API Systêxtil

Guia completo para trabalhar com a integração do PDM Pro Têxtil com o ERP Systêxtil.

## 1. Duas APIs, Dois Documentos

O PDM documenta a API Systêxtil em dois arquivos:

| Documento | Caminho | O que é |
|---|---|---|
| **API IPLM** (existente) | `docs/api-systextil-iplm.md` | A integração atual do PDM: proxy, OAuth2, endpoints usados, `idIntegracao`, modal de importação |
| **API Full** (nova) | `docs/api-systextil-full.md` | Referência completa dos ~85+ endpoints do site oficial (https://ajuda.systextil.com.br/api) |

**Sempre consulte ambos antes de criar uma nova integração.**

## 2. Arquitetura da Integração

```
PDM UI → ImportarApiModal → /api/integracao/{id}/executar → Proxy (route.ts) → Systêxtil API Cloud
                                                              ↓
                                                    Tabela `integracoes` (DB)
                                                    (baseUrl, authConfig, mapping)
```

### Fluxo de uma importação:

1. UI abre `ImportarApiModal` com `idIntegracao` da tela
2. Modal chama `GET /api/integracao/{id}/executar?tela={tela}`
3. Proxy busca config no DB, obtém token OAuth2, faz GET na URL externa
4. Retorna dados ao modal
5. Usuário seleciona linhas → modal chama `POST /api/integracao/importar`
6. Importador aplica mapping, dedup (por `idIntegracao`), e insere no PDM

## 3. Autenticação — Cuidados Críticos

### OAuth2 (método principal)

```
POST token_url
Authorization: Basic Base64(client_id:client_secret)   ← HEADERS, não body!
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=PRD
```

**ERRO COMUM:** Enviar `client_id` e `client_secret` no body do POST. O Systêxtil exige via **Basic Auth header**.

### Token URL (Oracle Cloud IDCS)

```
https://idcs-03651be63851489595548b9127721fa1.identity.oraclecloud.com/oauth2/v1/token
```

### Scopes

| Scope | Ambiente |
|---|---|
| `QAS` | QA |
| `PRD` | Produção |
| `C0405:QA` | QA (variante) |
| `C0405:PRD` | PRD (variante) |

### Base URLs

| Ambiente | Padrão |
|---|---|
| QA | `https://qa-api-{customerid}.systextilapps.com.br/` |
| Produção | `https://api-{customerid}.systextilapps.com.br/` |

## 4. Arquivos Chave no Código

### Proxy (onde a mágica acontece)

| Arquivo | Função |
|---|---|
| `src/app/api/integracao/[id]/executar/route.ts` | Proxy GET — adiciona auth, encaminha para API externa |
| `src/app/api/admin/integracoes/[id]/testar/route.ts` | Teste admin com debug |
| `src/app/api/integracao/listar/route.ts` | Lista integrações ativas por tela |
| `src/app/api/integracao/importar/route.ts` | Importação genérica (mapping + dedup) |

### Schema e DB

| Arquivo | Função |
|---|---|
| `src/lib/db/schema/integracoes.ts` | Schema Drizzle da tabela `integracoes` |
| `src/lib/db/schema/*.ts` | Todos os schemas têm campo `idIntegracao` |

### UI

| Arquivo | Função |
|---|---|
| `src/components/integracao/ImportarApiModal.tsx` | Modal de importação genérica |
| `src/app/(dashboard)/admin/configuracoes/integracoes/page.tsx` | CRUD de integrações |

## 5. Tabelas com `idIntegracao`

Virtually toda tabela de entidade do PDM tem `idIntegracao` (varchar 100) para vincular com o Systêxtil:

- `clientes`, `fornecedores`, `representantes`
- `fios`, `tipos_fio`, `acabamentos_fio`, `processos_fio`
- `bases_urdume`, `cores`, `cores_solidas`, `estampas`
- `produtos_quimicos`, `produto_cru` (+ `idIntegracaoErpCru`)
- `usuarios`, `maqoper`, `solicitacoes`, `anexos`
- `acabamentos`, `romaneios`, `crm_pessoas`, `crm_leads`
- `requisicoes_amostra_comercial`

## 6. Endpoints Mais Usados no PDM

| Entidade | Endpoint Systêxtil | Uso |
|---|---|---|
| Cliente | `/pessoa/v1/cliente` | Importação de cadastros |
| Fornecedor | `/pessoa/v1/fornecedor` | Importação de cadastros |
| Representante | `/pessoa/v1/representante` | Importação de representantes |
| Produto | `/material/v1/produto` | Referência de produtos |
| Romaneios | Customizado via proxy | Expedição — rolos agrupados |

## 7. Como Adicionar uma Nova Integração

1. **Documentar:** Identificar o endpoint no `docs/api-systextil-full.md`
2. **Cadastrar integração:** Admin > Configurações > Integrações > Nova
   - `baseUrl`: `https://api-{customerid}.systextilapps.com.br/`
   - `tipoAuth`: `oauth2`
   - `authConfig`: `{ token_url, client_id, client_secret, scope }`
   - `telas`: array de nomes de tela
   - `mapping`: mapeamento de campos da API → campos do PDM
3. **Testar:** Botão "Testar" na integração
4. **UI (se aplicável):** Adicionar `ImportarApiModal` na página com `idIntegracao` da integração
5. **Importador:** Se o endpoint não for genérico, criar handler em `/api/integracao/importar` ou rota específica

## 8. Mapping de Campos

O campo `mapping` na tabela `integracoes` define como os campos da API Systêxtil se mapeiam para os campos do PDM:

```json
{
  "codigo_cliente": "idIntegracao",
  "razao_social": "nome",
  "cnpj_cpf": "cnpj",
  "nome_fantasia": "nomeFantasia"
}
```

## 9. IDs de Integração no DB

Ao criar uma migration que adicione `idIntegracao` em tabela nova, lembrar de:

1. Adicionar coluna `idIntegracao varchar(100)` no schema Drizzle
2. Rodar migration nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon)
3. Adicionar `idIntegracaoSchema` na validação Zod

## 10. Referências Externas

| Recurso | URL |
|---|---|
| Documentação oficial | https://ajuda.systextil.com.br/api |
| Índice completo (llms.txt) | https://ajuda.systextil.com.br/llms.txt |
| Doc IPLM do PDM | `docs/api-systextil-iplm.md` |
| Doc Full do PDM | `docs/api-systextil-full.md` |
| API legada (systextil/) | `systextil/api_doc.md` |
| Learning base | `.agent/skills/learning.md` (Seção 45) |

## 11. Troubleshooting

| Problema | Causa provável | Solução |
|---|---|---|
| 401 Unauthorized | Token OAuth2 inválido ou expirado | Verificar `authConfig` na tabela `integracoes` |
| 401 no token | Credenciais no body em vez de Basic Auth | Mover `client_id`/`client_secret` para header Basic Auth |
| Timeout | API externa lenta ou DOWN | Proxy tem timeout de 15s; verificar status da API Systêxtil |
| Dados não aparecem | Mapping incorreto | Verificar campo `mapping` na integração |
| `idIntegracao` vazio | Integração não configurada para a tela | Verificar campo `telas` na integração |
| 413 Entity Too Large | Resposta da API muito grande | Usar paginação (`limit`/`offset`) ou filtros (`q`) |
