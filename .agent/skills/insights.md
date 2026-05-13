# 🚀 SKILL DE INSIGHTS

## 0001 - DOCUMENTAÇÃO DA INTEGRAÇÃO COM APIs DOS SISTEMAS

---

## 🎯 Objetivo

Criar um módulo de integração altamente flexível que permita configurar e executar requisições HTTP para qualquer API externa, sem necessidade de desenvolvimento específico.

A solução deve funcionar como um **construtor dinâmico de requisições**, permitindo configurar:

* Autenticação
* Headers
* Parâmetros
* Body
* Método HTTP
* Endpoint
* Regras de execução

---

## 🧩 Visão Geral da Solução

Será criado um módulo em:

👉 **Configurações → Cadastro de Integrações**

Com duas camadas:

### 1. Integração (configuração base)

Define conexão com o sistema externo

### 2. Endpoints (requisições dinâmicas)

Define como cada chamada HTTP será executada

---

## 🏗️ PRINCIPAL DIFERENCIAL DA SOLUÇÃO

Diferente de um modelo tradicional:

❌ Não teremos campos fixos para cada tipo de autenticação
❌ Não teremos estrutura engessada

✅ O usuário poderá configurar **qualquer tipo de integração**
✅ A estrutura será **100% dinâmica (modelo tipo Insomnia/Postman)**

---

## 🧾 1. Cadastro de Integrações

### 📋 Campos

| Campo             | Tipo    |
| ----------------- | ------- |
| ID                | Integer |
| Nome              | Varchar |
| Descrição         | Varchar |
| Base URL          | Varchar |
| Tipo Autenticação | Enum    |
| Auth Config       | JSON    |
| Status            | Boolean |

---

## 🔐 Auth Config (DINÂMICO)

Aqui está o coração da solução:

👉 Um campo JSON que define a autenticação

---

### 🧠 Exemplos

#### OAuth2

```json
{
  "type": "oauth2",
  "grant_type": "client_credentials",
  "client_id": "xxx",
  "client_secret": "xxx",
  "token_url": "https://...",
  "scope": "read"
}
```

---

#### Basic Auth

```json
{
  "type": "basic",
  "username": "admin",
  "password": "123456"
}
```

---

#### API Key

```json
{
  "type": "api_key",
  "key": "abc123",
  "key_name": "x-api-key",
  "in": "header"
}
```

---

#### Bearer Token

```json
{
  "type": "bearer",
  "token": "abc123xyz"
}
```

---

## 🔗 2. Cadastro de Endpoints

### 📋 Campos

| Campo          | Tipo    |
| -------------- | ------- |
| ID             | Integer |
| Integração     | FK      |
| Nome           | Varchar |
| Descrição      | Varchar |
| Método         | Enum    |
| URL            | Varchar |
| Headers        | JSON    |
| Query Params   | JSON    |
| Body           | JSON    |
| Timeout        | Integer |
| Tela Vinculada | Varchar |
| Status         | Boolean |

---

## 🧠 DIFERENCIAL: CONFIGURAÇÃO COMPLETA DA REQUISIÇÃO

Cada endpoint funcionará como uma requisição completa:

---

### 📦 Exemplo real

```json
{
  "method": "GET",
  "url": "api_apontador_ops",
  "headers": {
    "Content-Type": "application/json"
  },
  "query": {
    "empresa": "01"
  }
}
```

---

## 🔄 Fluxo Operacional (GET)

### 1. Usuário acessa a tela

Ex: Cadastro de Fios

---

### 2. Botão disponível

👉 **Integração API**

---

### 3. Modal dinâmico

O sistema abre um modal com:

* Um botão para cada endpoint vinculado à tela
* Nome do botão = descrição do endpoint

Ex:

* Importar Fios
* Importar Clientes

---

### 4. Execução da requisição

Ao clicar:

* Sistema monta a requisição completa
* Aplica autenticação
* Aplica headers
* Aplica query/body
* Executa chamada HTTP

---

### 5. Retorno da API

* Recebe JSON
* Converte para estrutura de grid

---

### 6. Exibição em GridView

O modal exibe:

* Dados retornados
* Checkbox por linha
* Seleção múltipla
* Botão "Selecionar Todos"

---

### 7. Importação

Usuário clica:

👉 **Importar**

Sistema:

* Processa itens selecionados
* Executa INSERT no banco
* Valida dados

---

### 8. Resultado

* Feedback visual
* Logs de execução
* Atualização da tela

---

## 📥 Mapeamento de Dados (IMPORTANTE)

Para funcionar bem, você pode evoluir com:

```json
{
  "mapping": {
    "codigo": "cod_fio",
    "descricao": "desc_fio"
  }
}
```

👉 Isso permite converter JSON → tabela automaticamente

---

## 🗂️ Modelagem Sugerida

### INTEGRACOES

* id
* nome
* base_url
* tipo_auth
* auth_config (JSON)
* status

---

### ENDPOINTS

* id
* integracao_id
* nome
* descricao
* metodo
* url
* headers (JSON)
* query (JSON)
* body (JSON)
* tela
* status

---

### LOG_INTEGRACAO

* id
* endpoint_id
* request
* response
* status
* data_execucao

---

## 🚀 Benefícios da Solução

* Integra qualquer API
* Zero código para novos endpoints
* Total flexibilidade
* Reutilização de integrações
* Escalável

---

## 💡 CONCLUSÃO

👉 Estamos criando um **motor de integração universal**

Com isso, o sistema passa a ter capacidade de:

* Se conectar com qualquer ERP
* Integrar com marketplaces
* Consumir APIs externas
* Automatizar processos

---



