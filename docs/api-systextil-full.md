# API Systêxtil Full — Referência Completa

> Documentação completa de todas as APIs disponíveis no ERP Systêxtil Cloud.
> Fonte: [https://ajuda.systextil.com.br/api](https://ajuda.systextil.com.br/api)
> Atualizado: Agosto 2026

---

## Visão Geral

A API Systêxtil é um conjunto de APIs RESTful disponíveis para clientes Cloud do ERP Systêxtil.

### Base URLs

| Ambiente | URL |
|---|---|
| QA (Qualidade) | `https://qa-api-{customerid}.systextilapps.com.br/` |
| Produção | `https://api-{customerid}.systextilapps.com.br/` |

Onde `{customerid}` é o identificador único do cliente.

### Autenticação

**OAuth2 Client Credentials** (Oracle Cloud IDCS):

```
POST https://idcs-03651be63851489595548b9127721fa1.identity.oraclecloud.com/oauth2/v1/token
Authorization: Basic Base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope={scope}
```

Scopes: `QAS`, `PRD`, `C0405:QA`, `C0405:PRD`

**Alternativa — APIKey:** `APIKey: {chave}` no header.

**Atenção (learned):** As credenciais OAuth2 devem ser enviadas via **Basic Auth header**, NÃO no body do POST.

### Padrões de Query Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `limit` | integer (1-100, default 20) | Quantidade máxima de itens |
| `offset` | integer (default 0) | Offset para paginação |
| `q` | string | Filtro dinâmico (FilterObject) |
| `sync` | boolean | true=síncrono, false=assíncrono |

### Códigos de Resposta HTTP

| Código | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Erro de validação |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 413 | Entidade muito grande (limit de caracteres) |
| 500 | Erro interno |

---

## Índice por Categoria

### Pessoas
- [Cliente](#cliente) — CRUD completo
- [Fornecedor](#fornecedor) — CRUD completo
- [Funcionário](#funcionario) — CRUD completo
- [Representante](#representante) — CRUD completo
- [Comprador](#comprador) — CRUD completo
- [Grupo Econômico](#grupo-econômico) — CRUD completo
- [Centro Custo](#centro-custo) — Leitura
- [Usuário Centro Custo](#usuário-centro-custo) — CRUD completo
- [Consulta Crédito](#consulta-crédito) — Leitura
- [Empresa](#empresa) — Leitura

### Compras
- [Requisição Compra](#requisição-compra) — CRUD + Cancelamento
- [Pedido Compra](#pedido-compra) — CRUD + Cancelamento
- [Grupo Comprador](#grupo-comprador) — CRUD completo
- [Forma Pagamento (Compra)](#forma-pagamento) — CRUD completo
- [Condição Pagamento (Compra)](#condição-pagamento) — CRUD completo
- [Motivo Cancelamento](#motivo-cancelamento) — CRUD completo

### Vendas
- [Pedido Venda](#pedido-venda) — CRUD + Cancelamento
- [Tabela Preço Venda](#tabela-preço-venda) — CRUD completo
- [Forma Pagamento (Venda)](#forma-pagamento-venda) — Leitura
- [Condição Pagamento (Venda)](#condição-pagamento-venda) — CRUD completo
- [Calcular Preço](#calcular-preço) — Leitura
- [Tracking Pedido](#tracking-pedido) — Leitura

### Materiais
- [Produto](#produto) — CRUD completo
- [Unidade de Medida](#unidade-de-medida) — CRUD completo
- [Coleção](#coleção) — CRUD completo
- [Projeto](#projeto) — CRUD completo
- [Estoque](#estoque) — Leitura
- [Movimento Estoque](#movimento-de-estoque) — Leitura + Criação
- [Requisição Estoque](#requisição-estoque) — CRUD completo
- [Depósito](#depósito) — Leitura

### Financeiro
- [Título a Pagar](#título-a-pagar) — CRUD completo
- [Título a Receber](#título-a-receber) — CRUD completo
- [Recebimento](#recebimento) — Criação

### Fiscal
- [Documento Saída](#documento-saída) — Leitura
- [Documento Entrada](#documento-entrada) — Leitura + Criação
- [XML NFE](#xml-nfe) — Leitura

### Contábil
- [Conta Contábil](#conta-contábil) — CRUD completo
- [Lançamento Contábil](#lançamento-contábil) — CRUD completo

### Industrial
- [Planejamento Industrial](#planejamento-industrial) — Leitura
- [Baixa de Ordem de Confecção](#baixa-de-ordem-de-confecção) — Criação
- [Fila Máquina](#fila-máquina) — Leitura
- [Ordem Beneficiamento](#ordem-beneficiamento) — Leitura
- [Roteiro](#roteiro) — Leitura

### CRM / Sugestão de Rolos
- [Sugerir Rolos](#sugerir-rolos) — Criação
- [Sugerir Rolos DPV](#sugerir-rolos-dpv) — Consulta + Criação
- [Alocar Sugestão](#alocar-sugestão) — Criação
- [Cancelar Sugestão](#cancelar-sugestão) — Criação
- [Rolos Sugeridos](#rolos-sugeridos) — Leitura
- [Status Sugestão](#status-sugestão) — Leitura
- [Quebra DPV](#quebra-dpv) — Leitura

### Representante
- [Titulos a Receber por Representante](#titulos-a-receber-por-representante) — Leitura
- [Carteira de Pedidos por Representante](#carteira-de-pedidos-por-representante) — Leitura

### Transacional
- [Transações](#transações) — Leitura + Criação

### Webhook
- [Subscription](#subscription-webhook) — CRUD completo

### PayTrack (Financeiro Avançado)
- [Adiantamentos](#adiantamentos) — Criação + Cancelamento
- [Despesas Cartão](#despesas-cartão) — Criação
- [Centros Custo (PayTrack)](#centros-custo-paytrack) — Leitura
- [Pagável](#pagável) — Leitura
- [Prestação Contas](#prestação-contas) — Criação
- [Reembolso](#reembolso) — Criação
- [Devolução](#devolução) — Criação

### Cobrança
- [Instruções Bancárias](#instruções-bancárias) — Consulta + Criação + Exclusão

### Renegociação
- [Renegociação de Títulos](#renegociação-de-títulos) — Consulta + Criação + Atualização + Exclusão

---

## Pessoas

### Cliente

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/cliente`

Cadastro de clientes com dados fiscais, endereços e contato.

**Schema principal:**

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_cliente | number | 9 | Código do cliente |
| cnpj_cpf | number | 14 | CNPJ/CPF |
| razao_social | varchar2 | 40 | Razão Social |
| nome_fantasia | varchar2 | 40 | Nome Fantasia |
| endereco | varchar2 | 40 | Endereço |
| bairro | varchar2 | 20 | Bairro |
| cep | number | 8 | CEP |
| cidade | varchar2 | 30 | Cidade |
| uf | varchar2 | 2 | UF |
| telefone | varchar2 | 15 | Telefone |
| email | varchar2 | 100 | E-mail |
| situacao | number | 1 | Situação (0=ativo, 1=inativo) |

---

### Fornecedor

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/fornecedor`

Cadastro de fornecedores.

**Schema principal:**

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_fornecedor | number | 9 | Código do fornecedor |
| cnpj_cpf | number | 14 | CNPJ/CPF |
| razao_social | varchar2 | 40 | Razão Social |
| nome_fantasia | varchar2 | 40 | Nome Fantasia |
| endereco | varchar2 | 40 | Endereço |
| bairro | varchar2 | 20 | Bairro |
| cep | number | 8 | CEP |
| cidade | varchar2 | 30 | Cidade |
| uf | varchar2 | 2 | UF |
| situacao | number | 1 | Situação |

---

### Funcionário

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/funcionario`

Cadastro de funcionários.

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_funcionario | number | 9 | Código |
| nome | varchar2 | 40 | Nome |
| cpf | number | 11 | CPF |
| departamento | varchar2 | 20 | Departamento |
| cargo | varchar2 | 20 | Cargo |
| situacao | number | 1 | Situação |

---

### Representante

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/representante`

Cadastro de representantes comerciais.

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_representante | number | 5 | Código |
| nome | varchar2 | 40 | Nome |
| cnpj_cpf | number | 14 | CNPJ/CPF |
| email | varchar2 | 100 | E-mail |
| telefone | varchar2 | 15 | Telefone |
| comissao | number | 5 | Percentual de comissão |
| situacao | number | 1 | Situação |

---

### Comprador

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/comprador`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_comprador | number | 5 | Código |
| nome | varchar2 | 40 | Nome |
| grupo_comprador | number | 5 | Grupo do comprador |

---

### Grupo Econômico

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/grupo_economico`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_grupo_economico | number | 5 | Código |
| descricao | varchar2 | 30 | Descrição |

---

### Centro Custo

**Endpoint:** `GET /pessoa/v1/centro_custo`

Apenas leitura.

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_centro_custo | number | 6 | Código |
| descricao | varchar2 | 20 | Descrição |

---

### Usuário Centro Custo

**Endpoint:** `GET/POST/PUT/DELETE /pessoa/v1/usuario_centrocusto`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_usuario | number | 9 | Código do usuário |
| codigo_centro_custo | number | 6 | Código do centro de custo |

---

### Consulta Crédito

**Endpoint:** `GET /pessoa/v1/consulta_credito`

Consulta de crédito do cliente.

---

### Empresa

**Endpoint:** `GET /pessoa/v1/empresa`

Dados da empresa logada.

---

## Compras

### Requisição Compra

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/requisicao/compra`
**Cancelamento:** `PUT /compra/v1/requisicao/{sequencia}/cancelar`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| sequencia_requisicao | number | 9 | Sequência |
| data_emissao | date | - | Data de emissão |
| codigo_comprador | number | 5 | Comprador |
| situacao | number | 1 | Situação |
| itens_requisicao_compra | array | - | Itens da requisição |

---

### Pedido Compra

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/pedido/compra`
**Cancelamento:** `PUT /compra/v1/pedido/{sequencia}/cancelar`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| sequencia_pedido | number | 9 | Sequência |
| codigo_fornecedor | number | 9 | Fornecedor |
| data_emissao | date | - | Data de emissão |
| condicao_pagamento | number | 3 | Condição de pagamento |
| forma_pagamento | number | 3 | Forma de pagamento |
| itens_pedido_compra | array | - | Itens do pedido |

---

### Grupo Comprador

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/grupo_comprador`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_grupo_comprador | number | 5 | Código |
| descricao | varchar2 | 20 | Descrição |

---

### Forma Pagamento (Compra)

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/forma/pagamento`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_forma_pagamento | number | 3 | Código |
| descricao | varchar2 | 20 | Descrição |

---

### Condição Pagamento (Compra)

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/condicao/pagamento`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_condicao_pagamento | number | 3 | Código |
| descricao | varchar2 | 30 | Descrição |
| parcelas | array | - | Parcelas (nº, dias, percentual) |

---

### Motivo Cancelamento

**Endpoint:** `GET/POST/PUT/DELETE /compra/v1/motivo/cancelamento`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_motivo | number | 3 | Código |
| descricao | varchar2 | 20 | Descrição |

---

## Vendas

### Pedido Venda

**Endpoint:** `GET/POST/PUT/DELETE /venda/v1/pedido/venda`
**Cancelamento:** `PUT /venda/v1/pedido/{codigo}/cancelar`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_pedido | number | 9 | Código do pedido |
| codigo_cliente | number | 9 | Cliente |
| data_emissao | date | - | Data de emissão |
| tipo_pedido | number | 1 | Tipo (1=Normal, 2=Troca, etc.) |
| condicao_pagamento | number | 3 | Condição de pagamento |
| representante | number | 5 | Representante |
| itens_pedido_venda | array | - | Itens do pedido |

**Exemplo de criação:**
```json
{
  "pedidos_vendas": [{
    "cnpj9_cliente": 12345678,
    "cnpj4_cliente": 1234,
    "cnpj2_cliente": 12,
    "nome_cliente": "CLIENTE EXEMPLO LTDA",
    "data_emissao": "2026-01-15T10:00:00.000Z",
    "tipo_pedido": 1,
    "tipo_peca_pedido": "1",
    "condicao_pagamento": 1,
    "itens_pedidos": [{
      "seq_item_pedido": 1,
      "grupo_id": "001",
      "item_id": "000001",
      "subgrupo_id": "01",
      "quantidade_pedida": 100,
      "valor_unitario": 29.90,
      "deposito_id": 1
    }]
  }]
}
```

---

### Tabela Preço Venda

**Endpoint:** `GET/POST/PUT/DELETE /venda/v1/tabela/preco`
**Consulta preço:** `GET /venda/v1/tabela/preco/consulta_preco`
**Item da tabela:** `GET /venda/v1/tabela/preco/item`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_tabela | number | 5 | Código da tabela |
| descricao | varchar2 | 30 | Descrição |
| moeda | varchar2 | 3 | Moeda (BRL, USD, etc.) |

---

### Forma Pagamento (Venda)

**Endpoint:** `GET /venda/v1/forma/pagamento`

Apenas leitura.

---

### Condição Pagamento (Venda)

**Endpoint:** `GET/POST/PUT/DELETE /venda/v1/condicao/pagamento`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_condicao_pagamento | number | 3 | Código |
| descricao | varchar2 | 30 | Descrição |

---

### Calcular Preço

**Endpoint:** `GET /venda/v1/calcular/preco`

Calcula preço baseado em regras de tabela.

---

### Tracking Pedido

**Endpoint:** `GET /venda/v1/pedido/{codigo_pedido}/tracking`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| codigo_pedido | number | 6 | Código do pedido |
| codigo_status | string | 1 | Status (1-10) |
| status_descricao | string | 100 | Descrição do status |
| data_ocorrencia | date-time | - | Data da ocorrência |
| tracking | string | 100 | Tracking agrupado |
| nota_fiscal | string | 40 | NF |

**Status possíveis:**
1. Pedido Recebido
2. Em Análise Financeiro
3. Aprovado Financeiro
4. Em Processo de Empenho
5. Geração de Romaneio para Separação
6. Liberado para Separação
7. Em Processo de Separação
8. Em Processo de Faturamento
9. Pedido Faturado
10. Saiu para Entrega

---

## Materiais

### Produto

**Endpoint:** `GET/POST/PUT/DELETE /material/v1/produto`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| grupo_id | varchar2 | 5 | Grupo |
| item_id | varchar2 | 6 | Item |
| subgrupo_id | varchar2 | 3 | Subgrupo |
| nivel_produto | varchar2 | 1 | Nível |
| descricao | varchar2 | 65 | Descrição |
| unidade_medida | varchar2 | 3 | Unidade |
| situacao | number | 1 | Situação |

---

### Unidade de Medida

**Endpoint:** `GET/POST/PUT/DELETE /material/v1/unidade_medida`

---

### Coleção

**Endpoint:** `GET/POST/PUT/DELETE /material/v1/colecao`

---

### Projeto

**Endpoint:** `GET/POST/PUT/DELETE /material/v1/projeto`

---

### Estoque

**Endpoint:** `GET /material/v1/estoque`

Apenas leitura. Retorna saldos por produto/depósito.

---

### Movimento Estoque

**Endpoint:** `GET/POST /material/v1/movimento/estoque`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| tipo_movimento | number | 1 | Tipo (1=Entrada, 2=Saída) |
| grupo_id | varchar2 | 5 | Grupo |
| item_id | varchar2 | 6 | Item |
| quantidade | number | 14 | Quantidade |
| deposito | number | 5 | Depósito |

---

### Requisição Estoque

**Endpoint:** `GET/POST/PUT/DELETE /material/v1/requisicao/estoque`

---

### Depósito

**Endpoint:** `GET /material/v1/deposito`

Apenas leitura.

---

## Financeiro

### Título a Pagar

**Endpoint:** `GET/POST/PUT/DELETE /financeiro/v1/titulo/pagar`

---

### Título a Receber

**Endpoint:** `GET/POST/PUT/DELETE /financeiro/v1/titulo/receber`

---

### Recebimento

**Endpoint:** `POST /financeiro/v1/recebimento`

---

## Fiscal

### Documento Saída

**Endpoint:** `GET /fiscal/v1/documento/saida`

Apenas leitura. Notas fiscais de saída.

---

### Documento Entrada

**Endpoint:** `GET/POST /fiscal/v1/documento/entrada`

Notas fiscais de entrada.

---

### XML NFE

**Endpoint:** `GET /fiscal/v1/xml_nfe`

Apenas leitura. XML das notas fiscais.

---

## Contábil

### Conta Contábil

**Endpoint:** `GET/POST/PUT/DELETE /contabil/v1/conta`

---

### Lançamento Contábil

**Endpoint:** `GET/POST/PUT/DELETE /contabil/v1/lancamento`

---

## Industrial

### Planejamento Industrial

**Endpoint:** `GET /industrial/v1/planejamento`

Apenas leitura.

---

### Baixa de Ordem de Confecção

**Endpoint:** `POST /industrial/v1/baixa/ordem_confeccao`

---

### Fila Máquina

**Endpoint:** `GET /industrial/v1/filamaquina`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| data_inicio | date | - | Data Início |
| data_termino | date | - | Data Término |
| estagio_id | number | 9 | Estágio |
| grupo_id | varchar2 | 5 | Grupo Produto |
| item_id | varchar2 | 6 | Item Produto |
| ordem_trabalho | number | 9 | Ordem Trabalho |
| quantidade | number | 14 | Quantidade |
| quantidade_produzida | number | 14 | Quantidade Produzida |
| recurso_id | varchar2 | 20 | Recurso |
| tempo_producao | number | 9 | Tempo Produção |

---

### Ordem Beneficiamento

**Endpoint:** `GET /industrial/v1/ordembeneficiamento`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| ordem_producao | number | 9 | Ordem Produção |
| estagio_id | number | 5 | Estágio |
| grupo_id | varchar2 | 5 | Grupo |
| item_estrutura_id | varchar2 | 6 | Item |
| situacao_ordem | number | 1 | Situação |
| quantidade_quilos_programados | number | 13 | Kg Programados |
| quantidade_rolos_programados | number | 10 | Rolos Programados |

---

### Roteiro

**Endpoint:** `GET /industrial/v1/roteiro`

| Campo | Tipo | Tamanho | Descrição |
|---|---|---|---|
| estagio_id | number | 5 | Estágio |
| grupo_id | varchar2 | 5 | Grupo |
| item_estrutura_id | varchar2 | 6 | Item |
| operacao_id | number | 5 | Operação |
| sequencia_operacao | number | 4 | Sequência |
| tempo_em_minutos | number | 9 | Tempo (min) |

---

## CRM / Sugestão de Rolos

### Sugerir Rolos

**Endpoint:** `POST /crm/v1/sugerir-rolos`

Realiza sugestão de rolos para um pedido.

**Request Body:**

| Campo | Tipo | Descrição |
|---|---|---|
| id_pedido_forca_vendas | varchar2 | ID do pedido |
| cnpj9 | number | Raiz CNPJ (9 dígitos) |
| cnpj4 | number | Ordem CNPJ (4 dígitos) |
| cnpj2 | number | DV CNPJ (2 dígitos) |
| produto | varchar2 | Código do produto |
| empresa | number | Empresa |
| quantidade | number | Quantidade |
| usuario | varchar2 | Usuário |
| qualidade | number | Qualidade |
| deposito | number | Depósito |

**Response:**

| Campo | Tipo | Descrição |
|---|---|---|
| id_pedido_forca_vendas | varchar2 | ID do pedido |
| id_crm | varchar2 | ID CRM |
| tipo_de_sugestao | varchar2 | Tipo da sugestão |
| tipo_do_pedido | varchar2 | Tipo do pedido |
| quantidade_em_estoque | number | Qtd em estoque |
| quantidade_disponivel | number | Qtd disponível |
| quantidade_sugerida | number | Qtd sugerida |
| quantidade_restante | number | Qtd restante |

---

### Sugerir Rolos DPV

**GET** — Consulta: `GET /crm/v1/sugerir-rolos-dpv`
**POST** — Sugestão: `POST /crm/v1/sugerir-rolos-dpv`

Realiza sugestão de rolos programados pelo DPV (Demanda Planejada de Vendas).

**Request Body (POST):** Mesmo da Sugerir Rolos + `data_inicio_periodo` e `data_fim_periodo`.

---

### Alocar Sugestão

**Endpoint:** `POST /crm/v1/alocar-sugestao`

Aloca os rolos sugeridos aos itens do pedido.

| Campo | Tipo | Descrição |
|---|---|---|
| id_crm | varchar2 | ID da sugestão |
| pedido_venda | number | Pedido de venda |
| seq_item_pedido | number | Sequência do item |
| usuario | varchar2 | Usuário |

---

### Cancelar Sugestão

**Endpoint:** `POST /crm/v1/cancelar-sugestao`

Cancela sugestão e retorna rolos ao estoque.

| Campo | Tipo | Descrição |
|---|---|---|
| id_pedido_forca_vendas | varchar2 | ID do pedido |
| produto | varchar2 | Código do produto (opcional — se omitido, cancela todos) |

---

### Rolos Sugeridos

**Endpoint:** `GET /crm/v1/rolos-sugeridos/{id_pedido_forca_vendas}`

Retorna todos os rolos de uma sugestão (id_crm, código_rolo, produto, metros, nuance, etc.).

---

### Status Sugestão

**Endpoint:** `GET /crm/v1/status-sugestao/{id_pedido_forca_vendas}`

Retorna status da sugestão (`{ "status_sugestao": "..." }`).

---

### Quebra DPV

**Endpoint:** `GET /crm/v1/quebra-dpv`

Consulta quebras de produção do DPV.

---

## Representante

### Titulos a Receber por Representante

**Endpoint:** `GET relatorio/v1/titulo/repres/{representante}/{grupo_economico}`

Retorna títulos a receber com dados de comissão, boleto PIX, linha digitável, etc.

---

### Carteira de Pedidos por Representante

**Endpoint:** `GET relatorio/v1/carteira/repres/{representante}`

Retorna carteira de pedidos do representante com saldos, situações, NFs, etc.

---

## Transacional

### Transações

**Endpoint:** `GET/POST /transacional/v1/transacoes`

---

## Webhook

### Subscription

**Endpoint:** `GET/POST/DELETE /api/v1/subscription`

Gerencia webhooks para notificações de eventos do ERP.

---

## PayTrack (Financeiro Avançado)

Base URL PayTrack: `https://{customerid}.systextilapps.com.br`

### Adiantamentos

**Criar:** `POST /v1/adiantamentos`
**Cancelar:** `PUT /v1/adiantamentos/cancelar`

Cria e cancela adiantamentos a fornecedor. Gera título no Contas a Pagar.

---

### Despesas Cartão

**Endpoint:** `POST /v1/pagavel/despesas`

Lança despesas de cartão corporativo ou cartão de viagens. Gera e liquida títulos por tipo de mão de obra.

---

### Centros Custo (PayTrack)

**Endpoint:** `GET /v1/centros-custo`

Retorna centros de custo ativos para uso na integração (com tipo de mão de obra: Auxiliar, Produtiva, Administrativa, Comercial).

---

### Pagável

**Endpoint:** `GET /v1/pagavel`

Consulta títulos gerados a partir de um adiantamento.

---

### Prestação Contas

**Endpoint:** `POST /v1/prestacao-contas`

Registra prestação de contas de adiantamento a fornecedor. Liquida o adiantamento com base nas despesas.

---

### Reembolso

**Endpoint:** `POST /v1/pagavel/reembolso`

Cria títulos de reembolso de despesas para fornecedor.

---

### Devolução

**Endpoint:** `POST /v1/devolucao`

Gera devolução do valor total de um adiantamento.

---

## Cobrança

### Instruções Bancárias

**Base URL:** `https://{customerid}.systextilapps.com.br`

**Consultar:** `GET /systextil-oauth2-api/cobr/instrucoes-bancarias`
**Cadastrar:** `POST /systextil-oauth2-api/cobr/instrucoes-bancarias`
**Excluir:** `DELETE /systextil-oauth2-api/cobr/instrucoes-bancarias`

Operações completas de instruções bancárias (protesto, prorrogação, liquidação, etc.).

---

## Renegociação de Títulos

**Base URL:** `https://{customerid}.systextilapps.com.br`

**Consultar:** `GET /systextil-oauth2-api/inte/renegociacao`
**Criar:** `POST /systextil-oauth2-api/inte/renegociacao`
**Atualizar/Cancelar:** `PUT /systextil-oauth2-api/inte/renegociacao`
**Excluir:** `DELETE /systextil-oauth2-api/inte/renegociacao`

Gerencia renegociações de títulos (situações: SIMULAÇÃO, EFETIVAÇÃO, CANCELADA).

---

## Resumo de Endpoints por Método HTTP

| Método | Quantidade | Exemplos |
|---|---|---|
| GET | ~40+ | Listagens, consultas, relatórios |
| POST | ~20+ | Criações, ações (cancelar, sugerir, alocar) |
| PUT | ~10+ | Atualizações, cancelamentos |
| DELETE | ~15+ | Exclusões |

**Total:** ~85+ endpoints documentados.

---

## Notas Técnicas

1. **Paginação:** Todos os endpoints GET suportam `limit` e `offset`
2. **Filtros:** Campo `q` aceita FilterObject para filtragem dinâmica
3. **Sync/Async:** Alguns endpoints suportam `sync=true|false`
4. **Content-Type:** `application/json` em todas as requisições
5. **Encoding:** UTF-8

---

## Referências

- Site oficial: [https://ajuda.systextil.com.br/api](https://ajuda.systextil.com.br/api)
- Índice completo (llms.txt): [https://ajuda.systextil.com.br/llms.txt](https://ajuda.systextil.com.br/llms.txt)
- API IPLM (integração existente): [docs/api-systextil-iplm.md](./api-systextil-iplm.md)
- Documentação legada do PDM: `systextil/api_doc.md`
