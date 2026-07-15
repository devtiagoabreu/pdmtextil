# API Systêxtil ERP Cloud

Documentação completa da API REST do ERP Systêxtil para integração via Cloud.
https://ajuda.systextil.com.br/api/requisicao-compra
---

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Padrões Comuns](#padrões-comuns)
- [Endpoints por Entidade](#endpoints-por-entidade)
  - [Cliente](#cliente)
  - [Fornecedor](#fornecedor)
  - [Funcionário](#funcionário)
  - [Produto](#produto)
  - [Pedido Venda](#pedido-venda)
  - [Pedido Compra](#pedido-compra)
  - [Requisição Compra](#requisição-compra)
  - [Tabela Preço Venda](#tabela-preço-venda)
  - [Representante](#representante)
  - [Forma Pagamento](#forma-pagamento)
  - [Condição Pagamento (Compra)](#condição-pagamento-compra)
  - [Condição Pagamento Venda](#condição-pagamento-venda)
  - [Forma Pagamento Venda](#forma-pagamento-venda)
  - [Motivo Cancelamento](#motivo-cancelamento)
  - [Centro Custo](#centro-custo)
  - [Usuário Centro Custo](#usuário-centro-custo)
  - [Grupo Econômico](#grupo-econômico)
  - [Comprador](#comprador)
  - [Grupo Comprador](#grupo-comprador)
  - [Estoque](#estoque)
  - [Movimento Estoque](#movimento-estoque)
  - [Requisição Estoque](#requisição-estoque)
  - [Depósito](#depósito)
  - [Título a Pagar](#título-a-pagar)
  - [Título a Receber](#título-a-receber)
  - [Recebimento](#recebimento)
  - [Consulta Crédito](#consulta-crédito)
  - [Documento Saída](#documento-saída)
  - [Documento Entrada](#documento-entrada)
  - [XML NFE](#xml-nfe)
  - [Empresa](#empresa)
  - [Conta Contábil](#conta-contábil)
  - [Lançamento Contábil](#lançamento-contábil)
  - [Transações](#transações)
  - [Calcular Preço](#calcular-preço)
  - [Unidade de Medida](#unidade-de-medida)
  - [Coleção](#coleção)
  - [Projeto](#projeto)
  - [Planejamento Industrial](#planejamento-industrial)
  - [Baixa de Ordem de Confecção](#baixa-de-ordem-de-confecção)
  - [Fila Máquina](#fila-máquina)
  - [Ordem Beneficiamento](#ordem-beneficiamento)
  - [Roteiro](#roteiro)
  - [Tracking Pedido](#tracking-pedido)
  - [Sugestão de Rolos](#sugestão-de-rolos)
  - [Subscription (Webhook)](#subscription-webhook)
  - [Representante Views](#representante-views)
  - [Despesas / Adiantamentos / Prestação Contas](#despesas--adiantamentos--prestação-contas)
  - [Renegociação de Títulos](#renegociação-de-títulos)
- [Códigos de Resposta](#códigos-de-resposta)
- [Filtros (q)](#filtros-q)
- [Exemplos](#exemplos)

---

## Visão Geral

- **Base URL (QA):** `https://qa-api-{customerid}.systextilapps.com.br/`
- **Base URL (Produção):** `https://api-{customerid}.systextilapps.com.br/`
- Onde `{customerid}` é o identificador único do cliente.
- Content-Type: `application/json`
- Suporte a requisições síncronas e assíncronas via query `sync=true|false`.

---

## Autenticação

A API usa **OAuth2 Client Credentials** (Oracle Cloud IDCS) e opcionalmente **APIKey** no header.

### OAuth2

- **Token URL:** `https://idcs-03651be63851489595548b9127721fa1.identity.oraclecloud.com/oauth2/v1/token`
- **Grant Type:** `client_credentials`
- **Scopes:**
  - `QAS` — acesso ao ambiente de QA
  - `PRD` — acesso ao ambiente de Produção
  - `C0405:QA` — token QA
  - `C0405:PRD` — token PRD
- Enviar token no header: `Authorization: Bearer <token>`

### APIKey (alternativa)

- Header: `APIKey: <sua_chave>`

---

## Padrões Comuns

### Query Parameters (GET)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `limit` | int | Limite de registros (1-100, default 20) |
| `offset` | int | Deslocamento (default 0) |
| `q` | string | Filtro no formato JSON codificado (RFC3986) |

### Query Parameters (POST/PUT)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `sync` | bool | `true` = síncrono, `false` = assíncrono (default) |

### Request Body (POST/PUT)

```json
{
  "items": [{ ... }]
}
```

O body é sempre um objeto com array `items`. Cada item do array representa um registro.

### Resposta Assíncrona (201)

```json
{
  "data_hora_response": "2026-01-01T12:00:00.000Z",
  "id": "uuid-da-transacao"
}
```

### Resposta de Erro

```json
{
  "data_hora_response": "2026-01-01T12:00:00.000Z",
  "id": "uuid",
  "message": [
    {
      "cnpj_9": 123456789,
      "cnpj_4": 1234,
      "cnpj_2": 12,
      "mensagem": [
        {
          "nivel": "ERRO",
          "campo": "nome_campo",
          "valor": "valor_enviado",
          "mensagem": "Descrição do erro"
        }
      ]
    }
  ]
}
```

---

## Endpoints por Entidade

### Cliente

**Base path:** `/pessoa/v1/cliente`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /pessoa/v1/cliente` | Consulta clientes | — |
| POST | `POST /pessoa/v1/cliente` | Cadastro cliente | `cnpj_r`, `cnpj_d`, `cnpj_2`, `nome_cliente`, `forma_pagamento`, `codigo_banco`, `agencia_banco`, `nome_contato`, `seq_endereco`, `cnpj_r_fonte_referencia`, `cnpj_d_fonte_referencia`, `cnpj_2_fonte_referencia`, `nome_fonte_referencia` |
| PUT | `PUT /pessoa/v1/cliente` | Alteração cliente | `cnpj_r`, `cnpj_d`, `cnpj_2` |
| DELETE | `DELETE /pessoa/v1/cliente` | Exclusão cliente | — |

**Query DELETE:** `q` (filtro para identificar o registro)

---

### Fornecedor

**Base path:** `/pessoa/v1/fornecedor`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /pessoa/v1/fornecedor` | Consulta fornecedores | — |
| POST | `POST /pessoa/v1/fornecedor` | Cadastro fornecedor | `cnpj_9_fornecedor`, `cnpj_4_fornecedor`, `cnpj_2_fornecedor`, `tipo_fornecedor_id`, `cep_fornecedor`, `endereco_fornecedor`, `numero_fornecedor`, `bairro_fornecedor`, `cidade_fornecedor_id`, `nome_contato_fornecedor`, `banco_fornecedor_id`, `data_informacao`, `sequencia_informacao`, `tipo_socio`, `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id`, `tipo_chave_pix` |
| PUT | `PUT /pessoa/v1/fornecedor` | Alteração fornecedor | `cnpj_9_fornecedor`, `cnpj_4_fornecedor`, `cnpj_2_fornecedor` |
| DELETE | `DELETE /pessoa/v1/fornecedor` | Exclusão fornecedor | — |

---

### Funcionário

**Base path:** `/pessoa/v1/funcionario`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /pessoa/v1/funcionario` | Consulta funcionários | — |
| POST | `POST /pessoa/v1/funcionario` | Cadastro funcionário | `empresa_id`, `funcionario_id` |
| PUT | `PUT /pessoa/v1/funcionario` | Alteração funcionário | `empresa_id`, `funcionario_id` |
| DELETE | `DELETE /pessoa/v1/funcionario` | Exclusão funcionário | — |

---

### Produto

**Base path:** `/material/v1/produto`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /material/v1/produto` | Consulta produtos | — |
| POST | `POST /material/v1/produto` | Cadastro produto | `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id`, `codigo_acompanhamento`, `item_estrutura_id` |
| PUT | `PUT /material/v1/produto` | Alteração produto | `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id` |
| DELETE | `DELETE /material/v1/produto` | Exclusão produto | — |

**Campos principais do produto:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nivel_produto` | string(1) | (1) Peça, (2) Tecido, (4) Tecido Cru, (5) Serviços, (7) Fio, (8) Largura Tecido, (9) Material Comprado |
| `grupo_id` | string(5) | Grupo do produto |
| `subgrupo_id` | string(3) | Subgrupo do produto |
| `item_estrutura_id` | string(6) | Item/cor do produto |
| `descricao_produto` | string(65) | Descrição do produto |
| `situacao_produto` | int | (0) Ativo, (1) Inativo, (2) Lançamento |
| `classificacao_fiscal` | string(15) | NCM/SH |
| `unidade_medida_id` | string(2) | Unidade de medida |
| `origem_produto` | int | (1) Nacional, (2) Importado, (3) Sem classificação |
| `codigo_barras` | string(16) | Código de barras |
| `peso_oz` | number | Peso em OZ |
| `largura` | number | Largura do tecido |
| `composicao_1_id` a `composicao_5_id` | string(6) | Composição do produto (símbolo + percentual) |
| `colecao_id` | int | Coleção do produto |
| `acompanhamentos` | array | Produtos acompanhamento (com `codigo_acompanhamento` obrigatório) |

---

### Pedido Venda

**Base path:** `/venda/v1/pedido/venda`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /venda/v1/pedido/venda` | Consulta pedidos | — |
| POST | `POST /venda/v1/pedido/venda` | Cadastro pedido | `codigo_pedido` |
| PUT | `PUT /venda/v1/pedido/venda` | Alteração pedido | `codigo_pedido`, `seq_item_pedido` |
| DELETE | `DELETE /venda/v1/pedido/venda` | Exclusão pedido | (via `q`) |
| PUT | `PUT /venda/v1/pedido/{codigo_pedido}/cancelar` | Cancelar pedido | `codigo_pedido` (path) |

**Campos do Pedido Venda (POST):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `codigo_pedido` | number(6) | Sim | Código do pedido |
| `codigo_empresa_pedido` | number(3) | | Código da empresa |
| `cnpj9_cliente` | number(9) | | 9 dígitos do CNPJ/CPF |
| `cnpj4_cliente` | number(4) | | 4 dígitos secundários |
| `cnpj2_cliente` | number(2) | | 2 dígitos verificadores |
| `nome_cliente` | string(40) | | Nome/Razão Social |
| `tipo_peca_pedido` | string(1) | | (1) Peças, (2) Tecidos, (4) Tecidos Crús, (7) Fios |
| `tipo_pedido` | number(1) | | (0) Programado, (1) Pronta Entrega |
| `tipo_produto_pedido` | number(1) | | (1) 1ª qualidade, (2) 2ª qualidade, (3) Retalho, (4) Amostragem, (5) Exportação, (6) Desenvolvimento |
| `data_emissao` | datetime | | Data de emissão |
| `data_base_faturamento` | datetime | | Data base faturamento |
| `data_previsao_recebimento_cliente` | datetime | | Previsão de recebimento |
| `condicao_pagamento` | number(3) | | Condição de pagamento |
| `codigo_representante` | number(5) | | Código do representante |
| `codigo_funcionario` | number(6) | | Código do funcionário |
| `colecao_tabela` | number(2) | | Tabela de preço |
| `mes_tabela` | number(2) | | Mês da tabela |
| `sequencia_tabela` | number(2) | | Sequência da tabela |
| `moeda_id` | number(2) | | Código da moeda |
| `tipo_frete` | number(1) | | (1) Pago, (2) A pagar, (3) Terceiros, (4) Cortesia, (5) Fechado, (6) Próprio Remetente, (7) Próprio Destinatário |
| `via_transporte` | number(1) | | (1) Terrestre, (2) Aéreo, (3) Marítimo, (4) Ferroviário, (5) Fluvial |
| `natureza_operacao` | number(3) | | Natureza da operação |
| `cfop_principal` | string(5) | | CFOP principal |
| `forma_pagamento_id` | number(2) | | Forma de pagamento |
| `cnpj_9_transportadora` | number(9) | | CNPJ transportadora |
| `cnpj_4_transportadora` | number(4) | | |
| `cnpj_2_transportadora` | number(2) | | |
| `status_pedido` | number(1) | | (0) Digitado, (1) Financeiro, (2) Liberado Financeiro, (3) Faturamento, (4) A cancelar, (5) Cancelado, (9) Aberto web |
| `situacao_venda` | number(2) | | (0) Liberado, (5) Suspenso, (9) Faturado Parcial, (10) Faturado Total |
| `origem_pedido_id` | number(2) | | Tipo de origem |
| `observacao` | object | | Objeto com `observacao_pedido`, `aceita_antecipacao`, `permite_parcial`, etc. |
| `itens_pedidos` | array | | Array de itens (ver abaixo) |
| `despesas_adicionais` | object | | `valor_frete_pedido`, `valor_seguro_pedido`, `valor_despesas_pedido`, `desconto_especial_pedido` |

**Itens do Pedido (`itens_pedidos`):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `seq_item_pedido` | number(3) | Sim | Sequência do item |
| `grupo_id` | string(5) | | Grupo do produto |
| `item_id` | string(6) | | Cor do produto |
| `subgrupo_id` | string(3) | | Tamanho do produto |
| `quantidade_pedida` | number(15) | | Quantidade pedida |
| `quantidade_distribuida` | number(15) | | Quantidade distribuída |
| `deposito_id` | number(3) | | Código do depósito |
| `valor_unitario` | number(17) | | Valor unitário |
| `percentual_desconto_item` | number(6) | | % desconto no item |
| `valor_unitario_liquido` | number(17) | | Valor líquido |
| `centro_custo_id` | number(9) | | Centro de custo |
| `unidade_medida` | string(2) | | Unidade de medida |
| `cancelamento_item_id` | number(3) | | Motivo cancelamento do item |

---

### Pedido Compra

**Base path:** `/compra/v1/pedido/compra`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/pedido/compra` | Consulta pedidos de compra | — |
| POST | `POST /compra/v1/pedido/compra` | Cadastro pedido compra | `empresa_id`, `data_emissao`, `data_previsao_entrega`, `cnpj_9_fornecedor`, `cnpj_4_fornecedor`, `cnpj_2_fornecedor`, `comprador_id`, `sequencia_item_pedido`, `sequencia_linha` |
| PUT | `PUT /compra/v1/pedido/compra` | Alteração pedido compra | `empresa_id`, `sequencia` |
| DELETE | `DELETE /compra/v1/pedido/compra` | Exclusão pedido compra | — |
| PUT | `PUT /compra/v1/pedido/{sequencia}/cancelar` | Cancelar pedido compra | `sequencia` (path) |

---

### Requisição Compra

**Base path:** `/compra/v1/requisicao/compra`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /compra/v1/requisicao/compra` | Consulta requisições | — |
| POST | `POST /compra/v1/requisicao/compra` | Cadastro requisição | `empresa_id`, `sequencia`, `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id` |
| PUT | `PUT /compra/v1/requisicao/compra` | Alteração requisição | chaves do registro |
| DELETE | `DELETE /compra/v1/requisicao/compra` | Exclusão requisição | — |
| PUT | `PUT /compra/v1/requisicao/{sequencia}/cancelar` | Cancelar requisição | `sequencia` (path) |

---

### Tabela Preço Venda

**Base path:** `/venda/v1/tabela/preco`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /venda/v1/tabela/preco` | Consulta tabelas de preço |
| POST | `POST /venda/v1/tabela/preco` | Cadastro tabela |
| PUT | `PUT /venda/v1/tabela/preco` | Alteração tabela |
| DELETE | `DELETE /venda/v1/tabela/preco` | Exclusão tabela |
| GET | `GET /venda/v1/tabela/preco/item` | Consulta item da tabela |
| GET | `GET /venda/v1/tabela/preco/consulta_preco` | Consulta preço de venda |

**Campos chave (POST):** `colecao_tabela`, `mes_tabela`, `sequencia_tabela`, `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id`

---

### Representante

**Base path:** `/pessoa/v1/representante`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /pessoa/v1/representante` | Consulta representantes | — |
| POST | `POST /pessoa/v1/representante` | Cadastro representante | `cnpj_9_representante`, `cnpj_4_representante`, `cnpj_2_representante`, `ie_representante`, `nome_representante`, `cep_representante`, `endereco_representante`, `bairro_representante` |
| PUT | `PUT /pessoa/v1/representante` | Alteração representante | chaves do registro |
| DELETE | `DELETE /pessoa/v1/representante` | Exclusão representante | — |

---

### Forma Pagamento

**Base path:** `/compra/v1/forma/pagamento`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/forma/pagamento` | Consulta formas de pagamento | — |
| POST | `POST /compra/v1/forma/pagamento` | Cadastro forma pagamento | `tipo_pagamento_id`, `tipo_pagamento_descricao` |
| PUT | `PUT /compra/v1/forma/pagamento` | Alteração forma pagamento | `tipo_pagamento_id` |
| DELETE | `DELETE /compra/v1/forma/pagamento` | Exclusão forma pagamento | — |

---

### Condição Pagamento (Compra)

**Base path:** `/compra/v1/condicao/pagamento`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/condicao/pagamento` | Consulta condições de pagamento | — |
| POST | `POST /compra/v1/condicao/pagamento` | Cadastro condição | `condicao_pagamento_id`, `sequencia` |
| PUT | `PUT /compra/v1/condicao/pagamento` | Alteração condição | chaves do registro |
| DELETE | `DELETE /compra/v1/condicao/pagamento` | Exclusão condição | — |

---

### Condição Pagamento Venda

**Base path:** `/venda/v1/condicao/pagamento`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /venda/v1/condicao/pagamento` | Consulta condições | — |
| POST | `POST /venda/v1/condicao/pagamento` | Cadastro condição | `condicao_pagamento_cliente`, `sequencia` |
| PUT | `PUT /venda/v1/condicao/pagamento` | Alteração condição | chaves do registro |
| DELETE | `DELETE /venda/v1/condicao/pagamento` | Exclusão condição | — |

---

### Forma Pagamento Venda

**Base path:** `/venda/v1/forma/pagamento`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /venda/v1/forma/pagamento` | Consulta formas de pagamento de venda |

---

### Motivo Cancelamento

**Base path:** `/compra/v1/motivo/cancelamento`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/motivo/cancelamento` | Consulta motivos | — |
| POST | `POST /compra/v1/motivo/cancelamento` | Cadastro motivo | `cancelamento_id` |
| PUT | `PUT /compra/v1/motivo/cancelamento` | Alteração motivo | `cancelamento_id` |
| DELETE | `DELETE /compra/v1/motivo/cancelamento` | Exclusão motivo | — |

---

### Centro Custo

**Base path:** `/pessoa/v1/centro_custo`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /pessoa/v1/centro_custo` | Consulta centros de custo |

---

### Usuário Centro Custo

**Base path:** `/pessoa/v1/usuario_centrocusto`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /pessoa/v1/usuario_centrocusto` | Consulta usuários por centro custo | — |
| POST | `POST /pessoa/v1/usuario_centrocusto` | Cadastro usuário centro custo | `centro_custo_id`, `usuario` |
| PUT | `PUT /pessoa/v1/usuario_centrocusto` | Alteração usuário centro custo | `centro_custo_id`, `usuario` |
| DELETE | `DELETE /pessoa/v1/usuario_centrocusto` | Exclusão usuário centro custo | — |

---

### Grupo Econômico

**Base path:** `/pessoa/v1/grupo_economico`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /pessoa/v1/grupo_economico` | Consulta grupos econômicos | — |
| POST | `POST /pessoa/v1/grupo_economico` | Cadastro grupo econômico | `grupo_economico_id`, `grupo_economico_descricao`, `unidade_limite_ped` |
| PUT | `PUT /pessoa/v1/grupo_economico` | Alteração grupo econômico | `grupo_economico_id` |
| DELETE | `DELETE /pessoa/v1/grupo_economico` | Exclusão grupo econômico | — |

---

### Comprador

**Base path:** `/compra/v1/comprador`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/comprador` | Consulta compradores | — |
| POST | `POST /compra/v1/comprador` | Cadastro comprador | `comprador_id` |
| PUT | `PUT /compra/v1/comprador` | Alteração comprador | `comprador_id` |
| DELETE | `DELETE /compra/v1/comprador` | Exclusão comprador | — |

---

### Grupo Comprador

**Base path:** `/compra/v1/grupo_comprador`

| Método | Path | Descrição | Campos Chave |
|--------|------|-----------|--------------|
| GET | `GET /compra/v1/grupo_comprador` | Consulta grupos de compras | — |
| POST | `POST /compra/v1/grupo_comprador` | Cadastro grupo comprador | `equipe_id`, `comprador_id`, `nivel_produto`, `grupo_id`, `subgrupo_id`, `item_estrutura_id` |
| PUT | `PUT /compra/v1/grupo_comprador` | Alteração grupo comprador | chaves do registro |
| DELETE | `DELETE /compra/v1/grupo_comprador` | Exclusão grupo comprador | — |

---

### Estoque

**Base path:** `/material/v1/estoque`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/estoque` | Consulta saldo de estoque |

---

### Movimento Estoque

**Base path:** `/material/v1/movimento/estoque`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/movimento/estoque` | Consulta movimentos de estoque |
| POST | `POST /material/v1/movimento/estoque` | Cadastro movimento de estoque |

---

### Requisição Estoque

**Base path:** `/material/v1/requisicao/estoque`

| Método | Path | Descrição | Campos Chave (POST) |
|--------|------|-----------|---------------------|
| GET | `GET /material/v1/requisicao/estoque` | Consulta requisições de estoque | — |
| POST | `POST /material/v1/requisicao/estoque` | Cadastro requisição estoque | `empresa_id`, `sequencia`, requisitos do item |
| PUT | `PUT /material/v1/requisicao/estoque` | Alteração requisição estoque | chaves do registro |
| DELETE | `DELETE /material/v1/requisicao/estoque` | Exclusão requisição estoque | — |

---

### Depósito

**Base path:** `/material/v1/deposito`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/deposito` | Consulta depósitos |

---

### Título a Pagar

**Base path:** `/financeiro/v1/titulo/pagar`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /financeiro/v1/titulo/pagar` | Consulta títulos a pagar |
| POST | `POST /financeiro/v1/titulo/pagar` | Cadastro título a pagar |
| PUT | `PUT /financeiro/v1/titulo/pagar` | Alteração título a pagar |
| DELETE | `DELETE /financeiro/v1/titulo/pagar` | Exclusão título a pagar |

---

### Título a Receber

**Base path:** `/financeiro/v1/titulo/receber`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /financeiro/v1/titulo/receber` | Consulta títulos a receber |
| POST | `POST /financeiro/v1/titulo/receber` | Cadastro título a receber |
| PUT | `PUT /financeiro/v1/titulo/receber` | Alteração título a receber |
| DELETE | `DELETE /financeiro/v1/titulo/receber` | Exclusão título a receber |

---

### Recebimento

**Base path:** `/financeiro/v1/recebimento`

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `POST /financeiro/v1/recebimento` | Cadastro recebimento |

---

### Consulta Crédito

**Base path:** `/pessoa/v1/consulta_credito`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /pessoa/v1/consulta_credito` | Consulta crédito do cliente |

---

### Documento Saída

**Base path:** `/fiscal/v1/documento/saida`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /fiscal/v1/documento/saida` | Consulta documentos de saída (NF-e) |

---

### Documento Entrada

**Base path:** `/fiscal/v1/documento/entrada`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /fiscal/v1/documento/entrada` | Consulta documentos de entrada |
| POST | `POST /fiscal/v1/documento/entrada` | Cadastro documento de entrada |

---

### XML NFE

**Base path:** `/fiscal/v1/xml_nfe`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /fiscal/v1/xml_nfe` | Consulta XML de NF-e |

---

### Empresa

**Base path:** `/pessoa/v1/empresa`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /pessoa/v1/empresa` | Consulta empresas |

---

### Conta Contábil

**Base path:** `/contabil/v1/conta`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /contabil/v1/conta` | Consulta contas contábeis |
| POST | `POST /contabil/v1/conta` | Cadastro conta contábil |
| PUT | `PUT /contabil/v1/conta` | Alteração conta contábil |
| DELETE | `DELETE /contabil/v1/conta` | Exclusão conta contábil |

---

### Lançamento Contábil

**Base path:** `/contabil/v1/lancamento`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /contabil/v1/lancamento` | Consulta lançamentos contábeis |
| POST | `POST /contabil/v1/lancamento` | Cadastro lançamento contábil |
| PUT | `PUT /contabil/v1/lancamento` | Alteração lançamento contábil |
| DELETE | `DELETE /contabil/v1/lancamento` | Exclusão lançamento contábil |

---

### Transações

**Base path:** `/transacional/v1/transacoes`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /transacional/v1/transacoes` | Consulta transações |
| POST | `POST /transacional/v1/transacoes` | Gerar transações |

---

### Calcular Preço

**Base path:** `/venda/v1/calcular/preco`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /venda/v1/calcular/preco` | Calcula preço de venda |

---

### Unidade de Medida

**Base path:** `/material/v1/unidade_medida`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/unidade_medida` | Consulta unidades de medida |
| POST | `POST /material/v1/unidade_medida` | Cadastro unidade de medida |
| PUT | `PUT /material/v1/unidade_medida` | Alteração unidade de medida |
| DELETE | `DELETE /material/v1/unidade_medida` | Exclusão unidade de medida |

---

### Coleção

**Base path:** `/material/v1/colecao`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/colecao` | Consulta coleções |
| POST | `POST /material/v1/colecao` | Cadastro coleção |
| PUT | `PUT /material/v1/colecao` | Alteração coleção |
| DELETE | `DELETE /material/v1/colecao` | Exclusão coleção |

---

### Projeto

**Base path:** `/material/v1/projeto`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/projeto` | Consulta projetos |
| POST | `POST /material/v1/projeto` | Cadastro projeto |
| PUT | `PUT /material/v1/projeto` | Alteração projeto |
| DELETE | `DELETE /material/v1/projeto` | Exclusão projeto |

---

### Planejamento Industrial

**Base path:** `/industrial/v1/planejamento`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /industrial/v1/planejamento` | Consulta planejamento industrial |

---

### Baixa de Ordem de Confecção

**Base path:** `/industrial/v1/baixa/ordem_confeccao`

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `POST /industrial/v1/baixa/ordem_confeccao` | Baixa de ordem de confecção |

---

### Fila Máquina

**Base path:** `/industrial/v1/fila_maquina`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /industrial/v1/fila_maquina` | Consulta fila de máquina |

---

### Ordem Beneficiamento

**Base path:** `/industrial/v1/ordem_beneficiamento`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /industrial/v1/ordem_beneficiamento` | Consulta ordem de beneficiamento |

---

### Roteiro

**Base path:** `/industrial/v1/roteiro`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /industrial/v1/roteiro` | Consulta roteiro de produção |

---

### Tracking Pedido

**Base path:** `/venda/v1/tracking_pedido`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /venda/v1/tracking_pedido` | Consulta tracking do pedido |

---

### Sugestão de Rolos

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /material/v1/rolos_sugeridos` | Rolos sugeridos |
| GET | `GET /material/v1/status_sugestao` | Status da sugestão |
| POST | `POST /material/v1/sugerir_rolos` | Sugerir rolos |
| POST | `POST /material/v1/sugerir_rolos_dpv` | Sugerir rolos DPV |
| POST | `POST /material/v1/quebra_dpv` | Quebra DPV |
| POST | `POST /material/v1/alocar_sugestao` | Alocar sugestão |
| POST | `POST /material/v1/cancelar_sugestao` | Cancelar sugestão |

---

### Subscription (Webhook)

**Base path:** `/api/v1/subscription`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /api/v1/subscription` | Consulta subscrições ativas |
| POST | `POST /api/v1/subscription` | Criar subscrição (webhook) |
| DELETE | `DELETE /api/v1/subscription` | Cancelar subscrição |

**Uso:** Permite registrar webhooks para receber notificações de eventos do ERP.

---

### Representante Views

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /venda/v1/titulos_receber_representante` | Títulos a Receber por Representante |
| GET | `GET /venda/v1/carteira_pedidos_representante` | Carteira de Pedidos por Representante |

---

### Despesas / Adiantamentos / Prestação Contas

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `GET /financeiro/v1/adiantamentos` | Consulta adiantamentos |
| GET | `GET /financeiro/v1/despesas_cartao` | Consulta despesas cartão |
| GET | `GET /financeiro/v1/prestacao_contas` | Consulta prestação de contas |
| GET | `GET /financeiro/v1/reembolso` | Consulta reembolsos |
| GET | `GET /financeiro/v1/pagavel` | Consulta contas a pagar (visão) |
| GET | `GET /financeiro/v1/centros_custo` | Consulta centros de custo (visão) |
| GET | `GET /financeiro/v1/devolucao` | Consulta devoluções |

---

### Renegociação de Títulos

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `POST /financeiro/v1/renegociacao` | Renegociação de títulos |

---

## Códigos de Resposta

| Código | Descrição |
|--------|-----------|
| 201 | Sucesso na inclusão (retorna `sucesso_assincrono`) |
| 400 | Erro de validação de negócio |
| 401 | Não autorizado |
| 406 | Requisição não aceita (ex: mais de um item em request) |
| 409 | Conflito — envio já cadastrado |
| 413 | Request entity too large (ultrapassou limite de caracteres) |
| 500 | Erro de formatação/JSON/servidor |

---

## Filtros (q)

O parâmetro `q` nas requisições GET recebe um JSON codificado (RFC3986) para filtrar os resultados.

Exemplo de filtro:

```json
{
  "codigo_pedido": 12345
}
```

O JSON deve ser codificado como query string: `?q=%7B%22codigo_pedido%22%3A12345%7D`

---

## Exemplos

### Exemplo 1: Consultar pedidos de venda

```
GET https://api-cliente.systextilapps.com.br/venda/v1/pedido/venda?limit=10&offset=0
Authorization: Bearer <token>
```

### Exemplo 2: Cadastrar produto

```
POST https://api-cliente.systextilapps.com.br/material/v1/produto?sync=true
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "nivel_produto": "1",
      "grupo_id": "001",
      "subgrupo_id": "01",
      "item_estrutura_id": "000001",
      "descricao_produto": "CAMISETA MALHA ALGODÃO",
      "situacao_produto": 0,
      "classificacao_fiscal": "6109.10.00",
      "unidade_medida_id": "UN",
      "origem_produto": 1
    }
  ]
}
```

### Exemplo 3: Cadastrar pedido de venda

```
POST https://api-cliente.systextilapps.com.br/venda/v1/pedido/venda
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "codigo_pedido": 123456,
      "codigo_empresa_pedido": 1,
      "cnpj9_cliente": 123456789,
      "cnpj4_cliente": 1234,
      "cnpj2_cliente": 12,
      "nome_cliente": "CLIENTE EXEMPLO LTDA",
      "data_emissao": "2026-01-15T10:00:00.000Z",
      "tipo_pedido": 1,
      "tipo_peca_pedido": "1",
      "condicao_pagamento": 1,
      "itens_pedidos": [
        {
          "seq_item_pedido": 1,
          "grupo_id": "001",
          "item_id": "000001",
          "subgrupo_id": "01",
          "quantidade_pedida": 100,
          "valor_unitario": 29.90,
          "deposito_id": 1
        }
      ]
    }
  ]
}
```

### Exemplo 4: Cancelar pedido de venda

```
PUT https://api-cliente.systextilapps.com.br/venda/v1/pedido/123456/cancelar
Authorization: Bearer <token>
Content-Type: application/json

{
  "codigo_pedido": 123456,
  "itens_pedidos": [
    {
      "seq_item_pedido": 1,
      "cancelamento_item_id": 1
    }
  ]
}
```

---

> Fonte: [https://ajuda.systextil.com.br/api/systextil-apis.md](https://ajuda.systextil.com.br/api/systextil-apis.md)
> Documentação gerada em 14/07/2026
