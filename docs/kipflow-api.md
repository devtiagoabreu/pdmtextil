# API Kipflow — Consulta de Dados Empresariais

API para consulta de dados cadastrais de empresas brasileiras (CNPJ), informações de CPF e perfis profissionais do LinkedIn.

- **Base URL**: `https://api.kipflow.io`
- **Website**: https://kipflow.io
- **Docs**: https://docs.kipflow.io
- **Dashboard**: https://platform.kipflow.io
- **Suporte**: contato@kipflow.io
- **PlayBook LAB**: https://playbooklab.notion.site/kipflow

---

## Autenticação

Todas as requisições exigem API Key enviada no header:

```
X-API-Key: sua-chave-aqui
```

Crie/gerencie chaves no Dashboard → API Keys. Nunca exponha a chave em frontend.

---

## Rate Limits

| Janela       | Limite         |
| ------------ | -------------- |
| Por segundo  | 5 requisições  |
| Por minuto   | 100 requisições |
| Por hora     | 1.000 requisições |

Ao exceder, retorna `429` com `ttl` (ms para aguardar).

---

## Empresas (CNPJ)

### GET /companies/v1/search

Consulta empresa por CNPJ ou domínio.

**Parâmetros:**

| Parâmetro  | Tipo     | Obrigatório | Descrição                          |
| ---------- | -------- | ----------- | ---------------------------------- |
| `cnpj`     | `string` | Sim*        | CNPJ com ou sem máscara            |
| `domain`   | `string` | Sim*        | Domínio da empresa                 |
| `datasets` | `string` | Não         | Datasets separados por vírgula     |

> `*` Deve informar `cnpj` ou `domain`.

**Datasets disponíveis:**

- `complete` — dados completos da Receita Federal
- `address` — endereço completo
- `contact` — contatos (telefone, email)
- `financial` — dados financeiros
- `tax` — dados tributários

**Exemplo:**

```bash
curl -H "X-API-Key: $KEY" \
  "https://api.kipflow.io/companies/v1/search?cnpj=35965725000107&datasets=complete,address"
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "cnpj": "35965725000107",
    "razao_social": "...",
    "nome_fantasia": "...",
    "endereco": { ... }
  },
  "datasets": ["complete", "address"],
  "cost": 0.32,
  "costFormatted": "R$ 0,32"
}
```

### POST /companies/v1/search

Busca avançada com filtros complexos.

**Body (JSON):**

```json
{
  "cnpj": "35965725000107",
  "datasets": ["complete", "address"],
  "filters": {
    "situacao": "ATIVA"
  }
}
```

---

## Empresas (LinkedIn) — R$ 0,49/consulta

### GET /social/v1/companies/search

Busca empresa por ID público do LinkedIn.

**Parâmetros:**

| Parâmetro            | Tipo     | Obrigatório | Descrição                        |
| -------------------- | -------- | ----------- | -------------------------------- |
| `linkedin_public_id` | `string` | Sim         | ID público da empresa no LinkedIn |

**Exemplo:**

```bash
curl -H "X-API-Key: $KEY" \
  "https://api.kipflow.io/social/v1/companies/search?linkedin_public_id=google"
```

---

## Pessoas (LinkedIn) — R$ 0,49/consulta

### GET /social/v1/people/search

Busca pessoa por profile public ID do LinkedIn.

**Parâmetros:**

| Parâmetro            | Tipo     | Obrigatório | Descrição                        |
| -------------------- | -------- | ----------- | -------------------------------- |
| `profile_public_id`  | `string` | Sim         | ID público do perfil no LinkedIn  |

**Exemplo:**

```bash
curl -H "X-API-Key: $KEY" \
  "https://api.kipflow.io/social/v1/people/search?profile_public_id=joaosilva"
```

### POST /social/v1/people/search

Busca avançada de pessoas com filtros.

**Body (JSON):**

```json
{
  "profile_public_id": "joaosilva",
  "include_company": true
}
```

---

## CPF

### GET /cpf/v1/search

Consulta dados de CPF.

**Parâmetros:**

| Parâmetro | Tipo     | Obrigatório | Descrição                   |
| --------- | -------- | ----------- | --------------------------- |
| `cpf`     | `string` | Sim         | CPF com ou sem máscara      |

---

## Cobrança

Sistema de **cobrança por dataset**. O valor é calculado conforme os datasets solicitados e debitado do saldo. Compre créditos via Dashboard (Stripe).

---

## Códigos de Erro

| HTTP | Código                  | Descrição                          |
| ---- | ----------------------- | ---------------------------------- |
| 400  | `INVALID_CNPJ`          | CNPJ inválido                      |
| 400  | `INVALID_CPF`           | CPF inválido                       |
| 400  | `MISSING_PARAMETER`     | Parâmetro obrigatório ausente      |
| 400  | `INVALID_DATASETS`      | Dataset inválido                   |
| 401  | `API_KEY_MISSING`       | API Key não enviada                |
| 401  | `API_KEY_INVALID`       | API Key inválida ou desativada     |
| 402  | `INSUFFICIENT_CREDITS`  | Saldo insuficiente                 |
| 404  | `COMPANY_NOT_FOUND`     | Empresa não encontrada             |
| 404  | `PERSON_NOT_FOUND`      | Pessoa não encontrada              |
| 408  | `REQUEST_TIMEOUT`       | Tempo limite excedido              |
| 429  | `RATE_LIMIT_EXCEEDED`   | Rate limit excedido                |
| 500  | `INTERNAL_ERROR`        | Erro interno                       |
| 503  | `SERVICE_UNAVAILABLE`   | Serviço indisponível               |

**Formato de erro:**

```json
{
  "success": false,
  "error": {
    "code": "API_KEY_INVALID",
    "message": "API Key inválida ou desativada",
    "details": {}
  }
}
```

---

## Boas Práticas

- **Cache**: Armazene dados que não mudam com frequência
- **Datasets**: Solicite apenas os datasets necessários
- **Retry**: Implemente retry com backoff exponencial (timeout recomendado: 30s)
- **Compressão**: Habilite gzip nas requisições
- **Logging**: Registre requests e responses para debug
