---
name: pdm-bling-api
description: Integração com a API v3 do ERP Bling. Use ao criar, modificar ou depurar integrações com o Bling — OAuth2, pedidos, notas fiscais, produtos, contatos, financeiro, logística, webhooks e autenticação JWT.
---

# PDM — Skill: API Bling ERP

Guia completo para trabalhar com integrações do PDM Pro Têxtil com o ERP Bling.

## 1. Documentação de Referência

| Documento | Caminho | O que é |
|---|---|---|
| **API Bling** | `docs/api-bling.md` | Documentação completa: OAuth2, todos os endpoints, paginação, erros, limites, homologação |

**Sempre consulte o documento antes de criar uma nova integração.**

## 2. Arquitetura

```
PDM (Next.js) → API Route → Bling API v3 (https://api.bling.com.br/Api/v3)
                              ↑
                    OAuth 2.0 Authorization Code
                    (client_id + client_secret via Basic Auth header)
```

### O que o Bling oferece

- Pedidos de venda/compra
- Notas fiscais (NFe, NFCe, NFSe)
- Produtos, contatos (clientes/fornecedores)
- Financeiro (contas a pagar/receber, borderôs)
- Estoque, logística, etiquetas
- Ordens de produção
- Propostas comerciais

## 3. Autenticação — Cuidados Críticos

### Fluxo OAuth 2.0 (Authorization Code)

```
1. Redirecionar usuário para:
   https://www.bling.com.br/Api/v3/authorize?
     response_type=code&
     client_id={CLIENT_ID}&
     redirect_uri={REDIRECT_URI}&
     state={CSRF_TOKEN}

2. Usuário autoriza → callback com ?code={AUTH_CODE}&state={CSRF_TOKEN}
   (auth code expira em 1 MINUTO)

3. Trocar code por tokens (server-side):
   POST https://www.bling.com.br/Api/v3/oauth/token
   Authorization: Basic Base64(client_id:client_secret)  ← HEADERS, não body!
   Content-Type: application/x-www-form-urlencoded
   enable-jwt: 1                                          ← OBRIGATÓRIO para JWT
   grant_type=authorization_code&code={AUTH_CODE}&redirect_uri={URI}

4. Usar o token:
   GET https://api.bling.com.br/Api/v3/produtos
   Authorization: Bearer {ACCESS_TOKEN}
   enable-jwt: 1
```

### JWT vs Token Opaco

- **JWT é o padrão atual** — tokens opacos estão descontinuados
- JWTs têm ~1500-3000 caracteres (prepared para isso)
- Header `enable-jwt: 1` deve estar em **TODAS** as requisições: obtenção, renovação e uso
- Renovação: `POST /oauth/token` com `grant_type=refresh_token` (validade 30 dias)

### ERROS COMUNS (NÃO FAÇA)

| ❌ Errado | ✅ Correto |
|---|---|
| `client_secret` no body da requisição de token | `Authorization: Basic` header |
| Token no frontend/browser | Token sempre server-side |
| Sem header `enable-jwt: 1` | Incluir em todas as requisições |
| Novo token a cada request | Guardar e reutilizar; usar refresh_token |

## 4. Endpoints Principais

### Base URL
```
https://api.bling.com.br/Api/v3
```

### Cadastros mais usados

| Endpoint | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| `/contatos` | Listar | Criar | — | — |
| `/contatos/{id}` | Ver | — | Atualizar | Excluir |
| `/produtos` | Listar | Criar | — | — |
| `/produtos/{id}` | Ver | — | Atualizar | Excluir |
| `/pedidos/vendas` | Listar | Criar | — | — |
| `/pedidos/vendas/{id}` | Ver | — | Atualizar | Excluir |
| `/nfe` | Listar | Criar | — | — |
| `/nfe/{id}` | Ver | — | — | Excluir |
| `/contas-receber` | Listar | Criar | — | — |
| `/contas-pagar` | Listar | Criar | — | — |

### Paginação

```
GET /produtos?pagina=1&limite=100
```
- `pagina`: começa em 1
- `limite`: padrão 100, máx 100

### Filtros por período

```
GET /nfe?dataInicial=2026-01-01&dataFinal=2026-12-31
```
- Intervalo máximo: **1 ano** (senão retorna 400)

## 5. Limites

| Regra | Limite |
|---|---|
| Requests/segundo | **3** |
| Requests/dia | **120.000** |
| `/oauth/token` em 60s | **20** |
| Bloqueio IP por erros | 300 em 10s → 10 min |

**Estratégia**: implementar retry com backoff exponencial; fila de requests com rate limiter.

## 6. Erros

| HTTP | Tipo | Significado |
|---|---|---|
| 400 | VALIDATION_ERROR | Dados inválidos |
| 401 | UNAUTHORIZED | Token inválido/expirado → usar refresh_token |
| 403 | FORBIDDEN | Escopo não autorizado |
| 404 | RESOURCE_NOT_FOUND | Recurso não existe |
| 429 | TOO_MANY_REQUESTS | Rate limit → aguardar e retry |
| 500 | SERVER_ERROR | Erro interno Bling |

## 7. Padrões do PDM

### Variáveis de ambiente necessárias

```env
BLING_CLIENT_ID=
BLING_CLIENT_SECRET=
BLING_REDIRECT_URI=
BLING_ACCESS_TOKEN=          # Persistido após OAuth
BLING_REFRESH_TOKEN=         # Persistido para renovação
```

### Estrutura de uma API route de integração Bling

```typescript
// 1. Verificar/renovar token
// 2. Fazer request com Bearer token + enable-jwt: 1
// 3. Tratar erros (401 → refresh, 429 → retry)
// 4. Retornar dados ao frontend
```

### Headers obrigatórios em TODA request

```
Authorization: Bearer {ACCESS_TOKEN}
enable-jwt: 1
Content-Type: application/json
```

## 8. Checklist de Integração

- [ ] Aplicativo registrado no Bling (client_id + client_secret)
- [ ] Fluxo OAuth implementado (server-side)
- [ ] Token persistido (access + refresh)
- [ ] Refresh automático no 401
- [ ] Rate limiting (3 req/s, 120k/dia)
- [ ] Retry com backoff no 429
- [ ] Headers `enable-jwt: 1` em todas as requisições
- [ ] Credenciais nunca no frontend
- [ ] Testado com conta Bling Cobalto

---

*Skill criada em Ago/2026. Documentação base: docs/api-bling.md*
