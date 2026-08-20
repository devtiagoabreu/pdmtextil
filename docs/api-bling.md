# API Bling ERP — Documentação Completa

> Documentação da API v3 do Bling ERP para integração com o PDM Pro Têxtil.
> Portal do desenvolvedor: https://developer.bling.com.br

---

## Visão Geral

O Bling é um ERP brasileiro para emissão de notas fiscais, controle de estoque, pedidos de compra/venda, financeiro e gestão empresarial. Sua API pública permite integrações completas via padrão REST + OAuth 2.0.

| Info | Valor |
|---|---|
| Versão atual | v3 (a partir de v3.10) |
| Base URL | `https://api.bling.com.br/Api/v3` |
| Formato | REST, JSON |
| Auth | OAuth 2.0 (Authorization Code) |
| Plano mínimo | Cobalto |
| Documentação oficial | https://developer.bling.com.br |
| Portal de ajuda | https://ajuda.bling.com.br/hc/pt-br/articles/360040637674 |

---

## Autenticação — OAuth 2.0

### Fluxo Authorization Code

O Bling usa **apenas** o fluxo Authorization Code (não suporta Client Credentials, Password, nem Implicit).

#### Passo 1: Registrar aplicativo

1. Acesse https://developer.bling.com.br/aplicativos
2. Clique em "Criar aplicativo"
3. Escolha visibilidade (Público ou Privado)
4. Preencha: logo, nome, categoria, descrição, link de redirecionamento
5. Adicione os escopos necessários
6. Salve — anote o **Client ID** e **Client Secret**

#### Passo 2: Obter authorization code

Redirecione o usuário para:

```
https://www.bling.com.br/Api/v3/authorize?
  response_type=code&
  client_id={CLIENT_ID}&
  redirect_uri={REDIRECT_URI}&
  state={CSRF_TOKEN}
```

O usuário autoriza → Bling redireciona para `redirect_uri` com:
```
?code={AUTHORIZATION_CODE}&state={CSRF_TOKEN}
```

> O `authorization_code` expira em **1 minuto**. Use-o imediatamente.

#### Passo 3: Trocar code por tokens

```bash
POST https://www.bling.com.br/Api/v3/oauth/token
Authorization: Basic Base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={AUTHORIZATION_CODE}&
redirect_uri={REDIRECT_URI}
```

**Header JWT** (recomendado — tokens opacos estão descontinuados):
```
enable-jwt: 1
```

Resposta:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "cohorts-eaw",
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

| Campo | Descrição |
|---|---|
| `access_token` | Token JWT (~1500-3000 chars). Use em todas as requisições |
| `expires_in` | Validade em segundos (3600 = 1h) |
| `refresh_token` | Para renovar. Validade: **30 dias** |
| `scope` | Escopos autorizados |

#### Passo 4: Usar o token

```
GET https://api.bling.com.br/Api/v3/produtos
Authorization: Bearer {ACCESS_TOKEN}
enable-jwt: 1
```

#### Passo 5: Renovar token (refresh)

```bash
POST https://www.bling.com.br/Api/v3/oauth/token
Authorization: Basic Base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded
enable-jwt: 1

grant_type=refresh_token&
refresh_token={REFRESH_TOKEN}
```

### Cuidados importantes

- **Credenciais** devem ir no header `Authorization: Basic`, **nunca** no body
- A requisição de token deve ser **server-to-server** (nunca no browser)
- Cada `authorization_code` só pode ser usado **uma vez** (reuso revoga acesso)
- Tokens JWT têm ~1500-3000 caracteres — prepare sua aplicação para isso
- Inclua `enable-jwt: 1` em **todas** as requisições (obtenção, renovação e uso)

### Revogar token

```bash
POST https://www.bling.com.br/Api/v3/oauth/revoke
Authorization: Basic Base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

token={TOKEN}&
token_type_hint=access_token
```

---

## Endpoints Disponíveis (v3.10)

### Cadastros

| Endpoint | Método | Descrição |
|---|---|---|
| `/contatos` | GET/POST | Listar/criar contatos (clientes, fornecedores) |
| `/contatos/{id}` | GET/PUT/DELETE | Consultar/atualizar/excluir contato |
| `/contatos/tipos` | GET | Listar tipos de contato |
| `/produtos` | GET/POST | Listar/criar produtos |
| `/produtos/{id}` | GET/PUT/DELETE | Consultar/atualizar/excluir produto |
| `/produtos/estruturas` | GET/POST | Estruturas de produtos (Kits) |
| `/produtos/estruturas/{id}` | GET/PUT/DELETE | Consultar/atualizar/excluir estrutura |
| `/produtos/variacoes` | GET/POST | Variações de produtos |
| `/produtos/variacoes/{id}` | GET/PUT/DELETE | Consultar/atualizar/excluir variação |
| `/categorias/produtos` | GET/POST | Categorias de produtos |
| `/categorias/produtos/{id}` | GET/PUT/DELETE | CRUD categoria de produto |
| `/categorias/lojas` | GET/POST | Categorias de lojas |
| `/grupos-produtos` | GET/POST | Grupos de produtos |
| `/campos-customizados` | GET/POST | Campos customizados |
| `/naturezas-operacoes` | GET/POST | Naturezas de operação |
| `/formas-pagamento` | GET/POST | Formas de pagamento |
| `/vendedores` | GET/POST | Vendedores |
| `/usuarios` | GET | Usuários do Bling |

### Pedidos

| Endpoint | Método | Descrição |
|---|---|---|
| `/pedidos/vendas` | GET/POST | Listar/criar pedidos de venda |
| `/pedidos/vendas/{id}` | GET/PUT/DELETE | Consultar/atualizar/excluir pedido de venda |
| `/pedidos/vendas/{id}/situacoes` | PATCH | Alterar situação do pedido |
| `/pedidos/compras` | GET/POST | Listar/criar pedidos de compra |
| `/pedidos/compras/{id}` | GET/PUT/DELETE | CRUD pedido de compra |
| `/pedidos/compras/{id}/situacoes` | PATCH | Alterar situação do pedido de compra |

### Notas Fiscais

| Endpoint | Método | Descrição |
|---|---|---|
| `/nfe` | GET/POST | Listar/criar NF-e (nota fiscal eletrônica) |
| `/nfe/{id}` | GET/DELETE | Consultar/excluir NF-e |
| `/nfe/{id}/situacoes` | GET | Consultar situação da NF-e (SEFAZ) |
| `/nfe/{id}/xml` | GET | Baixar XML da NF-e |
| `/nfe/{id}/pdf` | GET | Baixar DANFE em PDF |
| `/nfce` | GET/POST | Notas Fiscais de Consumidor |
| `/nfce/{id}` | GET/DELETE | CRUD NFC-e |
| `/nfse` | GET/POST | Notas Fiscais de Serviço |
| `/nfse/{id}` | GET/DELETE | CRUD NFS-e |

### Financeiro

| Endpoint | Método | Descrição |
|---|---|---|
| `/contas-pagar` | GET/POST | Contas a pagar |
| `/contas-pagar/{id}` | GET/PUT/DELETE | CRUD conta a pagar |
| `/contas-receber` | GET/POST | Contas a receber |
| `/contas-receber/{id}` | GET/PUT/DELETE | CRUD conta a receber |
| `/borderos` | GET/POST | Borderôs |
| `/contas-contabeis` | GET/POST | Contas contábeis |

### Estoque e Logística

| Endpoint | Método | Descrição |
|---|---|---|
| `/estoques` | GET/POST | Movimentações de estoque |
| `/depositos` | GET/POST | Depósitos |
| `/logisticas` | GET | Logísticas |
| `/logisticas/servicos` | GET | Serviços de logística |
| `/logisticas/remessas` | GET/POST | Remessas |
| `/logisticas/etiquetas` | POST | Gerar etiquetas |
| `/logisticas/objetos` | GET/POST | Objetos de rastreamento |

### Outros

| Endpoint | Método | Descrição |
|---|---|---|
| `/empresas` | GET | Dados da empresa |
| `/situacoes` | GET | Situações disponíveis |
| `/situacoes/transicoes` | GET | Transições de situação |
| `/canais-venda` | GET/POST | Canais de venda |
| `/contratos` | GET/POST | Contratos |
| `/notificacoes` | GET/POST | Notificações |
| `/ordens-producao` | GET/POST | Ordens de produção |
| `/propostas-comerciais` | GET/POST | Propostas comerciais |
| `/categorias/receitas-despesas` | GET/POST | Categorias de receitas e despesas |

---

## Paginação

Todos os endpoints GET suportam paginação:

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `pagina` | 1 | Página a consultar |
| `limite` | 100 | Registros por página (máx: 100) |

Exemplo:
```
GET /Api/v3/produtos?pagina=2&limite=50
```

---

## Filtros por Período

Endpoints que retornam listas aceitam filtros de data:

| Sufixo | Exemplo | Descrição |
|---|---|---|
| `Inicial` | `dataInicial` | Data início |
| `Final` | `dataFinal` | Data fim |

> **Limite**: intervalo máximo de **1 ano** entre `dataInicial` e `dataFinal`. Requisições com intervalo maior retornam `400`.

---

## Situações de Pedidos (Códigos)

| Código | Descrição |
|---|---|
| 1 | Em aberto |
| 2 | Em andamento |
| 3 | Atendido |
| 6 | Cancelado |

---

## Erros Comuns

| Código HTTP | Tipo | Descrição |
|---|---|---|
| `400` | VALIDATION_ERROR | Erro na validação dos campos |
| `400` | MISSING_REQUIRED_FIELD_ERROR | Campo obrigatório não enviado |
| `400` | UNKNOWN_ERROR | Operação não concluída |
| `401` | UNAUTHORIZED | Token inválido ou expirado |
| `403` | FORBIDDEN | Token sem permissão para o escopo |
| `404` | RESOURCE_NOT_FOUND | Recurso não encontrado |
| `429` | TOO_MANY_REQUESTS | Limite de requisições atingido |
| `500` | SERVER_ERROR | Erro interno do servidor |

Formato da resposta de erro:
```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Erro de validação",
    "description": "Campo 'nome' é obrigatório"
  }
}
```

---

## Limites de Requisição

| Regra | Limite |
|---|---|
| Requisições por segundo | **3** |
| Requisições por dia | **120.000** |
| Requisições `/oauth/token` em 60s | **20** |
| Bloqueio IP: erros em 10s | 300 erros → bloqueio 10 min |
| Bloqueio IP: requests em 10s | 600 requests → bloqueio 10 min |
| Bloqueio IP: token requests em 60s | 20 requests → bloqueio 60 min |

> Se a aplicação continuar ultrapassando limites, o IP poderá ser bloqueado por tempo indeterminado.

---

## Boas Práticas

1. **Paginação**: use `limite` para controlar volume; não faça GET sem paginação em produção
2. **Tratamento de erros**: sempre verifique HTTP status; 4xx = erro seu, 5xx = problema deles
3. **Reutilize tokens**: guarde `access_token` e `refresh_token`; não gere novo token a cada request
4. **HTTPS**: sempre use HTTPS nas requisições
5. **Server-side**: nunca exponha `client_secret` no frontend
6. **State parameter**: gere um `state` único para prevenir CSRF no fluxo OAuth
7. **Rate limiting**: implemente retry com backoff exponencial quando receber `429`

---

## Homologação (Apps Públicos)

Aplicativos públicos (disponibilizados na Loja de Extensões) passam por revisão:

1. **Em desenvolvimento** — status ao salvar app público
2. **Em revisão** — após clicar "Solicitar revisão"
3. **Aprovado** — publicado na loja
4. **Rejeitado** — ajuste e refaça revisão
5. **Inativado** — por abuso; contate o suporte

### Teste de homologação

Sequência de requests que o Bling executa para validar seu app:

1. `GET /Api/v3/homologacao/produtos` → obtém dados
2. `POST /Api/v3/homologacao/produtos` → cria produto
3. `PUT /Api/v3/homologacao/produtos/{id}` → atualiza
4. `PATCH /Api/v3/homologacao/produtos/{id}/situacoes` → altera situação
5. `DELETE /Api/v3/homologacao/produtos/{id}` → remove

> **Limites do teste**: máximo 10 segundos total, 2 segundos entre cada request.

### Apps Privados

Para uso interno (apenas sua conta Bling), não precisa de homologação. Ideal para integrações exclusivas como o PDM.

---

## Referências

| Link | Descrição |
|---|---|
| https://developer.bling.com.br | Portal do desenvolvedor |
| https://developer.bling.com.br/referencia | Referência dos endpoints (SPA) |
| https://developer.bling.com.br/bling-api | Autenticação e visão geral |
| https://developer.bling.com.br/aplicativos | Cadastro de aplicativos |
| https://developer.bling.com.br/boas-praticas | Boas práticas |
| https://developer.bling.com.br/erros-comuns | Códigos de erro |
| https://developer.bling.com.br/limites | Limites de requisição |
| https://developer.bling.com.br/migracao-jwt | Migração para JWT |
| https://developer.bling.com.br/homologacao | Processo de homologação |
| https://developer.bling.com.br/como-testar | Testar com Postman |
| https://ajuda.bling.com.br/hc/pt-br/categories/360002186394 | Central de ajuda - API |
| https://github.com/AlexandreBellas/bling-erp-api-js | SDK JS/TS oficial (community) |

---

## SDKs e Bibliotecas

| Linguagem | Pacote | Links |
|---|---|---|
| JavaScript/TypeScript | `bling-erp-api` | [npm](https://www.npmjs.com/package/bling-erp-api) · [GitHub](https://github.com/AlexandreBellas/bling-erp-api-js) |
| PHP | `bling-erp-api` | [GitHub](https://github.com/AlexandreBellas/bling-erp-api-php) |

---

*Documentação compilada em Ago/2026 a partir das fontes oficiais do Bling Developers.*
