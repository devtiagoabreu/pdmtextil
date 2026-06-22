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

# 0003 - INTEGRAÇÃO WHATSAPP VIA EVOLUTION API

---

## 🎯 Objetivo

Permitir que o usuário do PDM crie uma nova **Solicitação de Desenvolvimento** diretamente pelo WhatsApp, sem precisar acessar o sistema web.

---

## 🧩 Visão Geral da Solução

O módulo usará o **Evolution API** (self-hosted via Docker) como gateway WhatsApp, que se conecta via WebSocket à conta do WhatsApp (não precisa de API Business oficial).

### Fluxo proposto

```
Usuário envia WhatsApp → Evolution API → Webhook PDM → Cria solicitação → Confirma via WhatsApp
```

---

## 🧱 O que precisamos implementar

### 1. Database

| Tabela | Mudança |
|--------|---------|
| `usuarios` | Adicionar campo `whatsapp` (varchar, unique) para vincular número à conta |
| `solicitacoes` | Já possui `idIntegracao` — usaremos para marcar origem "WHATSAPP" |

### 2. Tela de Integração (Admin)

Usar o sistema de integrações existente para configurar a Evolution API:

| Campo | Valor |
|-------|-------|
| Nome | Evolution API |
| Base URL | `http://localhost:8080` (ou IP/DNS do servidor) |
| Tipo Auth | `api_key` |
| Auth Config | `{ "key": "seu-api-key", "key_name": "apiKey", "in": "header" }` |
| Telas | `whatsapp` |

### 3. Webhook Endpoint

`POST /api/whatsapp/webhook` — Rota pública que recebe mensagens da Evolution API:

- Validar assinatura/hash (security)
- Buscar usuário pelo número de WhatsApp
- Interpretar a mensagem
- Criar solicitação com dados enviados
- Responder confirmação via Evolution API
- Logar a operação

### 4. Parser de Mensagens

Formato esperado da mensagem:

```
Nova solicitação:
Cliente: Nome do Cliente
Projeto: Nome do Projeto
Tipo: TECELAGEM ou BENEFICIAMENTO
```

Fallback: se não reconhecer o formato, responder com instruções.

### 5. Response Service

Função para enviar mensagem de volta via Evolution API:

```
/send-message
```

### 6. Observações de Segurança

- Autenticar as requisições do webhook (validação de API Key ou hash)
- Validar que o número de WhatsApp está vinculado a um usuário ativo
- Sanitizar entrada de dados antes de criar a solicitação

---

## 🚧 Status

**AGUARDANDO** — Decisão de implementação futura.

---

````md
# 🚀 SKILL DE INSIGHTS

---

# 0002 - DOCUMENTAÇÃO DO CADASTRO DE PRODUTO CRU (TECIDO CRU)

---

## 🎯 Objetivo

Definir a estrutura completa do cadastro de Produto Cru (Tecido Cru), contemplando:

* Desenvolvimento técnico do tecido
* Controle de composição
* Estrutura têxtil
* Amostras piloto
* Acabamentos
* Receitas de processos
* Integração com ERP
* Rastreabilidade entre produto cru e produtos acabados

---

## 🧩 Visão Geral da Solução

O módulo será responsável por controlar todo o fluxo de desenvolvimento do tecido desde a solicitação inicial até a definição dos produtos acabados integrados ao ERP.

O Produto Cru será o núcleo principal da engenharia do tecido.

A estrutura será composta por:

### 1. Produto Cru

Representa o desenvolvimento principal do tecido.

### 2. Composição

Define os materiais que compõem o tecido.

### 3. Estrutura

Define trama e urdume do tecido.

### 4. Amostras de Tecido Cru

Controla os testes e validações do tecido cru.

### 5. Acabamentos

Representa as variações industriais do produto.

### 6. Amostras de Tecido Acabado

Controla os testes e validações por acabamento.

### 7. Receitas de Processo

Define os parâmetros industriais dos acabamentos.

---

## 🏗️ PRINCIPAL DIFERENCIAL DA SOLUÇÃO

A solução separa corretamente:

❌ Produto ≠ Acabamento  
❌ Desenvolvimento ≠ Produção  
❌ Produto Cru ≠ Produto Acabado  

✅ Produto Cru representa a engenharia base  
✅ Acabamento representa uma variação industrial  
✅ ERP recebe produtos separados para cada acabamento  

---

# 🧾 1. Cadastro de Produto Cru

## 📋 Campos

| Campo                     | Tipo    |
| ------------------------- | ------- |
| ID                        | Integer |
| Código PDM                | Varchar |
| Descrição                 | Varchar |
| Solicitação Desenvolvimento | FK    |
| Integração                | FK      |
| ID Integração ERP (Cru)   | Varchar |
| Status                    | Enum    |

---

## 🧠 Exemplo

| Sistema | Código |
| -------- | ------- |
| PDM      | D28 |
| ERP (Cru) | 2.K1820.CRU.000CRU |

---

## 🔗 Integração ERP (Produto Cru)

O Produto Cru poderá possuir um código correspondente no ERP.

Esse código representa o item cru integrado ao sistema externo.

---

# 🧬 2. Subcadastro de Composição

## 📋 Campos

| Campo       | Tipo    |
| ------------ | ------- |
| ID           | Integer |
| Produto Cru  | FK      |
| Material     | FK      |
| Percentual   | Decimal |

---

## 🚨 Regra de Negócio

👉 A soma das composições deve ser obrigatoriamente:

✅ 100%

---

## 🧠 Exemplos

* 63% Algodão + 37% Poliéster
* 98% Algodão + 2% Elastano

---

# 🧵 3. Subcadastro de Estrutura

## 📋 Campos

| Campo         | Tipo    |
| -------------- | ------- |
| ID             | Integer |
| Produto Cru    | FK      |
| Tipo           | Enum    |
| Fio            | FK      |
| Base Urdume    | FK      |
| Ordem          | Integer |

---

## 🧠 Estrutura do Tecido

### 🔹 Trama

* Pode possuir vários fios
* Selecionados do cadastro de fios

### 🔹 Urdume

* Selecionado do cadastro de base de urdume

---

# 🧪 4. Subcadastro de Amostras de Tecido Cru

## 📋 Campos

| Campo        | Tipo    |
| ------------- | ------- |
| ID            | Integer |
| Produto Cru   | FK      |
| Descrição     | Varchar |
| Data          | Date    |
| Status        | Enum    |
| Observações   | Text    |

---

## 🚨 Regra de Negócio

👉 Um Produto Cru pode possuir várias amostras.

👉 Apenas uma amostra pode estar aprovada.

---

# 📘 5. Subcadastro de Ficha Técnica

## 📋 Campos (Exemplo)

| Campo        | Tipo    |
| ------------- | ------- |
| Gramatura    | Decimal |
| Largura      | Decimal |
| Construção   | Varchar |
| Densidade    | Varchar |
| Ligamento    | Varchar |
| Observações  | Text    |

---

## 🧠 Observações

A ficha técnica poderá existir:

* Para o Produto Cru
* Para o Produto Acabado (futuro)

---

# 🎨 6. Subcadastro de Acabamentos

## 📋 Campos

| Campo                          | Tipo    |
| ------------------------------ | ------- |
| ID                             | Integer |
| Produto Cru                    | FK      |
| Tipo Acabamento                | Enum    |
| Descrição                      | Varchar |
| ID Integração ERP (Acabado)    | Varchar |
| Possui Receita                 | Boolean |

---

## 🧠 Conceito

Cada acabamento representa um produto acabado diferente no ERP.

---

## 🧠 Exemplos ERP

| Tipo | Código ERP |
|------|-------------|
| Tinto Branco | 2.K1820.TIN.000001 |
| Tinto Preto | 2.K1820.TIN.000008 |
| Estampado | 2.K1820.094.500113 |
| Termofixado | 2.K1820.TER.000001 |

---

## 🚨 Regra de Negócio

👉 Um Produto Cru pode possuir:

* Nenhum acabamento
* Um acabamento
* Vários acabamentos

---

# 🧪 7. Subcadastro de Amostras de Tecido Acabado

## 📋 Campos

| Campo        | Tipo    |
| ------------- | ------- |
| ID            | Integer |
| Acabamento    | FK      |
| Descrição     | Varchar |
| Data          | Date    |
| Status        | Enum    |
| Observações   | Text    |

---

## 🚨 Regras de Negócio

👉 Cada acabamento pode possuir várias amostras.

👉 Apenas uma amostra pode ser aprovada por acabamento.

---

# ⚙️ 8. Subcadastro de Receitas de Processo

## 📋 Campos

| Campo          | Tipo    |
| --------------- | ------- |
| ID              | Integer |
| Acabamento      | FK      |
| Tipo Receita    | Enum    |
| Parâmetros      | JSON    |

---

## 🧠 Tipos de Receita

### 🔹 Tingimento

* Corantes
* Temperatura
* Tempo

---

### 🔹 Estamparia

* Tipo de estampa
* Tintas
* Quadros

---

### 🔹 Termofixação

* Temperatura
* Tempo
* Pressão

---

## 🚨 Regra de Negócio

👉 Receita pertence ao acabamento e não diretamente ao produto cru.

---

# 🔗 RELACIONAMENTO FINAL

```text
Produto Cru (D28)
│
├── ERP (CRU)
│   └── 2.K1820.CRU.000CRU
│
├── Composição
│
├── Estrutura
│
├── Amostras Cru
│   ├── Amostra 1 ❌
│   └── Amostra 2 ✅
│
└── Acabamentos
    │
    ├── Tinto Branco
    │   ├── ERP → 2.K1820.TIN.000001
    │   ├── Receita
    │   └── Amostras
    │       ├── Teste 1 ❌
    │       └── Teste 2 ✅
    │
    ├── Tinto Preto
    │   └── ERP → 2.K1820.TIN.000008
    │
    ├── Estampado
    │   └── ERP → 2.K1820.094.500113
    │
    └── Termofixado
        └── ERP → 2.K1820.TER.000001
```

---

# 🚨 REGRAS DE NEGÓCIO

## Produto Cru

* Deve possuir composição válida
* Deve possuir estrutura
* Pode possuir integração ERP
* Pode possuir vários acabamentos
* Deve possuir uma amostra aprovada

---

## Composição

* Soma obrigatória = 100%

---

## Acabamentos

* São opcionais
* Representam produtos acabados
* Cada acabamento possui código ERP próprio

---

## Amostras

* Produto Cru → várias amostras
* Acabamento → várias amostras
* Apenas uma aprovada por contexto

---

## Receitas

* Pertencem ao acabamento
* Dependem do tipo de processo

---

# 🗂️ Modelagem Sugerida

## PRODUTO_CRU

* id
* codigo_pdm
* descricao
* solicitacao_desenvolvimento_id
* integracao_id
* id_integracao_erp_cru
* status

---

## PRODUTO_CRU_COMPOSICAO

* id
* produto_cru_id
* material_id
* percentual

---

## PRODUTO_CRU_ESTRUTURA

* id
* produto_cru_id
* tipo
* fio_id
* base_urdume_id
* ordem

---

## PRODUTO_CRU_AMOSTRA

* id
* produto_cru_id
* descricao
* status

---

## PRODUTO_CRU_ACABAMENTO

* id
* produto_cru_id
* tipo_acabamento
* descricao
* id_integracao_erp_acabado

---

## PRODUTO_CRU_ACABAMENTO_AMOSTRA

* id
* acabamento_id
* descricao
* status

---

## PRODUTO_CRU_ACABAMENTO_RECEITA

* id
* acabamento_id
* tipo_receita
* parametros_json

---

# 🚀 BENEFÍCIOS DA SOLUÇÃO

* Controle completo do desenvolvimento têxtil
* Rastreabilidade entre PDM e ERP
* Gestão de variações de acabamento
* Controle de engenharia de produto
* Integração com produção
* Escalabilidade industrial

---

# 💡 CONCLUSÃO

👉 Estamos criando uma estrutura completa de engenharia têxtil integrada ao ERP.

Com isso, o sistema passa a controlar:

* Desenvolvimento do tecido
* Engenharia do produto
* Processos industriais
* Produtos acabados
* Integração com ERP
* Histórico de validações

---
````
