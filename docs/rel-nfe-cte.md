# Relatório NF-e → CT-e — Por Período

> Documento de referência com o SQL oficial.
> Lista **todas as NFs que possuem CT-e** dentro de um período, com razão social de
> transportadora, tomador e fornecedor, e o percentual de cada NF no total do CT-e.

**Arquivo do SQL pronto para o programador usar:**
[`docs/rel-nf-cte.sql`](./rel-nf-cte.sql) → **Select 3** (é a **v2**, com a correção dos
campos nulos described em [§13](#13-campos-nulos-diagnóstico-e-correção-v2))

> ⚠️ O SQL da §2 é a **v1** — é o que está publicado no endpoint hoje e é ele que
> devolve `NF_VALOR_TOTAL`, `SOMA_NF_DO_CTE` e os percentuais nulos. A correção está na
> §13 e no arquivo `.sql`. Não reimplemente a §2.

---

## 1. O que o relatório faz

| Entrada | Um período de datas (padrão: últimos 2 meses) |
|---|---|
| Saída | Uma linha por NF, repetindo os dados do CT-e e calculando o peso de cada NF dentro dele |
| Granularidade | NF-e, não CT-e |
| Parâmetros | Apenas o período. Sem outros filtros. |

Não existe "NF pesquisada" aqui — todas as linhas são resultado da consulta.

---

## 2. SQL oficial

```sql
/* ============================================================================
 *  RELATORIO: NFs com CT-e por periodo  (ultimos 2 meses, por padrao)
 *  Systextil  |  OBRF_016 + OBRF_010 + SUPR_010
 *
 *  Para rodar com outro periodo, troque as 2 datas marcadas no final.
 *  Para o endpoint, use os bind variables :DATA_INI / :DATA_FIM.
 * ========================================================================== */
SELECT
    /* ---------------- CT-e (repetido a cada linha) ---------------- */
    cte.DOCUMENTO                            AS CTE_NUMERO,
    cte.SERIE                                AS CTE_SERIE,
    TO_CHAR(cte.DATA_EMISSAO, 'DD/MM/YYYY')  AS CTE_DATA,
    cte.TOTAL_DOCTO                          AS CTE_VALOR_TOTAL,
    SUM(nfe.TOTAL_DOCTO) OVER (PARTITION BY cte.DOCUMENTO, cte.SERIE)
                                                 AS SOMA_NF_DO_CTE,
    ROUND(cte.TOTAL_DOCTO
          / NULLIF(SUM(nfe.TOTAL_DOCTO) OVER (PARTITION BY cte.DOCUMENTO, cte.SERIE), 0)
          * 100, 2)                            AS PCT_CTE_SOBRE_TOTAL_NFS,
    cte.VALOR_FRETE                          AS CTE_VALOR_FRETE,
    cte.SITUACAO_ENTRADA                     AS CTE_SITUACAO,
    transp.NOME_FORNECEDOR                   AS CTE_TRANSPORTADORA_RAZAO,
    transp.NOME_FANTASIA                     AS CTE_TRANSPORTADORA_FANTASIA,
    tomador.NOME_FORNECEDOR                  AS CTE_TOMADOR_RAZAO,
    tomador.NOME_FANTASIA                    AS CTE_TOMADOR_FANTASIA,

    /* ---------------- NFs ---------------- */
    nf.NUMERO_NOTA                           AS NF_NUMERO,
    nf.SERIE_NOTA                            AS NF_SERIE,
    TO_CHAR(nfe.DATA_EMISSAO, 'DD/MM/YYYY')  AS NF_DATA,
    nfe.TOTAL_DOCTO                          AS NF_VALOR_TOTAL,
    ROUND(nfe.TOTAL_DOCTO
          / NULLIF(SUM(nfe.TOTAL_DOCTO) OVER (PARTITION BY cte.DOCUMENTO, cte.SERIE), 0)
          * 100, 2)                          AS PCT_NF_NO_TOTAL_CTE,
    nfe.VALOR_FRETE                          AS NF_FRETE_RATEADO,
    nfe.SITUACAO_ENTRADA                     AS NF_SITUACAO,
    forn.NOME_FORNECEDOR                     AS NF_FORNECEDOR_RAZAO,
    forn.NOME_FANTASIA                       AS NF_FORNECEDOR_FANTASIA

FROM        OBRF_016 rel
JOIN        OBRF_010 cte
       ON   cte.DOCUMENTO     = rel.NUM_CONHECIMENTO
       AND cte.SERIE         = rel.SER_CONHECIMENTO
       AND cte.ESPECIE_DOCTO = 'CTE'
JOIN        OBRF_016 nf
       ON   nf.NUM_CONHECIMENTO = rel.NUM_CONHECIMENTO
       AND nf.SER_CONHECIMENTO = rel.SER_CONHECIMENTO
LEFT JOIN   OBRF_010 nfe
       ON   nfe.DOCUMENTO     = nf.NUMERO_NOTA
       AND nfe.SERIE         = nf.SERIE_NOTA
       AND nfe.CGC_CLI_FOR_9 = nf.FORNECEDOR9
       AND nfe.CGC_CLI_FOR_4 = nf.FORNECEDOR4
       AND nfe.CGC_CLI_FOR_2 = nf.FORNECEDOR2
LEFT JOIN   SUPR_010 transp
       ON   transp.FORNECEDOR9 = cte.TRANSPA_FORNE9
       AND transp.FORNECEDOR4 = cte.TRANSPA_FORNE4
       AND transp.FORNECEDOR2 = cte.TRANSPA_FORNE2
LEFT JOIN   SUPR_010 tomador
       ON   tomador.FORNECEDOR9 = cte.CGC_CLI_FOR_9
       AND tomador.FORNECEDOR4 = cte.CGC_CLI_FOR_4
       AND tomador.FORNECEDOR2 = cte.CGC_CLI_FOR_2
LEFT JOIN   SUPR_010 forn
       ON   forn.FORNECEDOR9 = nf.FORNECEDOR9
       AND forn.FORNECEDOR4 = nf.FORNECEDOR4
       AND forn.FORNECEDOR2 = nf.FORNECEDOR2
WHERE       COALESCE(nfe.DATA_EMISSAO, cte.DATA_EMISSAO) >= ADD_MONTHS(TRUNC(SYSDATE), -2)  -- <<< data inicial
  AND       COALESCE(nfe.DATA_EMISSAO, cte.DATA_EMISSAO) <  TRUNC(SYSDATE) + 1               -- <<< data final
ORDER BY    cte.DATA_EMISSAO DESC, cte.DOCUMENTO, cte.SERIE, nf.NUMERO_NOTA, nf.SERIE_NOTA;
```

---

## 3. Como trocar o período

Só as duas linhas do `WHERE` mudam.

| Objetivo | Código |
|---|---|
| Últimos 2 meses (padrão) | `>= ADD_MONTHS(TRUNC(SYSDATE), -2)` e `< TRUNC(SYSDATE) + 1` |
| Mês corrente | `>= TRUNC(SYSDATE, 'MM')` e `< TRUNC(SYSDATE) + 1` |
| Últimos 6 meses | `>= ADD_MONTHS(TRUNC(SYSDATE), -6)` e `< TRUNC(SYSDATE) + 1` |
| Datas fixas | `>= TO_DATE('01/08/2025','DD/MM/YYYY')` e `< TO_DATE('01/09/2025','DD/MM/YYYY')` |
| Via API | `:DATA_INI` e `:DATA_FIM` |

> **Use `ADD_MONTHS`, não subtração de dias.** `SYSDATE - 60` erra a contagem em meses de 28/29/31 dias.

> **O fim é `< data + 1`, nunca `<= data`.** O `DATA_EMISSAO` tem hora; com `<=` o dia
> informado seria cortado no meio da madrugada.

---

## 4. Qual data filtra o período

Filtra pela **data de emissão da NF**. Quando a NF não tem cabeçalho na `OBRF_010` (data nula),
o `COALESCE` usa a **data do CT-e** no lugar — assim nenhuma linha desaparece do relatório sem
aviso.

Para filtrar pela data do CT-e, substitua o `WHERE` por:

```sql
WHERE  cte.DATA_EMISSAO >= :DATA_INI
  AND  cte.DATA_EMISSAO <  :DATA_FIM + 1
```

---

## 5. Campos retornados

### CT-e

| Alias no SQL | Origem | Tipo | Significado |
|---|---|---|---|
| `CTE_NUMERO` | `OBRF_010.DOCUMENTO` | número | Número do CT-e |
| `CTE_SERIE` | `OBRF_010.SERIE` | texto(3) | Série do CT-e |
| `CTE_DATA` | `OBRF_010.DATA_EMISSAO` | `DD/MM/AAAA` | Emissão do CT-e |
| `CTE_VALOR_TOTAL` | `OBRF_010.TOTAL_DOCTO` | decimal(15,2) | Valor do CT-e (é o **frete**) |
| `SOMA_NF_DO_CTE` | calculada | decimal | Soma dos valores das NFs do CT-e |
| `PCT_CTE_SOBRE_TOTAL_NFS` | calculada | % | Frete ÷ soma das NFs × 100 |
| `CTE_VALOR_FRETE` | `OBRF_010.VALOR_FRETE` | decimal(15,2) | Valor do frete |
| `CTE_SITUACAO` | `OBRF_010.SITUACAO_ENTRADA` | inteiro | Situação (código, sem tabela de domínio) |
| `CTE_TRANSPORTADORA_RAZAO` | `SUPR_010.NOME_FORNECEDOR` | texto(60) | Razão social |
| `CTE_TRANSPORTADORA_FANTASIA` | `SUPR_010.NOME_FANTASIA` | texto(60) | Nome fantasia |
| `CTE_TOMADOR_RAZAO` | `SUPR_010.NOME_FORNECEDOR` | texto(60) | Razão social |
| `CTE_TOMADOR_FANTASIA` | `SUPR_010.NOME_FANTASIA` | texto(60) | Nome fantasia |

### NF-e

| Alias no SQL | Origem | Tipo | Significado |
|---|---|---|---|
| `NF_NUMERO` | `OBRF_016.NUMERO_NOTA` | número | Número da nota |
| `NF_SERIE` | `OBRF_016.SERIE_NOTA` | texto(3) | Série da nota |
| `NF_DATA` | `OBRF_010.DATA_EMISSAO` | `DD/MM/AAAA` | Emissão da NF |
| `NF_VALOR_TOTAL` | `OBRF_010.TOTAL_DOCTO` | decimal(15,2) | Valor total da nota |
| `PCT_NF_NO_TOTAL_CTE` | calculada | % | Peso desta NF no CT-e |
| `NF_FRETE_RATEADO` | `OBRF_010.VALOR_FRETE` | decimal(15,2) | Frete rateado na nota |
| `NF_SITUACAO` | `OBRF_010.SITUACAO_ENTRADA` | inteiro | Situação |
| `NF_FORNECEDOR_RAZAO` | `SUPR_010.NOME_FORNECEDOR` | texto(60) | Razão social |
| `NF_FORNECEDOR_FANTASIA` | `SUPR_010.NOME_FANTASIA` | texto(60) | Nome fantasia |

---

## 6. Como o relate funciona

### As quatro tabelas

```
OBRF_016  (relacionamento)      liga NF  <->  CT-e
OBRF_010  (documento)           CT-e e NF-e, com valores, datas e CNPJs
SUPR_010  (cadastro)            razão social e nome fantasia de qualquer terceiro
```

### Chaves

| O que | Onde |
|---|---|
| CT-e | `OBRF_016.NUM_CONHECIMENTO` + `SER_CONHECIMENTO` |
| NF-e | `OBRF_016.NUMERO_NOTA` + `SERIE_NOTA` |
| Terceiro | `OBRF_016.FORNECEDOR9/4/2` = `SUPR_010.FORNECEDOR9/4/2` |
| Transportadora | `OBRF_010.TRANSPA_FORNE9/4/2` |
| Tomador | `OBRF_010.CGC_CLI_FOR_9/4/2` |
| CNPJ da NF na `OBRF_010` | `CGC_CLI_FOR_9/4/2` |

### Os dois `OBRF_016`

O mesmo alias aparece duas vezes de propósito:

| Alias | Papel | Filtro |
|---|---|---|
| `rel` | linha que casa com o período | o `WHERE` filtra por aqui |
| `nf` | todas as NFs daquele mesmo CT-e | sem filtro — é o que traz as demais NFs |

É por aí que uma NF arrastada por `rel` traz **todas** as irmãs do CT-e. Sem esse segundo
acesso, o relatório devolveria uma linha por CT-e, e não uma linha por NF.

### Por que o CT-e precisa de `ESPECIE_DOCTO = 'CTE'`

A `OBRF_010` guarda NF-e, CT-e, orçamento e outros tipos no mesmo lugar. Sem o filtro, o mesmo
número e série poderia vir de outro tipo de documento e o valor total sairia errado.

---

## 7. Regras de negócio

1. **Uma NF pode aparecer em mais de um CT-e.** Existem 21 casos na base atual. Aparecem uma
   vez por CT-e, com o mesmo valor e as mesmas NFs irmãs. Isso é correto, não é duplicata.
2. **O mesmo número/série pode existir para fornecedores diferentes.** Por isso o join da NF
   compara o CNPJ (`CGC_CLI_FOR_9/4/2`) junto com documento e série. Sem isso, notas homônimas
   de fornecedores distintos se misturariam.
3. **`PCT_CTE_SOBRE_TOTAL_NFS` dá um número baixo porque `TOTAL_DOCTO` do CT-e é o frete**,
   não o valor da carga. No caso real, 5.028,12 de frete contra 83.751,08 de mercadoria = 6,00%.
   É o comportamento certo do dado.
4. **Nome pode vir `null`.** Se o CNPJ não estiver cadastrado na `SUPR_010`, os `LEFT JOIN`
   mantêm a linha e só o nome fica vazio.
5. **NF sem cabeçalho aparece com valores nulos.** O `LEFT JOIN` com a `OBRF_010` preserva a
   linha; nesse caso data, valor e situação ficam `null` e o período é avaliado pela data do CT-e.
6. **Os percentuais sempre fecham em 100% por CT-e** (arredondamento de centavos pode gerar
   99,99% ou 100,01%).

---

## 8. Resultado real de referência

Período validado com a NF 18814/1 (23/03/2024), extraído para conferir o formato:

```
CT-e  9949/1 · 23/03/2024 · 5.028,12 · soma NFs 83.751,08 · 6,00% do frete
      TRANSPORTES ANESI LTDA (ANESI TRANSPORTES) · tomador idem · situação 4
  ├── NF 18813/1 · 22/03/2024 · 20.737,52 · 24,76% · SEMEAR ECOTEXTIL LTDA (PGFIOS) · situação 4
  ├── NF 18814/1 · 22/03/2024 · 21.299,74 · 25,43% · SEMEAR ECOTEXTIL LTDA (PGFIOS) · situação 4
  └── NF 18815/1 · 22/03/2024 · 41.713,82 · 49,81% · SEMEAR ECOTEXTIL LTDA (PGFIOS) · situação 4
```

---

## 9. Desempenho

- Um único `SELECT`. Sem procedure, sem tabela temporária, sem CDUA.
- As funções de janela calculam a soma e os percentuais na mesma passada — **não** fazer uma
  segunda consulta para isso.
- `OBRF_016` tem 4.417 linhas e não tem índice em `DATA_EMISSAO`. Full scan é irrelevante
  nesse volume; só vale criar índice se a base chegar a milhões de linhas.
- **Paginação:** com 2 meses o volume cresce bastante. Se paginar em cima da query, os
  percentuais continuam sobre o total real do CT-e (a janela é calculada antes do corte) — que
  é o comportamento correto.
- Para o endpoint, logar sempre período, quantidade de linhas e tempo de execução.

---

## 10. Pendências

| # | Pendência | Impacto | Como resolver |
|---|---|---|---|
| 1 | **Razão social da empresa** | Não sai no relatório | A `OBRF_010` não tem coluna com "EMPRESA" nas 5 primeiras. Descobrir entre as colunas 6–25 e ligar em `FATU_500.CODIGO_EMPRESA` |
| 2 | Domínio do `SITUACAO_ENTRADA` | Sai o número cru | Falta localizar a tabela que traduz o código |
| 3 | CNPJ formatado no resultado | Não sai | O Select 1 de `rel-nf-cte.sql` monta o CNPJ com `LPAD` |

Consulta para resolver a pendência 1:

```sql
SELECT COLUMN_ID, COLUMN_NAME, DATA_LENGTH FROM ALL_TAB_COLUMNS
WHERE OWNER='SYSTEXTIL' AND TABLE_NAME='OBRF_010' AND COLUMN_ID BETWEEN 6 AND 25
ORDER BY COLUMN_ID;
```

---

## 11. Documentos relacionados

| Arquivo | Conteúdo |
|---|---|
| `docs/rel-nf-cte.sql` | Os 3 selects prontos para rodar (1 e 2 por NF, 3 por período) |
| `docs/rel-nf-cte-periodo.md` | **Este documento** |
| `docs/api-nf-cte.md` | Contrato do endpoint |
| `docs/plano-rel-nf-cte.md` | Como o modelo de dados foi descoberto |
| `docs/rel_cte_nfe.md` | Pedido original + prints da tela `OBRF_F275` |


retorno do endpoint:

{
  "items" :
  [
    {
      "CTE_NUMERO" : 195476,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 131.7,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35832,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195477,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35835,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195478,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35845,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195479,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 119.2,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35839,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "LS LOCAL SURF COMERCIO E CONFECCOES LTDA"
    },
    {
      "CTE_NUMERO" : 195480,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 165.56,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35843,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195481,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 74.89,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35827,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195482,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 116.03,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35833,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "SONOS COLCHOES LTDA",
      "NF_FORNECEDOR_FANTASIA" : "SONOS COLCHOES LTDA"
    },
    {
      "CTE_NUMERO" : 195483,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35837,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195484,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "18/09/2026",
      "CTE_VALOR_TOTAL" : 123.19,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35838,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195445,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "17/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35822,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "VAV COMERCIO DE ROUPAS EIRELI",
      "NF_FORNECEDOR_FANTASIA" : "VAV COMERCIO DE ROUPAS EIRELI"
    },
    {
      "CTE_NUMERO" : 195446,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "17/09/2026",
      "CTE_VALOR_TOTAL" : 200.45,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35820,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195447,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "17/09/2026",
      "CTE_VALOR_TOTAL" : 199.15,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35819,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195448,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "17/09/2026",
      "CTE_VALOR_TOTAL" : 315.25,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35818,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195449,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "17/09/2026",
      "CTE_VALOR_TOTAL" : 348.3,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35817,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195419,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "16/09/2026",
      "CTE_VALOR_TOTAL" : 251.82,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35812,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "EGL TEXTIL LTDA",
      "NF_FORNECEDOR_FANTASIA" : "EGL TEXTIL LTDA - GI"
    },
    {
      "CTE_NUMERO" : 195420,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "16/09/2026",
      "CTE_VALOR_TOTAL" : 241.3,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35813,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "EGL TEXTIL LTDA",
      "NF_FORNECEDOR_FANTASIA" : "EGL TEXTIL LTDA - GI"
    },
    {
      "CTE_NUMERO" : 195421,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "16/09/2026",
      "CTE_VALOR_TOTAL" : 377.28,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35814,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "EGL TEXTIL LTDA",
      "NF_FORNECEDOR_FANTASIA" : "EGL TEXTIL LTDA - GI"
    },
    {
      "CTE_NUMERO" : 195422,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "16/09/2026",
      "CTE_VALOR_TOTAL" : 74.89,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35816,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "E PEREIRA CARIOLANOME"
    },
    {
      "CTE_NUMERO" : 195423,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "16/09/2026",
      "CTE_VALOR_TOTAL" : 110.59,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35815,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195359,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "15/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35811,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195360,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "15/09/2026",
      "CTE_VALOR_TOTAL" : 144.89,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35810,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 11789,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "14/09/2026",
      "CTE_VALOR_TOTAL" : 1594.62,
      "SOMA_NF_DO_CTE" : 25290.67,
      "PCT_CTE_SOBRE_TOTAL_NFS" : 6.31,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "TRANSPORTES ANESI LTDA",
      "CTE_TRANSPORTADORA_FANTASIA" : "ANESI TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "TRANSPORTES ANESI LTDA",
      "CTE_TOMADOR_FANTASIA" : "ANESI TRANSPORTES",
      "NF_NUMERO" : 23479,
      "NF_SERIE" : "1",
      "NF_DATA" : "14/09/2026",
      "NF_VALOR_TOTAL" : 25290.67,
      "PCT_NF_NO_TOTAL_CTE" : 100,
      "NF_FRETE_RATEADO" : 0,
      "NF_SITUACAO" : 4,
      "NF_FORNECEDOR_RAZAO" : "SEMEAR ECOTEXTIL LTDA",
      "NF_FORNECEDOR_FANTASIA" : "PGFIOS"
    },
    {
      "CTE_NUMERO" : 195315,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "14/09/2026",
      "CTE_VALOR_TOTAL" : 127.05,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35808,
      "NF_SERIE" : "1",
      "NF_FORNECEDOR_RAZAO" : "A L INDUSTRIA E COMERCIO DE CONFECCOES L",
      "NF_FORNECEDOR_FANTASIA" : "LOJA ANTONY"
    },
    {
      "CTE_NUMERO" : 195316,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "14/09/2026",
      "CTE_VALOR_TOTAL" : 79.32,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35806,
      "NF_SERIE" : "1"
    },
    {
      "CTE_NUMERO" : 195317,
      "CTE_SERIE" : "1",
      "CTE_DATA" : "14/09/2026",
      "CTE_VALOR_TOTAL" : 171.48,
      "CTE_VALOR_FRETE" : 0,
      "CTE_SITUACAO" : 4,
      "CTE_TRANSPORTADORA_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TRANSPORTADORA_FANTASIA" : "SORRISO TRANSPORTES",
      "CTE_TOMADOR_RAZAO" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "CTE_TOMADOR_FANTASIA" : "SORRISO TRANSPORTES",
      "NF_NUMERO" : 35807,
      "NF_SERIE" : "1"
    }
  ]
}

---

## 12. Notas de implementação no PDM (Ferramentas › NF-e → CT-e por Período)

Tela: `src/app/(dashboard)/ferramentas/nfe-cte` · integração: `scripts/seed-integracao-cte.js`
(`tela = "nfe-cte"`), consumida pelo proxy genérico `/api/integracao/[id]/executar`.

### O endpoint ignora os parâmetros de período — o filtro é no cliente

Verificado contra a API real (`https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_rel_nfe_cte_periodo`).
Foram enviados 8 combinações de nomes (`data_ini`/`data_fim`, `dataInicio`/`dataFim`,
`data_inicio`/`data_fim`, `DATA_INI`/`DATA_FIM`, `de`/`ate`, `data_inicial`/`data_final`,
`dt_ini`/`dt_fim`, `p_data_ini`/`p_data_fim`) e **todas devolveram exatamente o mesmo
resultado** (208 linhas, os mesmos 202 CT-es, a mesma faixa de datas). Um parâmetro inválido
também não gera erro — o endpoint simplesmente ignora o que não reconhece.

Consequência: os `:DATA_INI`/`:DATA_FIM` do SQL (§2) **não estão expostos pela API**. O período
que a tela oferece é aplicado **no cliente**, em `components/utils.ts` (`filtrarPorPeriodo`),
usando o mesmo critério do SQL — `COALESCE(NF.DATA_EMISSAO, CT-e.DATA_EMISSAO)`.

Se a Systêxtil passar a aceitar o período, basta mandar as datas no `executar` e remover o
filtro do cliente; `filtrarPorPeriodo` pode continuar como rede de segurança.

### O endpoint devolve as chaves em minúsculas

O sample deste documento (`CTE_NUMERO`) está em maiúsculas, mas a API real responde
`cte_numero`, `nf_data`, `pct_nf_no_total_cte`… `normalizarLinha` reduz todas as chaves para
minúsculas na entrada, então as duas grafias funcionam.

### A API quase nunca devolve a soma e os percentuais

Em 208 linhas reais, `soma_nf_do_cte`, `pct_cte_sobre_total_nfs`, `pct_nf_no_total_cte`,
`nf_valor_total` e `nf_data` vieram preenchidos em **9 linhas**; `nf_fornecedor_razao` em 72. O motivo está em §6: o `LEFT JOIN` com a `OBRF_010` da NF-e só acha o cabeçalho quando o CNPJ
(`CGC_CLI_FOR_9/4/2`) bate com o fornecedor do relacionamento.

Por isso a tela **recalcula** a soma das NFs e o percentual do CT-e no cliente
(`agruparPorCte`) e rotula como `(calculada)` / `(calculado)` tudo o que não veio da API —
assim não se confunde valor do ERP com valor derivado.

> **v3.2 (2026-09-30):** o endpoint parou de calcular os campos derivados no banco. A v3.2
> simplificada (SELECT em `docs/rel-nf-cte.sql`) **removeu do SQL** as janelas `soma_nf_do_cte`,
> `soma_rateio_do_cte`, `pct_cte_sobre_total_nfs`, `pct_nf_no_total_cte`, `nf_pct_rateio_no_cte`
> e o `LISTAGG` das descrições (motivo: o console do Oracle estourava `ORA-06502` com volume —
> ver a diagnose em §21.2b) para isolar o culpado. A correção definitiva no PDM é o
> `calcularDerivadosPorCte` (em `components/utils.ts`), que recalcula NO CLIENTE exatamente as
> mesmas fórmulas do SQL (mesmo agrupamento por `cte_numero` + `cte_serie`, arredondamento de 2
> casas), só quando a API não devolveu o campo. Assim o valor exibido na tela e no CSV é o
> mesmo de antes — e `agruparPorCte` fica como rede de segurança para falha de normalização.

> Essas 9 linhas são um problema **do SQL do endpoint**, não da tela. A correção é a v2
> (§13). Depois que o endpoint for republicado, `agruparPorCte` deve continuar como rede de
> segurança, mas o valor exibido passa a ser o do ERP.

### A faixa padrão do endpoint é fixa no servidor

Sem parâmetros a API devolve de 01/08/2026 a 31/08/2026 (somente agosto no dia da verificação).
A tela aplica por cima o período escolhido, com padrão de **últimos 2 meses**, então o filtro
real tem alcance maior que o da API.

---

## 13. Campos nulos — diagnóstico e correção (v2)

Data: 2026-09-28 · SQL completo em [`docs/rel-nf-cte.sql`](./rel-nf-cte.sql)
· Diagnóstico reproduzível com `node scripts/diag-nfe-cte.js`

### 13.1 O que foi medido na API real

208 linhas, 202 CT-es (01/08/2026 a 31/08/2026):

| Campo | Preenchido | Nulo |
|---|---|---|
| `soma_nf_do_cte` | 9 | 199 |
| `pct_cte_sobre_total_nfs` | 9 | 199 |
| `pct_nf_no_total_cte` | 9 | 199 |
| `nf_data` | 9 | 199 |
| `nf_valor_total` | 9 | 199 |
| `nf_frete_rateado` | 9 | 199 |
| `nf_situacao` | 9 | 199 |
| `nf_fornecedor_razao` | 72 | 136 |
| `nf_fornecedor_fantasia` | 55 | 153 |

Tudo que vem do **CT-e** vem preenchido (`cte_numero`, `cte_data`, `cte_valor_total`,
`cte_situacao`, transportadora e tomador). Só morre o que depende do **cabeçalho da NF**.
Nenhum CT-e tem mistura (parte das NFs preenchida, parte não) — a quebra é por nota, não
por CT-e.

Distribuição: 166 dos 202 CT-es são da SORRISO, com 1 NF cada; 6 CT-es têm NF-e preenchida
(`11711`, `11757`, `11789`, `194350`, `194997`, `382006`).

### 13.2 Causa

A linha do `LEFT JOIN` da v1:

```sql
LEFT JOIN OBRF_010 nfe
   ON   nfe.CGC_CLI_FOR_9 = nf.FORNECEDOR9
    AND nfe.CGC_CLI_FOR_4 = nf.FORNECEDOR4
    AND nfe.CGC_CLI_FOR_2 = nf.FORNECEDOR2
```

`CGC_CLI_FOR_*` na `OBRF_010` é o código do **cliente (comprador)** da nota;
`OBRF_016.FORNECEDOR_*` é o **emissor**. Mesmo formato (9/4/2), coisas diferentes. O join
acerta só em nota de **entrada** — 9 de 208 linhas; em nota de **saída** (que é o caso da
SORRISO) o `ON` nunca casa.

Quando o `ON` não casa, o `LEFT JOIN` devolve `nfe` inteiro como nulo — e como
`SOMA_NF_DO_CTE`, `PCT_NF_NO_TOTAL_CTE` e `PCT_CTE_SOBRE_TOTAL_NFS` são calculados sobre
`nfe.TOTAL_DOCTO`, os percentuais morrem junto. **Uma única cláusula derruba 7 campos.**

Em paralelo, a razão social do cliente da NF não existia em nenhuma coluna: a v1 só
trazia o nome por `OBRF_016.FORNECEDOR_*` na `SUPR_010` (72/208), que é o emissor.

> Os 5 blocos de auditoria no fim do `.sql` confirmam em minutos se é isso mesmo
> (`SEM_CABECALHO` alto = o cabeçalho não existe na `OBRF_010`; `QTD_CAB > 0` com CNPJ
> diferente = é a chave).

### 13.3 O que a v2 faz

1. **CTE `cab`** — 1 linha por `(DOCUMENTO, SERIE)` da `OBRF_010`, preferindo espécie de
   NF. Por ser única na chave, os 3 `LEFT JOIN` não duplicam linhas.
2. **3 caminhos para o cabeçalho**, e o caminho usado sai em `NF_CAB_ORIGEM`:
   `CNPJ_FORNECEDOR` (nota de entrada) → `CNPJ_CLIENTE_NF` (nota de saída: o comprador da
   NF é o `CGC_CLI_FOR` do próprio CT-e) → `DOCUMENTO_SERIE` (último recurso) →
   `SEM_CABECALHO`.
3. **`NF_CLIENTE_RAZAO` / `NF_CLIENTE_FANTASIA`** — razão social do cliente, pelo CGC da
   própria nota. É o campo que faltava.
4. **Janelas calculadas sobre o total já resolvido** — `SOMA_NF_DO_CTE`,
   `PCT_NF_NO_TOTAL_CTE` e `PCT_CTE_SOBRE_TOTAL_NFS` passam a ser calculados fora da
   view interna, depois do `COALESCE`, e não antes.

### 13.4 Diff do payload

Novos: `NF_CLIENTE_RAZAO`, `NF_CLIENTE_FANTASIA`, `NF_CAB_ORIGEM`.
Tudo o mais mantém o nome — a tela (`components/types.ts`, `components/utils.ts`) não
quebra.

A tela já foi adaptada para a v2: `CAMPOS_TEXTO` lê os dois campos novos, a coluna da
tabela virou "Cliente" e usa `nomeClienteNf()` (fantasia do cliente → razão social do
cliente → fantasia do emissor → razão social do emissor), e o CSV ganhou "Cliente",
"Cliente (razão social)", "Fornecedor (emissor)" e "Origem do cabeçalho". Continua
funcionando com a v1 publicada, porque o fallback é o emissor.

---

## 14. Validação no Oracle (2026-09-28)

A v2 foi executada no console do ERP contra agosto/2026 e **rodou**. O que foi medido:

| NF | `NF_CAB_ORIGEM` | Antes (v1) | Depois (v2) |
|---|---|---|---|
| CT-e 194997 / NF 12600 | `CNPJ_FORNECEDOR` | linha completa | linha completa + `NF_CLIENTE_*` |
| CT-e 194912 / NF 35708 | `SEM_CABECALHO` | sem valor | sem valor |
| CT-e 194913 / NF 35697 | `SEM_CABECALHO` | sem valor | sem valor |

Duas conclusões:

1. **O caminho `CNPJ_FORNECEDOR` funciona** e traz `NF_CLIENTE_RAZAO`/`NF_CLIENTE_FANTASIA`
   (`PH TECNICA COMERCIO E REPRESENTACOES LTDA`) — o campo que o pedido pedia.
2. **`SEM_CABECALHO` não é problema de chave.** O terceiro caminho (`DOCUMENTO_SERIE`) não
   tem condição de CNPJ nenhuma, só `documento + série`; se ele não acha, é porque **não
   existe linha na `OBRF_010` para essas notas**. NFs 35708, 35697 e 35696 não têm
   cabeçalho fiscal na base — somar caminho SQL não resolve.

### 14.1 Versão definitiva do endpoint

É a query que rodou, com duas mudanças:

- **Sem bind variable.** O endpoint não recebe parâmetro: a janela é calculada no próprio
  SQL, de 2 meses atrás até hoje, com `ADD_MONTHS(TRUNC(SYSDATE), -2)` e
  `TRUNC(SYSDATE) + 1`. É o mesmo recorte que a tela usa por padrão (`periodoPadrao()` em
  `components/utils.ts`), então os dois batem.
- `NVL(nfs.especie_docto,'X') <> 'CTE'` no caminho `DOCUMENTO_SERIE`, para o último recurso
  nunca capturar o cabeçalho de um CT-e que por acaso tenha o mesmo número e série.

> Consequência: a tela **não consegue alargar** a janela além de 2 meses, só estreitar —
> os campos De/Até filtram o que o endpoint devolveu. Para um período maior, é preciso
  mudar a expressão do `WHERE` no SQL.

### 14.2 Versão definitiva do endpoint

É a query que rodou, com duas mudanças:

- **Sem bind variable.** O endpoint não recebe parâmetro: a janela é calculada no próprio
  SQL, de 2 meses atrás até hoje, com `ADD_MONTHS(TRUNC(SYSDATE), -2)` e
  `TRUNC(SYSDATE) + 1`. É o mesmo recorte que a tela usa por padrão (`periodoPadrao()` em
  `components/utils.ts`), então os dois batem.
- `UPPER(nfs.especie_docto) LIKE 'NF%'` no caminho `DOCUMENTO_SERIE`, para o último recurso
  nunca capturar um documento que não seja NF-e. O valor da espécie foi confirmado na base:
  a NF-e é `NFe` (o CT-e é `CTE`).

> Consequência: a tela **não consegue alargar** a janela além de 2 meses, só estreitar —
> os campos De/Até filtram o que o endpoint devolveu. Para um período maior, é preciso
> mudar a expressão do `WHERE` no SQL.

---

## 15. Causa raiz fechada: 188 NF-e previstas (2026-09-28)

Investigação completa, na ordem em que foi feita. Cada passo eliminou uma hipótese.

| # | Teste | Resultado | O que provou |
|---|---|---|---|
| 1 | NF 12600/1 e CT-e 194997 pelo `CNPJ_FORNECEDOR` | `7690,00` + `NF_CLIENTE_RAZAO` preenchida | o caminho 1 e o campo novo funcionam |
| 2 | Mesma NF pelo 3º caminho, só `documento + série` | `SEM_CABECALHO` | **não é problema de chave** — o 3º caminho não filtra CNPJ |
| 3 | `OBRF_010` na faixa `35600..35850` | `35607/1 NFe 315,06` de **16/06/2025** | a faixa 35xxx na base é numeração de **2025** |
| 4 | `OBRF_010` nos números exatos dos CT-es de 2026 | **vazio** | esses documentos não existem, em nenhuma série |
| 5 | Controle: 18813/18814/18815/1 e 12600/1 | `20.737,52` / `21.299,74` / `41.713,82` / `7.690,00`, todos `NFe` | a fonte e as fórmulas estão **certas** |
| 6 | Colunas de `OBRF_016` (17) | nenhuma é valor | a ponte CT-e↔NF não guarda valor |
| 7 | Laudo de vínculos quebrados | **188 linhas / 188 notas** | 93% dos CT-es do período apontam para NF-e inexistente |

**Conclusão:** `OBRF_010.TOTAL_DOCTO` continua sendo a única fonte do valor da NF-e, e ela
funciona. O que não existe são as **188 notas** que os CT-es de 28/07 a 28/09/2026
declaram. Não é bug de SQL, nem de join, nem de cadastro do usuário: os documentos não
estão gravados no módulo fiscal.

Hipótese mais provável: são **notas previstas** — o CT-e foi criado com o vínculo da NF-e
antes de a nota ser emitida. As 14 NFs que funcionam (12600, faixa 23xxx, março/2024) são
notas de verdade.

### 15.1 O que fazer

**Com o ERP/Systêxtil** — esse é o texto do chamado:

> Nos CT-e de 28/07/2026 a 28/09/2026, 188 dos 202 CT-es têm o vínculo de NF-e
> (`OBRF_016.NUMERO_NOTA`) apontando para documento inexistente na `OBRF_010` (espécie
> `NFe`). Os números ficam na faixa 35xxx, que na base é numeração de 2025 — exemplo:
> `35607/1 NFe 16/06/2025`. Nenhuma dessas 188 notas tem cabeçalho, então valor, data e
> cliente não existem para consulta. Suspeita: são notas previstas no CT-e, não emitidas.
> Confirmar se devem ser emitidas ou se o vínculo está gravado errado.

Para reproduzir e medir de novo:

```sql
SELECT COUNT(*) AS linhas_sem_cabecalho, COUNT(DISTINCT nf.numero_nota) AS notas_inexistentes
  FROM obrf_016 nf
  LEFT JOIN obrf_010 nfe
    ON nfe.documento = nf.numero_nota AND nfe.serie = nf.serie_nota
 WHERE nfe.documento IS NULL
   AND EXISTS (SELECT 1 FROM obrf_010 cte
                WHERE cte.documento = nf.num_conhecimento
                  AND cte.serie     = nf.ser_conhecimento
                  AND cte.especie_docto = 'CTE'
                  AND cte.data_emissao >= ADD_MONTHS(TRUNC(SYSDATE), -2))
```

**Na tela** — o relatório passou a distinguir "sem valor" de "não existe". Como o payload
traz `NF_CAB_ORIGEM`, não precisa de mudança no SQL:

- badge **prevista** na linha da NF-e quando `NF_CAB_ORIGEM = 'SEM_CABECALHO'`;
- aviso no rodapé do card: *"NF-e não localizada no fiscal: o CT-e aponta para nota
  prevista, sem valor e sem data."*;
- contador no resumo: *"N NF-e não localizadas no fiscal"*;
- `NF_CAB_ORIGEM` já sai no CSV, na coluna *"Origem do cabeçalho"*.

Conforme o ERP for emitindo as notas previstas, o relatório passa a preencher sozinho —
o SQL já está publicado com os 3 caminhos e o `COALESCE`.

---

## 16. SQL publicado: 2 bugs achados no payload (2026-09-28/29)

O SQL foi publicado e responde `200`. Fui medir o payload de verdade em vez de confiar no
"rodou" — e achei dois defeitos que nenhum teste de console detectaria, porque os dois só
aparecem no resultado, não no erro.

### 16.1 Bug 1 — auto-join gerava linha duplicada e percentual errado

`rel` e `nf` são a **mesma tabela** (`OBRF_016`) e as duas se ligavam pelo mesmo
conhecimento. Isso é produto cartesiano: um CT-e com 2 NFs produz 2×2 = 4 linhas.

Medido no endpoint publicado:

| CT-e | NFs no CT-e | Linhas no payload | `%` de cada NF |
|---|---|---|---|
| 11757/1 | 2 (23391, 23392) | **4** | 22,06% e 27,94% |
| 351348/1 | 2 (31933, 35653) | **4** | — |
| todas as outras (189) | 1 | 1 | correto |

O detalhe que quase escapou: a soma dos percentuais do CT-e 11757 dava **100%** e parecia
tudo certo. O que estava errado era o valor de cada NF — 23391 real é 44,12%
(28.605,27 / 64.832,93), não 22,06%. Como cada NF entrava duas vezes na janela
`SUM(...) OVER (PARTITION BY ...)`, o denominador dobrava e todo percentual saía pela
metade. **`SOMA_NF_DO_CTE` também saía dobrado.** CT-es com 1 NF não eram afetados — por
isso o bug passou.

**Correção:** remover `rel`. Ele não filtrava nada; a ligação CT-e→NF já vem em `nf`.

### 16.2 Bug 2 — fallback por documento+série casou nota de 3 anos

O último recurso (`DOCUMENTO_SERIE`, sem CNPJ) não tem condição de vínculo nenhuma. Amarrou:

```
CT-e 156277/1  01/08/2023  x  NF 28490/1  03/09/2026   = +1129 dias
```

A linha entrou no relatório porque o `WHERE` filtra por `COALESCE(nf_data, cte_data)`, e
`nf_data` era recente — a data do CT-e de 2023 não filtrava nada.

**Correção:** trava de data no fallback — a NF-e precisa estar entre **-60 e +180 dias**
do CT-e. Os 9 acertos por CNPJ estão todos entre -5 e 0 dias, então só o caminho sem CNPJ
precisava da trava. A janela é larga de propósito: pega NF emitida antes ou depois do
CT-e, e barra o caso de 3 anos.

### 16.3 v2.1 publicada e verificada no payload (29/09/2026)

Republicado e medido. **Os dois bugs estão corrigidos** — as 9 conferências passaram:

| # | Conferência | v2.0 | v2.1 |
|---|---|---|---|
| 1 | Pares CT-e/NF duplicados | 4 | **0** |
| 2 | CT-es com soma de pct ≠ 100% | 0 (mas por acidente) | **0** (com pct certo) |
| 3 | Linhas com NF-e > 45 dias do CT-e | 1 (o de 2023) | **0** |
| 4 | CT-e 11757/1 | 4 linhas, 22,06% / 27,94% | **2 linhas, 44,12% / 55,88%** |
| 5 | `SOMA_NF_DO_CTE` do 11757 | 129.665,86 (dobrado) | **64.832,93** (bate com a soma manual) |
| 6 | CT-e 156277/1 (2023) | casado com NF de 2026 | **saiu do relatório** |
| 7 | `DOCUMENTO_SERIE` | 1 (falso positivo) | **0** |
| 8 | Colunas / campos novos | 24 | **24**, os 3 presentes |
| 9 | Janela | — | 29/07/2026 a 18/09/2026 (2 meses, correta) |

As 7 NFs com valor, todas resolvidas por `CNPJ_FORNECEDOR` e com cliente:

| CT-e | NF-e | Valor | % | Cliente |
|---|---|---|---|---|
| 11789/1 | 23479/1 | 25.290,67 | 100% | PGFIOS |
| 194997/1 | 12600/1 | 7.690,00 | 100% | PH TECNICA |
| 382006/2 | 20184/1 | 3.024,82 | 100% | KING KOMFORT |
| 11757/1 | 23391/1 | 28.605,27 | **44,12%** | PGFIOS |
| 11757/1 | 23392/1 | 36.227,66 | **55,88%** | PGFIOS |
| 194350/1 | 20762/1 | 395,00 | 100% | CHEMICALS UNIVERSAL |
| 11711/1 | 23282/1 | 15.249,49 | 100% | PGFIOS |

Os 44,12% / 55,88% foram conferidos à mão contra o payload: 28.605,27 / 64.832,93.

#### 16.3.1 Por que 201 linhas e não as 193 que eu previ

Previ 193 e o endpoint devolveu **201**. A previsão estava errada — e o erro é
instruativo, porque mostra o quanto o bug 2 contaminava a contagem.

O filtro de período é `COALESCE(nf_data, cte_data)`. Na v2.0 o fallback sem trava
amarrava NFs erradas, e a data falso-entrada decideva se a linha entrava:

- NF casada por engano com data **recente** → trazia um CT-e antigo para o relatório;
- NF casada por engano com data **antiga** → excluía um CT-e novo que deveria estar lá.

Ou seja, a v2.0 não era um superconjunto da v2.1: o fallback estava **empurrando e
puxando** linhas nos dois sentidos. Por isso "197 − 4 duplicadas" não podia ser a conta.
A v2.1 não é mais linhas por erro — é a contagem limpa de 201 vínculos (CT-e, NF-e) na
janela, e ela fecha: 199 CT-es distintos, sendo 2 com 2 NFs cada (11757/1 e 351348/1),
201 no total, zero repetida, zero linha sem `nf_numero`.

> **Regra que daqui pra frente:** não Razão de contagem de linha. As conferências que
> valem são as de 1 a 6 acima — duplicata, soma de 100%, distância de data, e a conferência
> à mão de um caso com mais de uma NF-e.

> **Nota sobre `DOCUMENTO_SERIE`:** com a trava de data ele dá 0 acertos nos dados atuais.
> Mantido como rede de segurança para NF-e com CNPJ divergente do cadastro. Se preferirem
> remover de vez, é apagar o `LEFT JOIN obrf_010 nfs`, as entradas `nfs.` dos três
> `COALESCE` e o rótulo `DOCUMENTO_SERIE` do `CASE` — o relatório passa a ter só os 2
> caminhos por CNPJ, que são os que funcionam.

### 16.4 Lição de processo

O SQL "rodou" e o payload "veio com 24 colunas". Nenhuma das duas coisas diz que os
números estão certos — e a v2.0 rodou, veio com as 24 colunas, e estava com 4 linhas
duplicadas, percentual pela metade e uma NF-e de 3 anos no relatório. O que pegou os
dois bugs foi comparar o resultado com o documento: `23391 + 23392` tem que fechar em
100%, e nenhum par CT-e/NF pode se repetir. **Rode essa conferência toda publicação,
não só o teste de erro.**

---

## 17. v3.0 — itens e rateio por NF (29/09/2026)

O relatório não trazia os dados da NF porque só lia cabeçalho (`OBRF_010`) e o índice
CT-e↔NF (`OBRF_016`). Os **itens/rateio estão em `OBRF_015`**, que tem as duas pontas:
`CAPA_ENT_NRDOC`/`CAPA_ENT_SERIE` (CT-e) e `NUM_NF_SAIDA`/`SERIE_NF_SAIDA` (NF).

A tela do ERP "Importação de XML de CT-e" mostrou o caminho. O CT-e 195477 tem
`TOTAL_DOCTO` 79,32, um item de 79,32 com base ICMS 79,32 e valor ICMS 9,52, e o item
aponta `Nota fiscal: 35835 1`. O endpoint devolve exatamente 79,32 e 9,52 para o
CT-e 195477 / NF 35835. Bate com a tela campo a campo.

### 17.1 Como entra, e por que não quebra a matemática

`OBRF_015` entra por **subquery agregada**, não por `LEFT JOIN` cru:

```sql
LEFT JOIN (SELECT i.capa_ent_nrdoc, i.capa_ent_serie, i.num_nf_saida, i.serie_nf_saida,
                  COUNT(*) AS item_qtd, SUM(i.quantidade) AS item_qtd_total,
                  MAX(i.unidade_medida) AS item_unidade,
                  LISTAGG(SUBSTR(i.descricao_item, 1, 60), ' | ')
                    WITHIN GROUP (ORDER BY i.sequencia) AS item_descricoes,
                  SUM(i.valor_total) AS item_valor_total, SUM(i.valor_icms) AS item_icms
             FROM obrf_015 i
            WHERE i.num_nf_saida IS NOT NULL
            GROUP BY i.capa_ent_nrdoc, i.capa_ent_serie, i.num_nf_saida, i.serie_nf_saida) it
```

Agrupar pela chave CT-e+NF devolve **no máximo uma linha por par**, então o join de
itens não multiplica nada — que era exatamente o bug da v2.0. Verificado: 201 linhas
antes e depois, zero par repetido.

`WITH` não foi usado porque o console do ERP recusa. Subquery no `FROM` é aceito.

### 17.2 Valor de nota e valor de rateio, separados de propósito

`VALOR_TOTAL` do item é a **cota de frete rateada no CT-e**, não o total da nota fiscal.
Quando o CT-e tem 1 item e 1 NF os dois números coincidem — foi o que me enganou na
primeira leitura da tela. Num CT-e com 2 NFs, o rateio diz quanto do frete coube a cada
nota. Por isso `NF_VALOR_TOTAL` continua sendo **só** o do cabeçalho, e o rateio vem em
colunas próprias, com a procedência declarada:

| `NF_VALOR_ORIGEM` | Significado | Linhas |
|---|---|---|
| `CABECALHO_NF` | valor da nota veio de `OBRF_010` | 7 |
| `RATEIO_CTE` | só existe a cota de frete, no `OBRF_015` | 194 |
| `SEM_VALOR` | nem um nem outro | **0** |

Misturar os dois no mesmo campo quebraria o `PCT_NF_NO_TOTAL_CTE`, que passaria a somar
total de nota com cota de frete.

### 17.3 Verificação do payload publicado (201 linhas, 38 colunas)

| # | Conferência | Resultado |
|---|---|---|
| 1 | Pares CT-e/NF duplicados | **0** (o join de itens não multiplicou) |
| 2 | Linhas sem valor de nenhum tipo | **0** (era 194) |
| 3 | Soma dos `PCT_NF_NO_TOTAL_CTE` = 100% por CT-e | **OK** |
| 4 | Soma do `NF_PCT_RATEIO_NO_CTE` = 100% por CT-e | 198 de 199 |
| 5 | Soma do rateio = total do CT-e | 198 de 199 |
| 6 | NF-e a mais de 45 dias do CT-e | **0** |
| 7 | Taxa por NF, CT-e 11757/1 | 44,12% / 55,88% |

**A prova de que o rateio é confiável:** no CT-e 11757/1 o rateio por NF deu 44,12% e
55,88% — o mesmo split do valor das notas (28.605,27 e 36.227,66 sobre 64.832,93). Dois
caminhos independentes, um pelo rateio de frete e outro pelos totais de nota, chegando
no mesmo lugar.

Totais do período: rateio R$ 50.475,85, ICMS de item R$ 5.798,16, soma dos CT-es
R$ 49.758,50.

### 17.4 Dado inconsistente no ERP: CT-e 351348/1

Único ponto do período em que o rateio não fecha. Vale 458,69% do CT-e:

| NF | Rateio | % do CT-e |
|---|---|---|
| 31933/1 | R$ 717,35 | 358,69% |
| 35653/1 | R$ 199,99 | 100,00% |

O item da NF 31933 carrega 717,35 enquanto o `TOTAL_DOCTO` do CT-e é 199,99. A diferença
de todo o período é **exatamente 717,35** — ou seja, fora esse CT-e, os 198 restantes
fecham ao centavo. Não é erro do SQL: é o CT-e com o total do cabeçalho inconsistente
com o rateio dos itens, ou com item de NF que não entrou no total. Para confirmar:

```sql
SELECT capa_ent_nrdoc, capa_ent_serie, sequencia, num_nf_saida, serie_nf_saida,
       descricao_item, quantidade, valor_total, valor_icms
  FROM obrf_015
 WHERE capa_ent_nrdoc = 351348 AND capa_ent_serie = '1'
 ORDER BY sequencia;

SELECT documento, serie, especie_docto, total_docto, data_emissao
  FROM obrf_010
 WHERE documento = 351348;
```

Se os itens somarem 917,34 e o cabeçalho estiver 199,99, é inconsistência de cadastro no
ERP e entra no mesmo chamado da seção 15.1.

> **Não capei o valor no total do CT-e de propósito.** Se o rateio passa do total do
> CT-e, o certo é o dado aparecer e a divergência ficar visível — `SOMA_RATEIO_DO_CTE`
> ao lado de `CTE_VALOR_TOTAL` já mostra a conta. Arredondar ou limitar seria inventar
> número.

---

## 18. Tela: terceiro nível, CT-e → NF-e → item (29/09/2026)

Com o v3 publicado, a tela `Ferramentas > NF-e → CT-e por Período` passou a mostrar o
rateio. Antes disso ela ignorava as 14 colunas novas — e o motivo é um detalhe do
`normalizarLinha` que vale registrar:

> **Coluna nova no endpoint que não entrar em `CAMPOS_NUMERICOS`/`CAMPOS_TEXTO` some da
> tela sem erro nenhum.** Não dá erro de tipo, não dá warning, não quebra teste com
> payload minúsculo — porque o `normalizarLinha` só joga na tela o que está na
> whitelist. Foi exatamente o que aconteceu com os 3 campos do v2, e o teste que
> pegou isso foi o que mandava os aliases em **MAIÚSCULO**, como o endpoint real
> responde. Todo campo novo do endpoint precisa de teste em maiúsculo junto.

O que mudou:

| Onde | Antes | Agora |
|---|---|---|
| Card do CT-e | frete, soma das NFs, % das NFs | + rateio dos itens, data de transação, aviso de rateio divergente |
| Linha da NF-e | valor da nota, % no CT-e | + coluna **Rateio** com o valor e o % do CT-e |
| 3º nível | não existia | clique na NF-e abre os itens: descrição, quantidade, rateio e ICMS |
| Resumo | 4 cards | 5 cards, com **Rateio dos itens** no lugar do "Total do frete" (renomeado para "Total dos CT-es", que é o que ele sempre somou) |
| CSV | 17 colunas | 31 colunas, com origem do valor, itens, rateio e dados da capa |

Três decisões que não são óbvias:

1. **`NF_VALOR_TOTAL` continua vazio na NF prevista.** O rateio aparece em coluna
   própria, ao lado. Se eu preenchesse o valor da nota com a cota de frete, o
   `PCT_NF_NO_TOTAL_CTE` passaria a somar total de nota com cota de frete e não
   significaria nada — e o usuário não distinguiria "nota de 79,32" de "frete de
   79,32" no contexto de um CT-e.
2. **A nota prevista ganhou aviso de que o valor vem do rateio.** O texto do rodapé
   do CT-e passou a dizer isso, porque "79,32 numa NF-e que não existe no fiscal" sem
   explicação parece bug.
3. **Rateio divergente é sinalizado, não corrigido.** Badge "rateio não fecha" no card
   e contador no cabeçalho. Cortar o valor no total do CT-e esconderia o problema de
   cadastro que a seção 17.4 documenta.

Testes: 68 unitários em `utils.test.ts` (whitelist do v3, `nfTemRateio`,
`descricoesItem`, `rateioFechaComCte`, agrupamento e resumo) e 27 de página em
`page.test.tsx` (abrir itens, descrições agregadas virarem linhas, cota na linha da NF,
badge de divergência, aviso da prevista, CSV). Suíte completa: 1756 testes, 305
arquivos, verde.

---

## 19. Integração separada: Ordem de Despacho (29/09/2026)

### O que é

A seção 15 fechou a causa das NFs previstas (o CT-e aponta para nota que não existe
no fiscal), mas deixou aberta a pergunta prática: **onde estariam essas NFs, se não no
`OBRF_010`?** A resposta do ERP foi a **ordem de despacho** — é lá que ficam as notas
fiscais vinculadas a cada pedido.

- endpoint: `api_ordem_despacho`
- integração no PDM: tela `"ordem-despacho"`, seed `scripts/seed-integracao-ordem-despacho.js`
- URL: `https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_ordem_despacho`

### O que o endpoint devolve

Uma linha por **pedido × NF**, cruzando três views:

| View | Papel |
|---|---|
| `PMDVW_VENDAS` | dados do pedido (cliente, região, representante, tipo de frete, transportadora, redespacho) |
| `PMDVW_NFS` | as NFs do pedido — só `ENTRADA_SAIDA = 'Saida'`, `FATURAMENTO_SIM_NAO = 'Sim'`, `CFOP != '0'` |
| `PMDVW_ROLOS` | romaneio mais recente com `SITUACAO = 'Fora do estoque'` (qtde de rolos, quantidade, peso bruto/líquido) |

31 campos no retorno. A chave da NF vem no formato **`numero-serie`** (`"14-99"`,
`"26759-1"`), não em colunas separadas — detalhe que importa ao cruzar com o CT-e, onde
`NF_NUMERO`/`NF_SERIE` vêm separados. `CNPJ_TRANS`/`CNPJ_REDESP` são textuais (`"0/0-0"`
quando é `PROPRIO`).

### Estado

| Banco | id | telas |
|---|---|---|
| pdm_textil | 8 | `["ordem-despacho"]` |
| pdm_pro_textil | 1 | `["ordem-despacho"]` |
| pdm_ibirapuera | 1 | `["ordem-despacho"]` |
| neon | 7 | `["ordem-despacho"]` |

Verificada na API (token + `HTTP 200`, 100 registros) nos 4 bancos.

### Pendente (o "depois" combinado)

**Compor o SELECT do CT-e com o das NFs.** Hoje o relatório procura a NF de três
formas dentro do fiscal (`CNPJ_FORNECEDOR`, `CNPJ_CLIENTE_NF`, `DOCUMENTO_SERIE`) e,
quando não acha, marca `SEM_CABECALHO`. A ideia é usar a ordem de despacho como mais
uma fonte, para as NFs que existem no despacho mas não no fiscal. O endpoint já está
registrado e testado; falta o SQL do CT-e passar a consultá-lo.

### Efeitos colaterais deste trabalho

1. **5 integrações do neon estavam mortas e foram corrigidas.** Elas usavam o caminho
   `/apexbd/systextil/`, que responde **404** — tanto no `token_url` quanto no
   `base_url`. Sem token nenhum proxy consegue chamar nada: a integração aparecia
   ativa no banco e não funcionava. O caminho válido é `/apexbd/erp/` (**200** em
   token e endpoint). `scripts/fix-neon-systextil-urls.js` reescreve os dois campos,
   depois de confirmar que a URL nova responde — e só grava o que ainda aponta para
   o caminho morto (idempotente, roda nos 4 bancos).

   | neon | integração | antes | agora |
   |---|---|---|---|
   | 1 | `api_systextil_get_romaneios_pdm` | `systextil` | `erp` |
   | 2 | `api_systextil_get_clientes_pdm` | `systextil` | `erp` |
   | 3 | `api_listagem_clientes_ativos_com_representantes` | `systextil` | `erp` |
   | 4 | `api_email_clientes_ativos_com_representante` | `systextil` | `erp` |
   | 5 | `api_systextil_get_romaneios_pdm_rec_corte` | `systextil` | `erp` |
   | 6 | `api_rel_nfe_cte_periodo` | token `systextil` | `erp` |
   | 7 | `api_ordem_despacho` | (nova, já `erp`) | `erp` |

   As 7 do neon respondem **HTTP 200** hoje. Nos outros 3 bancos não havia nenhuma
   integração no caminho morto.
2. **A integração do CT-e passou a existir também em `pdm_pro_textil` (id 2) e
   `pdm_ibirapuera` (id 2)**, que antes não a tinham.
3. **`scripts/lib/seed-integracao.js`**: lógica de seed extraída para um módulo comum
   (usado pelos dois seeds) e correção de gravação de `telas` — era gravado como
   **string** `'["nfe-cte"]'`, agora é **array** de verdade (`sql.json`). O
   `/api/integracao/listar` usa `telas.includes(tela)`; com string funcionava só por
   coincidência (substring), e um nome de tela contido em outro daria falso positivo.
   Nova flag `--origem-db=<nome>` para clonar credenciais de outro banco quando a origem
   local está quebrada (foi o caso do neon).

---

## 20. v3.1b publicada: ORA-06502 no console e o bloco `dsp` vazio (29/09/2026)

Duas coisas separadas, e vale não misturar.

### 20.1 ORA-06502 não é erro do SQL

`ORA-06502: PL/SQL: character value buffer too small`, precedido de **"Ocorreu 1 erro"**,
não é erro de sintaxe (seria `ORA-009xx`) nem coluna inexistente (`ORA-00904`): **a
sentença chegou a executar**. O prefixo `PL/SQL:` e o "Ocorreu 1 erro" são do *runner*
do console do ERP, que monta a linha num buffer fixo.

Prova disso é a própria publicação: **o mesmo SELECT responde `200` no endpoint com 201
linhas e 55 colunas.** Mesmo SQL, dois runners — o do endpoint aguenta, o do console não.

A coluna mais larga da projeção é `NF_ITEM_DESCRICOES`: o `LISTAGG` de
`SUBSTR(descricao_item, 1, 60)` **sem `ON OVERFLOW TRUNCATE`** chega a 4.000 bytes numa
célula (§17.1 já registrava esse risco), e são mais ~40 colunas de texto na mesma linha.
Se o buffer do runner for fixo, essa é a linha que estoura — e ela varia por CT-e, então
o erro é "às vezes", não sempre.

**Como separar em uma execução** — `docs/diag-ora-06502-dsp.sql`, item 6: o mesmo SQL
com `COUNT(*)` no lugar da projeção.

| Resultado | Conclusão | O que fazer |
|---|---|---|
| o `COUNT` roda | o SQL está certo, é o runner | `SUBSTR` nas colunas largas (descrições e nomes) |
| o `COUNT` também falha | o erro é do SQL | seguir os itens 1–5 do diagnóstico |

### 20.2 O problema sério: as 17 colunas `NF_OD_*` vieram vazias

O payload publicado tem as 55 colunas, mas **`nf_od_pedido` preenchido em 0 de 201
linhas** — as 17 colunas do despacho vieram nulas. O critério que a §3 do SQL definiu
era: perto de 162 casamentos a chave funciona; zero significa join errado.

O cruzamento foi refeito em JS a partir dos dois endpoints publicados
(`scripts/diag-despacho-cruzamento.js`) e **descartou as três hipóteses fáceis**:

| Verificação | Resultado |
|---|---|
| a chave `numero-serie` casa? | **sim — 162 das 201** (35832-1 → pedido 8198, romaneio 24597, 3.613,90, 18/09/2026) |
| `entrada_saida = 'Saida'` | passa nas 162 — o valor é mesmo `Saida`, **sem acento** |
| `pedido > 0` | passa nas 162 |
| corte `data >= -3 meses` | derruba **1** (31933-1, o CT-e 351348 do rateio divergente) |

Ou seja: **o bloco `dsp` deveria devolver 161 chaves e devolve 0.** O defeito está
*dentro* do bloco, não nos dados.

Suspeito nº 1: **o próprio corte de data.**
`d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)` só está correto se
`PMDVW_NFS.DATA_MOVTO` for `DATE`. Se for `CHAR`/`VARCHAR2`, o Oracle compara **texto
com texto** — o `DATE` da outra ponta vira string pelo `NLS_DATE_FORMAT` da sessão — e o
resultado é lixo silencioso: nenhuma linha passa e nenhum erro aparece. `docs/diag-ora-06502-dsp.sql`
mede o tipo com `DUMP` (item 1) e conta o bloco em três degraus (itens 5, 5b, 5c), que
dividem a causa entre filtro de data e custo do join de rolos.

### 20.3 — armadilha de método: o endpoint pagina

`api_ordem_despacho` devolve `items` + `hasMore` + `limit` + `offset`, e **`count` é o da
página, não o total**. A primeira página traz **100 registros de 2022-10 a 2022-12**.

Cruzar só a primeira página dá **0 de 201** e parece concluir que a chave está errada
— foi exatamente o que aconteceu na primeira medição. São **9 páginas, 8.035
registros**, de 2022 a 2026-09-29. O cruzamento só dá certo depois de paginar até
`hasMore = false`.

> A tabela do §19 ("Uma linha por **pedido × NF**") continua valendo, mas o endpoint não
> entrega o conjunto todo de uma vez: qualquer verificação que dependa de cobertura
> histórica precisa paginar.

## 21. v3.1c: o corte de data saiu e a linha ganhou teto (29/09/2026)

Duas mudanças, uma por sintoma, para dar para atribuir o resultado de cada uma. O SELECT
publicado em `docs/rel-nf-cte.sql` agora é a v3.1c.

### 21.1 Saiu o `d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)`

É a única comparação do bloco `dsp` que depende do **tipo** de uma coluna que ninguém
mediu. Se `PMDVW_NFS.DATA_MOVTO` for `CHAR`/`VARCHAR2`, o Oracle converte o `DATE` da outra
ponta para texto pelo `NLS_DATE_FORMAT` da sessão e compara texto com texto — `'18/09/2026'`
contra `'29/06/26'` — e o resultado é lixo silencioso: nenhuma linha passa, nenhum erro
aparece. O sintoma medido é exatamente esse (0 de 161 chaves possíveis, sem erro).

O corte era economia de custo, e a economia não existe: são ~47 mil NFs de saída, um
`GROUP BY` de uma coluna. A janela do relatório já é imposta pelo `WHERE` de fora, sobre a
data do CT-e. E o corte não protegia nada — a chave é `numero-serie`, que identifica a
nota, então não há como um despacho antigo se grudar num CT-e novo.

> Se o `DUMP` do item 1 de `docs/diag-ora-06502-dsp.sql` mostrar que `DATA_MOVTO` é mesmo
> `DATE`, o corte **não** era a causa: o próximo suspeito é o join com `rol` (itens 5b ×
> 5c), e o corte volta — só aí.

### 21.2 Toda coluna de texto da projeção ganhou teto de tamanho

`SUBSTR(TRIM(x), 1, n)` nas 17 colunas de nome, mais `NF_ITEM_DESCRICOES` com teto de 300.

**Isto não resolveu o `ORA-06502`** — foi testado no console e o erro voltou idêntico. A
largura da linha caiu bastante e o disparador continuou sendo o mesmo, então a largura está
**descartada** como causa. A mudança fica, porque é boa prática e corta o risco de
`ORA-01489` no `LISTAGG`, mas não se deve creditar a ela a correção do console.

O que ela resolve de fato: o `TRIM` antes do `SUBSTR` mata o preenchimento com espaço das
colunas `CHAR` — as de `PMDVW_NFS`/`PMDVW_VENDAS` são `CHAR`, foi por isso que o probe de
`docs/probe-nf-ordem-despacho.sql` envolve as flags em `TRIM` — e o mesmo `TRIM` foi posto
dentro do bloco `dsp`, nas 11 colunas de texto dele.

O item do `LISTAGG` caiu de 60 para 40 caracteres, o que joga o estouro de 4.000 bytes de
~63 para ~95 itens por par CT-e/NF. Com 2 itens no maior CT-e da janela, é folgado; e
continua valendo o que a v3.0 já dizia: se a base for 12.2+, acrescente
`ON OVERFLOW TRUNCATE '...' WITH COUNT` ao `LISTAGG` e o risco some de vez.

### 21.2b O que sobrou do `ORA-06502`: as quatro hipóteses que caíram

**Medido em 29/09/2026, no console.** Todas as sondas do `docs/diag-ora-06502-dsp.sql` passaram:

| Hipótese | Como foi testada | Resultado |
|---|---|---|
| **Largura da linha** | a v3.1c pôs teto nas 18 colunas de texto | a largura caiu muito, o `ORA-06502` não mudou |
| **Limite de colunas** | sondas 7, 8 e 9 — 38, 55 e 60 colunas sintéticas em `DUAL` | **as três passaram** |
| **O bloco `dsp`** | sondas 10, 11 e 12 — núcleo, + vendas, + `rol` com `DENSE_RANK` | **as três passaram** |
| **`DATA_MOVTO` ser `CHAR`** | a v3.1c removeu o corte de data | pendente de medir no endpoint |

O `dsp` inteiro, com o `DENSE_RANK` que derrubou a v3.1a com `ORA-12705`, roda no console. O SQL
está correto: a v3.1b roda no endpoint (201 linhas, 55 colunas, HTTP 200). Quem não aguenta é o
runner do console, que embrulha a sentença em PL/SQL.

#### A lacuna que sobrou — e ela é minha

| Sonda | Colunas | Linhas | Resultado |
|---|---|---|---|
| 7/8/9 sintéticas | 38–60 | 1 | passou |
| 10/11/12 `dsp` | 8–18 | 20 | passou |
| **relatório v3.1c** | **55** | **201** | **ORA-06502** |

**Todas** as sondas que passaram devolvem no máximo 20 linhas. Nenhuma testou **volume**, que é
a única dimensão ainda não medida. Se o runner monta o resultado num buffer *acumulado*
(`v_result := v_result || linha`, dentro de um laço), o que estoura é o produto **linhas ×
largura** — e não a contagem nem a largura sozinhas.

Isso explica a v3.0 rodando: não era só ter 38 colunas, era **38 colunas × menos linhas**.

Se for isso, o relatório inteiro não roda no console e **não há conserto de SQL** que resolva: ou
se reduz o volume por execução (período menor), ou a conferência desse relatório passa a ser pelo
endpoint — que devolve 201 linhas e 55 colunas sem reclamar. As sondas 13 e 14 medem isso.

> **Registro de uma sondagem minha que errou.** A primeira versão da sonda 10 died
> `ORA-00904: "ROL"."PESO_LIQUIDO"`. Era erro da sonda, não do relatório: eu tinha encurtado o
> subselect do `rol` para `pedido` e `romaneio` e o `SELECT` de fora continuava pedindo
> `peso_bruto` e `peso_liquido`. O subselect do `rol` precisa projetar as cinco colunas, e a
> sonda 12 já projeta.


### 21.3 O que não mudou (de propósito)

`nf_valor_total`, `nf_cab_origem`, `nf_valor_origem`, as duas window functions, o `WHERE`
de fora e o `ORDER BY` estão idênticos aos da v3.1b. Continua valendo o item 4 da v3.1b: o
`VALOR_SAIDA` do despacho **não** entra no valor da nota, então as 194 NFs previstas
continuam sem valor e o relatório mostra os mesmos 7 de sempre. A **v3.2** é quem liga o
valor — e só depois que o join casar.

Uma mexida pequena e de arrumação: o `d.pedido > 0` estava no `ON` do join com `rol` e foi
para o `WHERE` do `dsp`, que é onde um filtro da tabela preservada pertence. No relatório
não muda nada — as 162 NFs que casam na chave já têm todas `pedido > 0` — e ainda evita de
ir em `pmdvw_vendas` e `pmdvw_rolos` para um pedido que não existe.

### 21.4 O que medir ao publicar

O que **não** pode mudar: 201 linhas, 55 colunas, zero par CT-e/NF repetido, 194 linhas sem
valor, soma dos percentuais = 100% por CT-e.

O que **tem** de mudar: `NF_OD_PEDIDO` preenchido em **~161 das 201** linhas. 161 é o número
medido: 162 casam na chave e o corte de data antigo derrubava a 31933-1 (o CT-e 351348 do
rateio divergente).

Se vier 0 de novo, o corte de data **não** era a causa: rode os itens 5b e 5c de
`docs/diag-ora-06502-dsp.sql` e compare os dois números.


## 22. v3.2: o SQL simplificado e os cálculos no cliente (30/09/2026)

A causa exata do `ORA-06502` do console ainda está sendo isolada (a hipótese que resta é
volume — ver §21.2b), mas o match das sondas mostrou que o **runner do console** é quem não
aguenta o relatório completo embutido em PL/SQL: a v3.1b roda no endpoint com 201 linhas × 55
colunas (HTTP 200), e a v3.1c não roda no console mesmo com teto de texto em todas as colunas.

### 22.1 O SELECT que roda no endpoint (e a prova no console)

Para o teste no console, o usuário reescreveu a sentença na forma **simplificada** (o `docs/
rel-nf-cte.sql` a documenta):

- `nf_item_descricoes` deixou de vir de `LISTAGG` e virou `CAST(NULL AS VARCHAR2(1))` — as
  descrições dos itens **não vêm mais** do endpoint;
- as **cinco janelas de cálculo** saíram: `soma_nf_do_cte`, `soma_rateio_do_cte`,
  `pct_cte_sobre_total_nfs`, `pct_nf_no_total_cte`, `nf_pct_rateio_no_cte`;
- o bloco `dsp` (ordem de despacho) e o `DENSE_RANK` interno do `rol` ficaram intactos.

> **Paginação (30/09/2026, medido no endpoint real):** o SQL publicado **não tem** `ROWNUM` — a
> ferramenta Apex aplica o teto via `limit`/`offset` na query string. Comportamento medido em
> `api_rel_nfe_cte_periodo`:
>
> | Parâmetro | Linhas devolvidas |
> |---|---|
> | sem `limit` | **198** (o relatório inteiro) |
> | `?limit=20` | 20 |
> | `?limit=200` | 198 (tudo) |
>
> `limit=100` em duas páginas reproduz **exatamente** o mesmo conjunto do sem-`limit` (198 linhas,
> mesma ordem, zero sobreposição). O PDM pagina por precaution — `buscarTodasPaginas` busca páginas
> de **100 linhas** (`LIMITE_PAGINA=100`) até `MAX_PAGINAS`, acumulando os itens **brutos** de todas
> e só normalizando no fim — assim `calcularDerivadosPorCte` vê o conjunto completo e os cálculos por
> CT-e saem certos mesmo que um CT-e seja cortado entre páginas. Para quando uma página volta com
> menos de `LIMITE_PAGINA` linhas.

### 22.2 A resolução no PDM: `calcularDerivadosPorCte`

O PDM agora recalcula **no cliente** exatamente os campos que a v3.2 tirou do banco, em
`src/app/(dashboard)/ferramentas/nfe-cte/components/utils.ts`:

1. `normalizarResposta` roda a resposta e, em seguida, `calcularDerivadosPorCte`;
2. a função agrupa as linhas por `cte_numero + cte_serie` (mesmo critério das `PARTITION BY`
   do SQL) e, para cada CT-e, soma `nf_valor_total` e `nf_item_valor_total`;
3. recalcula `pct_nf_no_total_cte`, `pct_cte_sobre_total_nfs` e `nf_pct_rateio_no_cte` com
   as **mesmas fórmulas do SQL** e arredondamento de 2 casas (`ROUND(x,2)`);
4. **só preenche quando o campo vem `null`** — se a API (ou uma versão futura) devolver o
   valor, o do ERP prevalece;
5. `nf_item_descricoes` fica `null` (como a v3.2 manda): a tela mostra "N item(ns) sem
   descrição" (fallback já existente em `tabela.tsx`).

Tabela e CSV leem os mesmos campos por linha, então os valores calculados aparecem nos dois
lugares. `agruparPorCte` segue como rede de segurança: se por algum motivo a normalização não
passar pelos cálculos, ele ainda soma e percentualiza no grupo.

### 22.3 O que medir assim que a v3.2 for publicada

- mesma contagem: 201 linhas, 55 colunas, zero par CT-e/NF repetido, 194 linhas sem valor;
- `soma_nf_do_cte`, `soma_rateio_do_cte`, `pct_*` e `nf_pct_rateio_no_cte` **nulos** na
  resposta (era o teste do console);
- no PDM: as mesmas somas/percentuais de antes da mudança, porque agora o cliente recalcula —
  conferir CT-es com mais de uma NF (soma = soma das NFs) e o CT-e 351348 (rateio divergente,
  continua marcado);
- `nf_item_descricoes` nulo → linha de item com "N item(ns) sem descrição" e CSV com a coluna
  "Itens (descricoes)" vazia.

esse sql é para mostrar os dados que o valor da nf é acessado....e que tentei inseiri no atual sql das ctes

WITH VENDAS AS (
    SELECT
        PEDIDO,
        MAX(NOME_CLIENTE) AS NOME_CLIENTE,
        MAX(FANTASIA) AS FANTASIA,
        MAX(REGIAO) AS REGIAO,
        MAX(NOME_REGIAO) AS NOME_REGIAO,
        MAX(CID) AS CID,
        MAX(CIDADE) AS CIDADE,
        MAX(REP) AS REP,
        MAX(NOME_REPRESENANTE) AS NOME_REPRESENANTE,
        MAX(TIPO_FRETE) AS TIPO_FRETE,
        MAX(CNPJ_TRANS) AS CNPJ_TRANS,
        MAX(TRANSPORTADORA) AS TRANSPORTADORA,
        MAX(TIPO_REDESPACHO) AS TIPO_REDESPACHO,
        MAX(CNPJ_REDESP) AS CNPJ_REDESP,
        MAX(REDESPACHO) AS REDESPACHO,
        LPAD(SUBSTR(MAX(v.CNPJ), 1, INSTR(MAX(v.CNPJ), '-') - 1), 8, '0') ||
        LPAD(
            SUBSTR(
                MAX(v.CNPJ),
                INSTR(MAX(v.CNPJ), '-') + 1,
                INSTR(MAX(v.CNPJ), '/') - INSTR(MAX(v.CNPJ), '-') - 1
            ),
            4,
            '0'
        ) ||
        LPAD(
            SUBSTR(MAX(v.CNPJ), INSTR(MAX(v.CNPJ), '/') + 1),
            2,
            '0'
        ) AS CNPJ_FORMATADO
    FROM PMDVW_VENDAS v
    GROUP BY PEDIDO
),
NFS AS (
    SELECT
        PEDIDO,
        NF, -- Incluído no SELECT para separar os faturamentos
        MAX(ENTRADA_SAIDA) AS ENTRADA_SAIDA,
        MAX(FATURAMENTO_SIM_NAO) AS FATURAMENTO_SIM_NAO,
        MAX(NATUREZA) AS NATUREZA,
        MAX(CFOP) AS CFOP,
        MAX(DATA_MOVTO) AS DATA_MOVTO,
        SUM(QTDE_SAIDA) AS QTDE_SAIDA,
        SUM(VALOR_SAIDA) AS VALOR_SAIDA
    FROM PMDVW_NFS
    WHERE ENTRADA_SAIDA = 'Saida'
      AND FATURAMENTO_SIM_NAO = 'Sim'
      AND CFOP != '0'
    GROUP BY PEDIDO, NF -- Agrupando por Pedido E Nota para não somar tudo do mesmo pedido
),
ROLOS AS (
    SELECT
        r.PEDIDO,
        MAX(r.ROMANEIO) AS ROMANEIO,
        COUNT(DISTINCT r.CODIGO_ROLO) AS QTDE_ROLOS,
        SUM(r.QUANTIDADE) AS QUANTIDADE,
        SUM(r.PESO_BRUTO) AS PESO_BRUTO,
        SUM(r.PESO_LIQUIDO) AS PESO_LIQUIDO
    FROM PMDVW_ROLOS r
    INNER JOIN (
        SELECT PEDIDO, MAX(ROMANEIO) AS ULTIMO_ROMANEIO
        FROM PMDVW_ROLOS
        WHERE ROMANEIO IS NOT NULL
          AND SITUACAO = 'Fora do estoque'
        GROUP BY PEDIDO
    ) ult ON ult.PEDIDO = r.PEDIDO AND ult.ULTIMO_ROMANEIO = r.ROMANEIO
    WHERE r.ROMANEIO IS NOT NULL
      AND r.SITUACAO = 'Fora do estoque'
    GROUP BY r.PEDIDO
)
SELECT
    v.PEDIDO,
    v.CNPJ_FORMATADO AS CNPJ,
    v.NOME_CLIENTE,
    v.FANTASIA,
    v.REGIAO,
    v.NOME_REGIAO,
    v.CID,
    v.CIDADE,
    v.REP,
    v.NOME_REPRESENANTE,
    n.NF,
    n.ENTRADA_SAIDA,
    n.FATURAMENTO_SIM_NAO,
    n.NATUREZA,
    n.CFOP,
    n.DATA_MOVTO,
    v.TIPO_FRETE,
    v.CNPJ_TRANS,
    v.TRANSPORTADORA,
    v.TIPO_REDESPACHO,
    v.CNPJ_REDESP,
    v.REDESPACHO,
    n.QTDE_SAIDA,
    n.VALOR_SAIDA,
    r.ROMANEIO,
    r.QTDE_ROLOS,
    r.QUANTIDADE,
    r.PESO_BRUTO,
    r.PESO_LIQUIDO
FROM VENDAS v
INNER JOIN NFS n ON n.PEDIDO = v.PEDIDO -- O vínculo principal continua no pedido, mas agora as linhas de NF estão separadas
INNER JOIN ROLOS r ON r.PEDIDO = v.PEDIDO
ORDER BY v.PEDIDO, n.NF



retorno desse sql:
{
  "items" :
  [
    {
      "PEDIDO" : 131,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "14-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-31T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 12273,
      "VALOR_SAIDA" : 18286.77,
      "ROMANEIO" : 618,
      "QTDE_ROLOS" : 7,
      "QUANTIDADE" : 1410,
      "PESO_BRUTO" : 240.884,
      "PESO_LIQUIDO" : 238.854
    },
    {
      "PEDIDO" : 132,
      "CNPJ" : "02935938000471",
      "NOME_CLIENTE" : "COMERCIO DE CONFECCOES R M LTDA",
      "FANTASIA" : "ENXOVAIS BEIJA FLOR",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 3225,
      "CIDADE" : "FEIRA DE SANTANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "26759-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "24-BA",
      "CFOP" : "6.124",
      "DATA_MOVTO" : "2022-11-10T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 1852,
      "VALOR_SAIDA" : 1981.64,
      "ROMANEIO" : 799,
      "QTDE_ROLOS" : 8,
      "QUANTIDADE" : 926,
      "PESO_BRUTO" : 47.9,
      "PESO_LIQUIDO" : 46.3
    },
    {
      "PEDIDO" : 133,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "22-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-11-07T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 8192.1,
      "VALOR_SAIDA" : 11796.63,
      "ROMANEIO" : 715,
      "QTDE_ROLOS" : 49,
      "QUANTIDADE" : 4064.7,
      "PESO_BRUTO" : 741.791,
      "PESO_LIQUIDO" : 727.581
    },
    {
      "PEDIDO" : 134,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "13-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-31T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 4107.1,
      "VALOR_SAIDA" : 5832.08,
      "ROMANEIO" : 619,
      "QTDE_ROLOS" : 21,
      "QUANTIDADE" : 2182,
      "PESO_BRUTO" : 503.586,
      "PESO_LIQUIDO" : 497.496
    },
    {
      "PEDIDO" : 135,
      "CNPJ" : "07552712000162",
      "NOME_CLIENTE" : "ART TEXTIL DO BRASIL LTDA",
      "FANTASIA" : "ART TEXTIL DO BRASIL LTDA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 355,
      "CIDADE" : "AMERICANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "4-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 3906.5,
      "VALOR_SAIDA" : 10078.77,
      "ROMANEIO" : 495,
      "QTDE_ROLOS" : 81,
      "QUANTIDADE" : 3906.5,
      "PESO_BRUTO" : 4248.325,
      "PESO_LIQUIDO" : 4248.325
    },
    {
      "PEDIDO" : 136,
      "CNPJ" : "07552712000162",
      "NOME_CLIENTE" : "ART TEXTIL DO BRASIL LTDA",
      "FANTASIA" : "ART TEXTIL DO BRASIL LTDA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 355,
      "CIDADE" : "AMERICANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "5-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 1959.3,
      "VALOR_SAIDA" : 3918.6,
      "ROMANEIO" : 471,
      "QTDE_ROLOS" : 37,
      "QUANTIDADE" : 1959.3,
      "PESO_BRUTO" : 0,
      "PESO_LIQUIDO" : 0
    },
    {
      "PEDIDO" : 137,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "9-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-28T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 14729.5,
      "VALOR_SAIDA" : 11961.37,
      "ROMANEIO" : 557,
      "QTDE_ROLOS" : 20,
      "QUANTIDADE" : 2117.5,
      "PESO_BRUTO" : 488.59,
      "PESO_LIQUIDO" : 482.79
    },
    {
      "PEDIDO" : 138,
      "CNPJ" : "24940593000134",
      "NOME_CLIENTE" : "FEITOSA INDUSTRIA TEXTIL LTDA ME",
      "FANTASIA" : "FEITOSA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "2-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-24T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 22402.6,
      "VALOR_SAIDA" : 26883.12,
      "ROMANEIO" : 459,
      "QTDE_ROLOS" : 18,
      "QUANTIDADE" : 1158.3,
      "PESO_BRUTO" : 467.243,
      "PESO_LIQUIDO" : 461.003
    },
    {
      "PEDIDO" : 139,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "8-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-28T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 7653.4,
      "VALOR_SAIDA" : 14235.32,
      "ROMANEIO" : 550,
      "QTDE_ROLOS" : 49,
      "QUANTIDADE" : 3919,
      "PESO_BRUTO" : 825.44,
      "PESO_LIQUIDO" : 822.99
    },
    {
      "PEDIDO" : 140,
      "CNPJ" : "52431426000101",
      "NOME_CLIENTE" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "FANTASIA" : "RANER INDUSTRIA COMERCIO IMPORTACAO E",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "3-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-10-24T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 8115.2,
      "VALOR_SAIDA" : 5842.94,
      "ROMANEIO" : 462,
      "QTDE_ROLOS" : 25,
      "QUANTIDADE" : 2019.2,
      "PESO_BRUTO" : 0,
      "PESO_LIQUIDO" : 0
    },
    {
      "PEDIDO" : 142,
      "CNPJ" : "02935938000471",
      "NOME_CLIENTE" : "COMERCIO DE CONFECCOES R M LTDA",
      "FANTASIA" : "ENXOVAIS BEIJA FLOR",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 3225,
      "CIDADE" : "FEIRA DE SANTANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "26629-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "24-BA",
      "CFOP" : "6.124",
      "DATA_MOVTO" : "2022-10-24T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 13634,
      "VALOR_SAIDA" : 14588.38,
      "ROMANEIO" : 465,
      "QTDE_ROLOS" : 11,
      "QUANTIDADE" : 1171.8,
      "PESO_BRUTO" : 291.382,
      "PESO_LIQUIDO" : 287.092
    },
    {
      "PEDIDO" : 143,
      "CNPJ" : "24940593000134",
      "NOME_CLIENTE" : "FEITOSA INDUSTRIA TEXTIL LTDA ME",
      "FANTASIA" : "FEITOSA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 7702,
      "CIDADE" : "SANTA BARBARA D OESTE",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "26-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-11-10T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 11664.4,
      "VALOR_SAIDA" : 27994.56,
      "ROMANEIO" : 795,
      "QTDE_ROLOS" : 34,
      "QUANTIDADE" : 1949,
      "PESO_BRUTO" : 827.182,
      "PESO_LIQUIDO" : 775.702
    },
    {
      "PEDIDO" : 145,
      "CNPJ" : "02935938000471",
      "NOME_CLIENTE" : "COMERCIO DE CONFECCOES R M LTDA",
      "FANTASIA" : "ENXOVAIS BEIJA FLOR",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 3225,
      "CIDADE" : "FEIRA DE SANTANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "26759-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "24-BA",
      "CFOP" : "6.124",
      "DATA_MOVTO" : "2022-11-10T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 11924,
      "VALOR_SAIDA" : 12758.68,
      "ROMANEIO" : 796,
      "QTDE_ROLOS" : 9,
      "QUANTIDADE" : 930,
      "PESO_BRUTO" : 189.51,
      "PESO_LIQUIDO" : 186
    },
    {
      "PEDIDO" : 146,
      "CNPJ" : "02935938000471",
      "NOME_CLIENTE" : "COMERCIO DE CONFECCOES R M LTDA",
      "FANTASIA" : "ENXOVAIS BEIJA FLOR",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 3225,
      "CIDADE" : "FEIRA DE SANTANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "26759-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "24-BA",
      "CFOP" : "6.124",
      "DATA_MOVTO" : "2022-11-10T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 17346,
      "VALOR_SAIDA" : 18560.22,
      "ROMANEIO" : 803,
      "QTDE_ROLOS" : 4,
      "QUANTIDADE" : 443,
      "PESO_BRUTO" : 109.335,
      "PESO_LIQUIDO" : 108.535
    },
    {
      "PEDIDO" : 147,
      "CNPJ" : "07552712000162",
      "NOME_CLIENTE" : "ART TEXTIL DO BRASIL LTDA",
      "FANTASIA" : "ART TEXTIL DO BRASIL LTDA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 355,
      "CIDADE" : "AMERICANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "23-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-11-07T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 1909.2,
      "VALOR_SAIDA" : 4925.74,
      "ROMANEIO" : 716,
      "QTDE_ROLOS" : 40,
      "QUANTIDADE" : 1909.2,
      "PESO_BRUTO" : 823.012,
      "PESO_LIQUIDO" : 811.412
    },
    {
      "PEDIDO" : 148,
      "CNPJ" : "07552712000162",
      "NOME_CLIENTE" : "ART TEXTIL DO BRASIL LTDA",
      "FANTASIA" : "ART TEXTIL DO BRASIL LTDA",
      "REGIAO" : 0,
      "NOME_REGIAO" : ".",
      "CID" : 355,
      "CIDADE" : "AMERICANA",
      "REP" : 147,
      "NOME_REPRESENANTE" : "ALESSANDRA ELIZABEL CASELLA",
      "NF" : "24-99",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "99-SP",
      "CFOP" : "5.124",
      "DATA_MOVTO" : "2022-11-08T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 2208,
      "VALOR_SAIDA" : 4416,
      "ROMANEIO" : 735,
      "QTDE_ROLOS" : 38,
      "QUANTIDADE" : 2208,
      "PESO_BRUTO" : 603.144,
      "PESO_LIQUIDO" : 590.644
    },
    {
      "PEDIDO" : 149,
      "CNPJ" : "10694685000258",
      "NOME_CLIENTE" : "IRENE ALVES DA COSTA DUTRA",
      "FANTASIA" : "IRENE ALVES DA COSTA - CASA DAS REDES",
      "REGIAO" : 24,
      "NOME_REGIAO" : "RIO GRANDE DO NORTE",
      "CID" : 8024,
      "CIDADE" : "SANTO ANTONIO-RN",
      "REP" : 192,
      "NOME_REPRESENANTE" : "LEDO CESAR FERREIRA DA SILVA",
      "NF" : "26730-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-RN",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-11-03T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "7298073/1-50",
      "TRANSPORTADORA" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "TIPO_REDESPACHO" : "2-A pagar",
      "CNPJ_REDESP" : "17344049/2-45",
      "REDESPACHO" : "RODOVIARIO LUZ TRANSPORTES EIRELI",
      "QTDE_SAIDA" : 360,
      "VALOR_SAIDA" : 3248.4,
      "ROMANEIO" : 684,
      "QTDE_ROLOS" : 6,
      "QUANTIDADE" : 360,
      "PESO_BRUTO" : 151.93,
      "PESO_LIQUIDO" : 150.12
    },
    {
      "PEDIDO" : 150,
      "CNPJ" : "30452952000107",
      "NOME_CLIENTE" : "STARTEN ESTOFADOS LTDA.",
      "FANTASIA" : "STARTEN ESTOFADOS",
      "REGIAO" : 31,
      "NOME_REGIAO" : "MINAS GERAIS",
      "CID" : 8254,
      "CIDADE" : "SAO GERALDO-MG",
      "REP" : 163,
      "NOME_REPRESENANTE" : "MARCO E MOREIRA REPRES LTDA - IGOR",
      "NF" : "26793-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-MG",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-11-17T00:00:00Z",
      "TIPO_FRETE" : "2-A pagar",
      "CNPJ_TRANS" : "0/0-0",
      "TRANSPORTADORA" : "PROPRIO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 2027,
      "VALOR_SAIDA" : 15405.2,
      "ROMANEIO" : 698,
      "QTDE_ROLOS" : 34,
      "QUANTIDADE" : 2027,
      "PESO_BRUTO" : 763.006,
      "PESO_LIQUIDO" : 754.016
    },
    {
      "PEDIDO" : 151,
      "CNPJ" : "32258146000128",
      "NOME_CLIENTE" : "J DE F ARAUJO ASSENTOS",
      "FANTASIA" : "ART ASSENTOS",
      "REGIAO" : 31,
      "NOME_REGIAO" : "MINAS GERAIS",
      "CID" : 3715,
      "CIDADE" : "GUIDOVAL",
      "REP" : 163,
      "NOME_REPRESENANTE" : "MARCO E MOREIRA REPRES LTDA - IGOR",
      "NF" : "26639-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-MG",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "2-A pagar",
      "CNPJ_TRANS" : "25335282/3-70",
      "TRANSPORTADORA" : "TRANSPORTE CAMILLO DOS SANTOS-LT",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 427,
      "VALOR_SAIDA" : 3287.9,
      "ROMANEIO" : 476,
      "QTDE_ROLOS" : 7,
      "QUANTIDADE" : 427,
      "PESO_BRUTO" : 155.033,
      "PESO_LIQUIDO" : 153.293
    },
    {
      "PEDIDO" : 152,
      "CNPJ" : "15530582000195",
      "NOME_CLIENTE" : "LR DO BRASIL INDUSTRIA E COMERCIO DE M",
      "FANTASIA" : "LR DO BRASIL ESTOFADOS",
      "REGIAO" : 11,
      "NOME_REGIAO" : "SÃO PAULO",
      "CID" : 9927,
      "CIDADE" : "VOTUPORANGA",
      "REP" : 137,
      "NOME_REPRESENANTE" : "RODRIGO GONÇALVES CONSTANTINO REPR. ME",
      "NF" : "26632-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-SP",
      "CFOP" : "5.101",
      "DATA_MOVTO" : "2022-10-25T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "3088450/1-76",
      "TRANSPORTADORA" : "ZERO HORA TRANSPORTES E ENCOMENDAS LTDA",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 2042,
      "VALOR_SAIDA" : 14743.24,
      "ROMANEIO" : 475,
      "QTDE_ROLOS" : 28,
      "QUANTIDADE" : 1734,
      "PESO_BRUTO" : 630.626,
      "PESO_LIQUIDO" : 622.506
    },
    {
      "PEDIDO" : 153,
      "CNPJ" : "37143897000112",
      "NOME_CLIENTE" : "INNOVA DECOR IND E COM DE MOVEIS E ESTOF",
      "FANTASIA" : "INNOVA DECOR",
      "REGIAO" : 41,
      "NOME_REGIAO" : "PARANÁ",
      "CID" : 575,
      "CIDADE" : "ARAPONGAS",
      "REP" : 178,
      "NOME_REPRESENANTE" : "JEMA REPRES COM LTDA - ALESSANDRO",
      "NF" : "26642-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-PR",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "2-A pagar",
      "CNPJ_TRANS" : "428307/19-17",
      "TRANSPORTADORA" : "EXPRESSO SAO MIGUEL S/A",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 197,
      "VALOR_SAIDA" : 1554.33,
      "ROMANEIO" : 497,
      "QTDE_ROLOS" : 3,
      "QUANTIDADE" : 197,
      "PESO_BRUTO" : 71.593,
      "PESO_LIQUIDO" : 70.723
    },
    {
      "PEDIDO" : 154,
      "CNPJ" : "11695541000106",
      "NOME_CLIENTE" : "DISTRIB E IMPORT DE TECIDOS LUCENA LTDA",
      "FANTASIA" : "MARAJO TECIDOS",
      "REGIAO" : 26,
      "NOME_REGIAO" : "PERNAMBUCO",
      "CID" : 2099,
      "CIDADE" : "CARUARU",
      "REP" : 158,
      "NOME_REPRESENANTE" : "REALTEX REPRESENTACOES LTDA - AUGUSTO",
      "NF" : "26656-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-PE",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "7298073/1-50",
      "TRANSPORTADORA" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "TIPO_REDESPACHO" : "2-A pagar",
      "CNPJ_REDESP" : "69083244/1-81",
      "REDESPACHO" : "J L FERREIRA TRANSPORTES",
      "QTDE_SAIDA" : 3000,
      "VALOR_SAIDA" : 27090,
      "ROMANEIO" : 517,
      "QTDE_ROLOS" : 60,
      "QUANTIDADE" : 3000,
      "PESO_BRUTO" : 722.4,
      "PESO_LIQUIDO" : 705
    },
    {
      "PEDIDO" : 155,
      "CNPJ" : "10968343000106",
      "NOME_CLIENTE" : "L.S LOCAL SURF COMERCIO E CONFECCOES LTD",
      "FANTASIA" : "L.S LOCAL SURF COMERCIO E CONFECCOES LTD",
      "REGIAO" : 11,
      "NOME_REGIAO" : "SÃO PAULO",
      "CID" : 8606,
      "CIDADE" : "SAO PAULO",
      "REP" : 56,
      "NOME_REPRESENANTE" : "FRANCISCO ALBERTO TIRONI  - TIRONI",
      "NF" : "26612-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-SP",
      "CFOP" : "5.101",
      "DATA_MOVTO" : "2022-10-20T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "7298073/1-50",
      "TRANSPORTADORA" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 5000,
      "VALOR_SAIDA" : 19950,
      "ROMANEIO" : 383,
      "QTDE_ROLOS" : 13,
      "QUANTIDADE" : 2600,
      "PESO_BRUTO" : 332.14,
      "PESO_LIQUIDO" : 327.6
    },
    {
      "PEDIDO" : 156,
      "CNPJ" : "35100841000155",
      "NOME_CLIENTE" : "WILLIAM R CANTANHEDE",
      "FANTASIA" : "RIO SUL MALHAS",
      "REGIAO" : 21,
      "NOME_REGIAO" : "MARANHAO",
      "CID" : 7580,
      "CIDADE" : "ROSARIO-MA",
      "REP" : 153,
      "NOME_REPRESENANTE" : "LCS REPRESENTACOES LTDA - MACIO",
      "NF" : "26665-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-MA",
      "CFOP" : "6.101",
      "DATA_MOVTO" : "2022-10-28T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "7298073/1-50",
      "TRANSPORTADORA" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "TIPO_REDESPACHO" : "2-A pagar",
      "CNPJ_REDESP" : "6780720/2-84",
      "REDESPACHO" : "URBANO ALVES DOS SANTOS-TRANSMEARIM",
      "QTDE_SAIDA" : 350,
      "VALOR_SAIDA" : 3244.5,
      "ROMANEIO" : 500,
      "QTDE_ROLOS" : 7,
      "QUANTIDADE" : 350,
      "PESO_BRUTO" : 84.28,
      "PESO_LIQUIDO" : 82.25
    },
    {
      "PEDIDO" : 157,
      "CNPJ" : "01566615000142",
      "NOME_CLIENTE" : "FRAN S COMERCIO DE PRODUTOS LTDA",
      "FANTASIA" : "JONEL TECIDOS",
      "REGIAO" : 11,
      "NOME_REGIAO" : "SÃO PAULO",
      "CID" : 8606,
      "CIDADE" : "SAO PAULO",
      "REP" : 157,
      "NOME_REPRESENANTE" : "CONCI E SABAINI REPRES TEXTEIS - REGINA",
      "NF" : "26653-1",
      "ENTRADA_SAIDA" : "Saida",
      "FATURAMENTO_SIM_NAO" : "Sim",
      "NATUREZA" : "1-SP",
      "CFOP" : "5.101",
      "DATA_MOVTO" : "2022-10-26T00:00:00Z",
      "TIPO_FRETE" : "1-Pago",
      "CNPJ_TRANS" : "7298073/1-50",
      "TRANSPORTADORA" : "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      "TIPO_REDESPACHO" : "0-Indefinido",
      "CNPJ_REDESP" : "0/0-0",
      "REDESPACHO" : "PROPRIO",
      "QTDE_SAIDA" : 350,
      "VALOR_SAIDA" : 3360,
      "ROMANEIO" : 515,
      "QTDE_ROLOS" : 7,
      "QUANTIDADE" : 350,
      "PESO_BRUTO" : 84.28,
      "PESO_LIQUIDO" : 82.25
    }
  ]
}

















aqui temos o atual código do endpoint da cte e que precisa se alterado para trazer o valor da nf:

> **O que foi alterado (30/09/2026):** `nf_valor_total` só vinha preenchido em **6 das 198 linhas**.
> Os três `LEFT JOIN` do cabeçalho fiscal (`OBRF_010`) dependem de CNPJ bater, e 192 linhas
> vinham `SEM_CABECALHO` — o número da NF existe, mas o CT-e não traz CNPJ de fornecedor/cliente
> que case com a `OBRF_010`.
>
> O próprio endpoint já lê `PMDVW_NFS` no bloco `dsp` (agrupado por `TRIM(d.nf)`, ou seja, por
> número-série), então o total da NF **já estava disponível e não era usado**. O fix foi:
>
> | Onde | Antes | Depois |
> |---|---|---|
> | `nf_data` | `COALESCE(nfe, nfc, nfs)` | `COALESCE(nfe, nfc, nfs, dsp.data_movto)` |
> | `nf_valor_total` | `COALESCE(nfe, nfc, nfs)` | `COALESCE(nfe, nfc, nfs, dsp.valor_saida)` |
> | `nf_cab_origem` | 4 casos | + `PMDVW_NFS` quando o `dsp` achou a NF |
> | `nf_valor_origem` | `CABECALHO_NF` / `RATEIO_CTE` | + `FATURAMENTO_NFS` (origem nova) |
>
> **Atenção:** `dsp.valor_saida` é valor de **faturamento** (`SUM(valor_saida)`), não o total
> fiscal (`OBRF_010.total_docto`). Por isso fica como **último** fallback — quando o cabeçalho
> existe, ele manda. E a origem nova é marcada `FATURAMENTO_NFS`, distinta de `CABECALHO_NF`,
> para não confundir as duas coisas na tela.
>
> Sem join novo: o `dsp` já existia, e agrupar por `TRIM(d.nf)` (e não por `PEDIDO, NF` como o
> SQL de faturamento original) é o que dá o total da **NF** inteira, que é o denominador correto
> dos percentuais por CT-e.
>
> **Período (01/10/2026):** a janela deixou de ser móvel. Agora são **mês atual completo + mês
> anterior completo**, isto é `[1º dia do mês anterior, 1º dia do próximo mês)`:
>
> ```sql
> WHERE COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE), -1)
>   AND COALESCE(b.nf_data, b.cte_data) <  ADD_MONTHS(TRUNC(SYSDATE), 1)
> ```
>
> Antes era `-2` até `TRUNC(SYSDATE) + 1`, o que trazia **três** meses (o mais antigo, o anterior e o
> corrente). Medido: com a janela antiga entravam CT-es de agosto que não deveriam estar, e o
> relatório devolvia 198 linhas. Com a janela de dois meses fechados, o conjunto é o dos dois
> meses que o usuário está olhando.
>
> **NF duplicada (01/10/2026):** o endpoint devolve a mesma NF-e duas vezes dentro do mesmo CT-e
> (medido: CT-e 351348-1 com a NF 35653-1 repetida byte a byte). É o `obrf_016` com dois vínculos
> iguais para o mesmo conhecimento — a SQL já agrega por CT-e+NF, então a segunda linha é ruído.
> O PDM resolve em `deduplicarPorCteNf` (`components/utils.ts`), dentro de `normalizarResposta`:
> mantém a primeira ocorrência da chave `CT-e|NF`. Sem isso o `pct_nf_no_total_cte` virava
> 50%/50% num caso que deveria ter uma linha só.

SELECT
    b.cte_numero,
    b.cte_serie,
    TO_CHAR(b.cte_data, 'DD/MM/YYYY') AS cte_data,
    TO_CHAR(b.cte_data_transacao, 'DD/MM/YYYY') AS cte_data_transacao,
    b.cte_valor_total,
    b.cte_valor_frete,
    b.cte_natureza,
    b.cte_tipo_conhecimento,
    b.cte_cod_cidade_origem,
    b.cte_cod_cidade_destino,
    b.cte_situacao,
    SUBSTR(TRIM(b.cte_transportadora_razao), 1, 60) AS cte_transportadora_razao,
    SUBSTR(TRIM(b.cte_transportadora_fantasia), 1, 60) AS cte_transportadora_fantasia,
    SUBSTR(TRIM(b.cte_tomador_razao), 1, 60) AS cte_tomador_razao,
    SUBSTR(TRIM(b.cte_tomador_fantasia), 1, 60) AS cte_tomador_fantasia,
    b.nf_numero,
    b.nf_serie,
    TO_CHAR(b.nf_data, 'DD/MM/YYYY') AS nf_data,
    b.nf_valor_total,
    b.nf_frete_rateado,
    b.nf_situacao,
    SUBSTR(TRIM(b.nf_cliente_razao), 1, 60) AS nf_cliente_razao,
    SUBSTR(TRIM(b.nf_cliente_fantasia), 1, 60) AS nf_cliente_fantasia,
    SUBSTR(TRIM(b.nf_fornecedor_razao), 1, 60) AS nf_fornecedor_razao,
    SUBSTR(TRIM(b.nf_fornecedor_fantasia), 1, 60) AS nf_fornecedor_fantasia,
    b.nf_cab_origem,
    b.nf_item_qtd,
    b.nf_item_qtd_total,
    SUBSTR(TRIM(b.nf_item_unidade), 1, 10) AS nf_item_unidade,
    CAST(NULL AS VARCHAR2(1)) AS nf_item_descricoes,
    b.nf_item_valor_total,
    b.nf_item_icms,
    b.nf_od_pedido,
    TO_CHAR(b.nf_od_data, 'DD/MM/YYYY') AS nf_od_data,
    b.nf_od_valor,
    b.nf_od_qtde,
    SUBSTR(TRIM(b.nf_od_cliente_razao), 1, 60) AS nf_od_cliente_razao,
    SUBSTR(TRIM(b.nf_od_cliente_fantasia), 1, 60) AS nf_od_cliente_fantasia,
    b.nf_od_cod_cidade,
    SUBSTR(TRIM(b.nf_od_cidade), 1, 40) AS nf_od_cidade,
    SUBSTR(TRIM(b.nf_od_regiao), 1, 30) AS nf_od_regiao,
    SUBSTR(TRIM(b.nf_od_representante), 1, 60) AS nf_od_representante,
    b.nf_od_romaneio,
    b.nf_od_qtde_rolos,
    b.nf_od_peso_bruto,
    b.nf_od_peso_liquido,
    SUBSTR(TRIM(b.nf_od_faturamento), 1, 3) AS nf_od_faturamento,
    SUBSTR(TRIM(b.nf_od_cfop), 1, 10) AS nf_od_cfop,
    SUBSTR(TRIM(b.nf_od_natureza), 1, 10) AS nf_od_natureza,
    CASE
        WHEN b.nf_cab_origem IN ('CNPJ_FORNECEDOR', 'CNPJ_CLIENTE_NF', 'DOCUMENTO_SERIE') THEN 'CABECALHO_NF'
        WHEN b.nf_cab_origem = 'PMDVW_NFS' THEN 'FATURAMENTO_NFS'
        WHEN b.nf_item_valor_total IS NOT NULL THEN 'RATEIO_CTE'
        ELSE 'SEM_VALOR'
    END AS nf_valor_origem
FROM (
    SELECT
        cte.documento AS cte_numero,
        cte.serie AS cte_serie,
        cte.data_emissao AS cte_data,
        cte.data_transacao AS cte_data_transacao,
        cte.total_docto AS cte_valor_total,
        cte.valor_frete AS cte_valor_frete,
        cte.natoper_nat_oper AS cte_natureza,
        cte.tipo_conhecimento AS cte_tipo_conhecimento,
        cte.cod_cidade_cte AS cte_cod_cidade_origem,
        cte.cod_cidade_cte_dest AS cte_cod_cidade_destino,
        cte.situacao_entrada AS cte_situacao,
        transp.nome_fornecedor AS cte_transportadora_razao,
        transp.nome_fantasia AS cte_transportadora_fantasia,
        tomador.nome_fornecedor AS cte_tomador_razao,
        tomador.nome_fantasia AS cte_tomador_fantasia,
        nf.numero_nota AS nf_numero,
        nf.serie_nota AS nf_serie,
        COALESCE(nfe.data_emissao, nfc.data_emissao, nfs.data_emissao, dsp.data_movto) AS nf_data,
        COALESCE(nfe.total_docto, nfc.total_docto, nfs.total_docto, dsp.valor_saida) AS nf_valor_total,
        COALESCE(nfe.valor_frete, nfc.valor_frete, nfs.valor_frete) AS nf_frete_rateado,
        COALESCE(nfe.situacao_entrada, nfc.situacao_entrada, nfs.situacao_entrada) AS nf_situacao,
        CASE
            WHEN nfe.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR'
            WHEN nfc.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF'
            WHEN nfs.documento IS NOT NULL THEN 'DOCUMENTO_SERIE'
            WHEN dsp.nf_chave IS NOT NULL THEN 'PMDVW_NFS'
            ELSE 'SEM_CABECALHO'
        END AS nf_cab_origem,
        cli.nome_fornecedor AS nf_cliente_razao,
        cli.nome_fantasia AS nf_cliente_fantasia,
        forn.nome_fornecedor AS nf_fornecedor_razao,
        forn.nome_fantasia AS nf_fornecedor_fantasia,
        it.item_qtd AS nf_item_qtd,
        it.item_qtd_total AS nf_item_qtd_total,
        it.item_unidade AS nf_item_unidade,
        it.item_valor_total AS nf_item_valor_total,
        it.item_icms AS nf_item_icms,
        dsp.pedido AS nf_od_pedido,
        dsp.data_movto AS nf_od_data,
        dsp.valor_saida AS nf_od_valor,
        dsp.qtde_saida AS nf_od_qtde,
        dsp.nome_cliente AS nf_od_cliente_razao,
        dsp.fantasia AS nf_od_cliente_fantasia,
        dsp.cid AS nf_od_cod_cidade,
        dsp.cidade AS nf_od_cidade,
        dsp.nome_regiao AS nf_od_regiao,
        dsp.nome_represenante AS nf_od_representante,
        dsp.romaneio AS nf_od_romaneio,
        dsp.qtde_rolos AS nf_od_qtde_rolos,
        dsp.peso_bruto AS nf_od_peso_bruto,
        dsp.peso_liquido AS nf_od_peso_liquido,
        dsp.faturamento AS nf_od_faturamento,
        dsp.cfop AS nf_od_cfop,
        dsp.natureza AS nf_od_natureza
    FROM obrf_016 nf
    JOIN obrf_010 cte
      ON cte.documento = nf.num_conhecimento
     AND cte.serie = nf.ser_conhecimento
     AND cte.especie_docto = 'CTE'
    LEFT JOIN obrf_010 nfe
      ON nfe.documento = nf.numero_nota
     AND nfe.serie = nf.serie_nota
     AND nfe.cgc_cli_for_9 = nf.fornecedor9
     AND nfe.cgc_cli_for_4 = nf.fornecedor4
     AND nfe.cgc_cli_for_2 = nf.fornecedor2
    LEFT JOIN obrf_010 nfc
      ON nfc.documento = nf.numero_nota
     AND nfc.serie = nf.serie_nota
     AND nfc.cgc_cli_for_9 = cte.cgc_cli_for_9
     AND nfc.cgc_cli_for_4 = cte.cgc_cli_for_4
     AND nfc.cgc_cli_for_2 = cte.cgc_cli_for_2
    LEFT JOIN obrf_010 nfs
      ON nfs.documento = nf.numero_nota
     AND nfs.serie = nf.serie_nota
     AND UPPER(nfs.especie_docto) LIKE 'NF%'
     AND nfs.data_emissao >= cte.data_emissao - 60
     AND nfs.data_emissao <= cte.data_emissao + 180
    LEFT JOIN supr_010 cli
      ON cli.fornecedor9 = COALESCE(nfe.cgc_cli_for_9, nfc.cgc_cli_for_9, nfs.cgc_cli_for_9)
     AND cli.fornecedor4 = COALESCE(nfe.cgc_cli_for_4, nfc.cgc_cli_for_4, nfs.cgc_cli_for_4)
     AND cli.fornecedor2 = COALESCE(nfe.cgc_cli_for_2, nfc.cgc_cli_for_2, nfs.cgc_cli_for_2)
    LEFT JOIN supr_010 transp
      ON transp.fornecedor9 = cte.transpa_forne9
     AND transp.fornecedor4 = cte.transpa_forne4
     AND transp.fornecedor2 = cte.transpa_forne2
    LEFT JOIN supr_010 tomador
      ON tomador.fornecedor9 = cte.cgc_cli_for_9
     AND tomador.fornecedor4 = cte.cgc_cli_for_4
     AND tomador.fornecedor2 = cte.cgc_cli_for_2
    LEFT JOIN supr_010 forn
      ON forn.fornecedor9 = nf.fornecedor9
     AND forn.fornecedor4 = nf.fornecedor4
     AND forn.fornecedor2 = nf.fornecedor2
    LEFT JOIN (
        SELECT
            i.capa_ent_nrdoc AS capa_ent_nrdoc,
            i.capa_ent_serie AS capa_ent_serie,
            i.num_nf_saida AS num_nf_saida,
            i.serie_nf_saida AS serie_nf_saida,
            COUNT(*) AS item_qtd,
            SUM(i.quantidade) AS item_qtd_total,
            MAX(i.unidade_medida) AS item_unidade,
            SUM(i.valor_total) AS item_valor_total,
            SUM(i.valor_icms) AS item_icms
        FROM obrf_015 i
        WHERE i.num_nf_saida IS NOT NULL
        GROUP BY
            i.capa_ent_nrdoc,
            i.capa_ent_serie,
            i.num_nf_saida,
            i.serie_nf_saida
    ) it
      ON it.capa_ent_nrdoc = cte.documento
     AND it.capa_ent_serie = cte.serie
     AND it.num_nf_saida = nf.numero_nota
     AND it.serie_nf_saida = nf.serie_nota
    LEFT JOIN (
        SELECT
            TRIM(d.nf) AS nf_chave,
            MAX(d.pedido) AS pedido,
            MAX(d.data_movto) AS data_movto,
            SUM(d.valor_saida) AS valor_saida,
            SUM(d.qtde_saida) AS qtde_saida,
            MAX(TRIM(d.faturamento_sim_nao)) AS faturamento,
            MAX(TRIM(d.cfop)) AS cfop,
            MAX(TRIM(d.natureza)) AS natureza,
            MAX(TRIM(w.nome_cliente)) AS nome_cliente,
            MAX(TRIM(w.fantasia)) AS fantasia,
            MAX(w.cid) AS cid,
            MAX(TRIM(w.cidade)) AS cidade,
            MAX(TRIM(w.nome_regiao)) AS nome_regiao,
            MAX(TRIM(w.nome_represenante)) AS nome_represenante,
            MAX(rol.romaneio) AS romaneio,
            MAX(rol.qtde_rolos) AS qtde_rolos,
            MAX(rol.peso_bruto) AS peso_bruto,
            MAX(rol.peso_liquido) AS peso_liquido
        FROM pmdvw_nfs d
        LEFT JOIN pmdvw_vendas w
          ON w.pedido = d.pedido
        LEFT JOIN (
            SELECT
                x.pedido,
                MAX(x.romaneio) AS romaneio,
                COUNT(DISTINCT CASE WHEN x.rn = 1 THEN x.codigo_rolo END) AS qtde_rolos,
                SUM(CASE WHEN x.rn = 1 THEN x.peso_bruto END) AS peso_bruto,
                SUM(CASE WHEN x.rn = 1 THEN x.peso_liquido END) AS peso_liquido
            FROM (
                SELECT
                    r.pedido,
                    r.romaneio,
                    r.codigo_rolo,
                    r.peso_bruto,
                    r.peso_liquido,
                    DENSE_RANK() OVER (
                        PARTITION BY r.pedido
                        ORDER BY r.romaneio DESC
                    ) AS rn
                FROM pmdvw_rolos r
                WHERE r.romaneio IS NOT NULL
                  AND r.situacao = 'Fora do estoque'
            ) x
            GROUP BY x.pedido
        ) rol
          ON rol.pedido = d.pedido
        WHERE TRIM(d.entrada_saida) = 'Saida'
          AND d.pedido > 0
        GROUP BY TRIM(d.nf)
    ) dsp
      ON dsp.nf_chave = TRIM(nf.numero_nota || '-' || nf.serie_nota)
) b
WHERE COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE), -1)
  AND COALESCE(b.nf_data, b.cte_data) < ADD_MONTHS(TRUNC(SYSDATE), 1)
ORDER BY
    b.cte_data DESC,
    b.cte_numero,
    b.cte_serie,
    b.nf_numero,
    b.nf_serie






---

## 23. Dashboard de frete sobre a mercadoria (01/10/2026)

### 23.1 A regra de negócio

O frete deve ficar **entre 1,5% e 2,0%** do valor da mercadoria transportada. A tela passou a
classificar cada CT-e nessa regra:

| Faixa | Regra | Cor |
| --- | --- | --- |
| até 1,5% | `pct <= 1.5` | verde |
| **na faixa (1,5% a 2,0%)** | `1.5 < pct <= 2.0` | laranja |
| acima de 2,0% | `pct > 2.0` | vermelho |
| sem dado | falta frete ou mercadoria | cinza |

Os limites são **inclusivos no topo de cada faixa**: 1,5% exato ainda é "até 1,5%" e 2,0% exato
ainda está "na faixa", porque a regra é "passou de 1,5" e "passou de 2". Os limites vivem em
`FRETE_PCT_MINIMO` / `FRETE_PCT_MAXIMO` (`components/utils.ts`), não como números soltos no JSX.

### 23.2 De onde vem o percentual

```
frete % = cte_valor_total / soma_nf_do_cte * 100
```

- **Numerador é `cte_valor_total`**, e não `cte_valor_frete`: o campo de frete do cabeçalho chega
  zerado no endpoint, enquanto o total do CT-e está preenchido em 100% das linhas e já é o valor
  rotulado "Frete" na tela e no CSV. Remedido nas duas janelas: `cte_valor_frete > 0` em **0/70**
  linhas e `cte_valor_total > 0` em **70/70** (na janela de 60 dias eram 0/185 e 185/185).
- **Denominador é a soma das NF-e do CT-e**, não o rateio dos itens.
- Arredondamento em 2 casas (`arredondar2`), igual ao `ROUND` que a SQL usava antes.

Esse número já existia na tela como `pct_cte_sobre_total_nfs`, exibido como "0,80% das NFs" - sem cor
e com um rótulo que não dizia que era frete. Agora virou selo colorido no cabeçalho de cada CT-e
(`BadgeFaixaFrete`, com `aria-label` descritivo) e em card próprio do dashboard.

> Os "100,00%" que aparecem na tabela **não são esse número**: são `pct_nf_no_total_cte` /
> `nf_pct_rateio_no_cte`, o peso da NF-e dentro do CT-e. Com uma única NF-e por CT-e dá 100% por
> construção, e é por isso que o número "100%" aparecia na tela sem dizer nada sobre frete.

### 23.3 Por que a média e não o ratio agregado

Nos breakdowns por transportadora e por região, a métrica é a **média do frete % CT-e a CT-e**,
não `Σ frete ÷ Σ mercadoria`. As duas medidas discordam bastante (janela publicada, 70 CT-es):

| Transportadora | CT-es | Σ frete ÷ Σ NF-e | média por CT-e | ≤1,5% | 1,5–2,0% | >2,0% |
| --- | --- | --- | --- | --- | --- | --- |
| SORRISO TRANSPORTES | 64 | 0,29% | 1,34% | 32 | 23 | 9 |
| TRANSPORTES OURO NEGRO LTDA | 2 | 1,64% | 1,97% | 1 | 0 | 1 |
| EXPRESSO SAO MIGUEL S/A | 2 | 4,99% | 35,47% | 0 | 0 | 2 |
| ANESI TRANSPORTES | 1 | 6,31% | 6,31% | 0 | 0 | 1 |
| RODOVIARIO CAMILO DOS SANTOS | 1 | 4,49% | 4,49% | 0 | 0 | 1 |

A SORRISO é o caso que prova o ponto: o ratio agregado diz 0,29% (verde, "ótimo") porque uma única
NF-e de valor muito grande puxa a soma para baixo, enquanto a média por CT-e diz 1,34% — e há **9
CT-es acima de 2%** dentro dela. O ratio também subestima a EXPRESSO por 7x (4,99% contra 35,47%).
Como a regra é avaliada CT-e a CT-e, a média é a medida comparável entre grupos.

Por isso as tabelas mostram **quantos CT-es caem em cada faixa** (a contagem é a informação
acionável) ao lado da média, e não um único número.

### 23.4 Distribuição real medida

Na janela publicada (dois meses fechados, `[2026-09-01, 2026-11-01)`) são 70 CT-es, todos de
setembro — outubro ainda não tinha CT-e no dia da medição:

| Faixa | CT-es | % |
| --- | --- | --- |
| até 1,5% | 33 | 47% |
| na faixa (1,5% a 2,0%) | 23 | 33% |
| acima de 2,0% | 14 | 20% |

**Só 33% dos CT-es estão no intervalo esperado** — um em cada três. Os outliers são erro de cadastro
no ERP, não frete real (EXPRESSO SAO MIGUEL com média de 35,47% em 2 CT-es): a tela os deixa visíveis
em vez de escondê-los, porque é justamente o que a regra precisa mostrar.

### 23.5 Região: é a do cliente, não a do CT-e

O agrupamento por região usa **`nf_od_regiao`**, que é a região do cliente/atendente da ordem de
despacho (`pmdvw_vendas.nome_regiao`). Na janela publicada são 16 regiões distintas mais a linha
**"Sem região"**, preenchidas em 69/70 linhas; o único CT-e sem a informação aparece em "Sem região"
em vez de sumir. São Paulo concentra 39 dos 70 CT-es.

A origem e o destino do CT-e **não são opção**: `cte_cod_cidade_origem` e `cte_cod_cidade_destino`
chegam como código de cidade (100% preenchido), e não existe no PDM um mapa de código -> região.
Trazer a região do CT-e exigiria mudar a SQL.

Quando um CT-e tem NFs de clientes de regiões diferentes, o grupo fica com a **primeira região
preenchida** - mesmo tratamento já usado para transportadora e tomador.

### 23.6 BUG CORRIGIDO: "Total dos CT-es" somava o frete por NF-e

O card somava `cte_valor_total` **dentro do laço por linha de NF-e**:

```ts
// ERRADO - contava o frete do CT-e uma vez por NF-e
totalFrete += linha.cte_valor_total || 0
```

`cte_valor_total` é o total **do CT-e**, não da NF-e. Num CT-e com duas NF-e, o mesmo frete era
somado duas vezes. Medido em 01/10/2026 na janela anterior (60 dias), que tinha 183 CT-es / 184
NF-e:

| | Valor |
| --- | --- |
| Card antes | R$ 48.086,99 |
| Correto (1x por CT-e) | **R$ 45.048,85** |
| Infla | R$ 3.038,14 (**6,7%**) |

O valor bruto R$ 48.286,98 (citado no estudo inicial) era a soma sobre as 185 linhas **antes** da
deduplicação da seção 22; com a NF duplicada removida sobram R$ 3.038,14 de duplicação, do CT-e
11757-1 (R$ 3.038,14 de frete em duas NF-e).

> **O bug é latente: não aparece todo dia.** Na janela de 2 meses publicada **não existe nenhum CT-e
> com 2+ NF-e** (70 CT-es / 70 NF-e), então a soma por linha e a soma por CT-e dão o mesmo
> R$ 13.688,92 e a diferença é R$ 0,00. Ele só aparece quando um CT-e transporta mais de uma NF-e —
> que foi o caso do CT-e 11757-1. Por isso a correção fica mesmo sem "problema visível" na tela: o
> número de hoje estaria certo por acidente, e voltaria a errar na primeira NF-e dupla.

**Correção** (`calcularResumo`): guardar o frete uma vez por chave de CT-e e somar depois do laço.

```ts
if (!fretePorCte.has(chave)) fretePorCte.set(chave, linha.cte_valor_total || 0)
// ...
for (const frete of fretePorCte.values()) totalFrete += frete
```

O card **"Rateio dos itens" NÃO foi alterado**: `nf_item_valor_total` é o rateio **da NF-e**, e
somar por linha é o comportamento correto. Há teste de regressão para as duas coisas em
`utils.test.ts` ("soma o frete do CT-e uma vez" e "mantém a soma do rateio por NF-e").

### 23.7 O que entrou na tela

`components/dashboard.tsx` substituiu os 6 cards antigos:

- **Resumo do período** (7 cards): NF-e, CT-es, Mercadoria, Frete total, Rateio dos itens,
  NF-e com valor, Rateio divergente.
- **Faixa de frete** (4 cards): até 1,5% / na faixa / acima de 2,0% / sem dado, com a contagem de
  CT-es e uma legenda embaixo dizendo quantos estão na faixa esperada.
- **Breakdowns** em abas (`Transportadora` | `Região do cliente`): CT-es, frete médio, % na faixa e
  uma barra empilhada com a proporção em cada faixa (`title` com os números exatos).

A contagem de "NF-e em ordem de despacho", que estava num card, desceu para a linha de resumo em
texto logo abaixo do dashboard, para não perder a informação sem virar um 8o card.

### 23.8 Como remedir depois de mexer no SQL

`node scripts/verificar-rel-nf-cte.js` (read-only) lê a integração `api_rel_nfe_cte_periodo`, pede
o token, pagina o relatório e refaz **no console os mesmos cálculos do dashboard**: volume e
duplicatas, janela de dois meses contra `[1o dia do mês anterior, 1o dia do mês seguinte)`,
cobertura de `cte_valor_total`/`cte_valor_frete`/`nf_valor_total`, soma do frete por linha × por CT-e,
distribuição das faixas, regiões e a tabela de transportadora com ratio agregado × média.

Sai com código 1 se alguma linha cair fora da janela ou se o endpoint responder erro. Foi ele que
mediu os números das seções 23.2 a 23.6 depois da publicação de 01/10/2026. Aceita `--db=` para
trocar de banco (`pdm_textil`, `pdm_pro_textil`, `pdm_ibirapuera`, `neon`).

## 24. Leiga na tela: rateio, % do CT-e, filtro de regiao, drill-down e PDF (01/10/2026)

Cinco pedidos do dono da tela, todos na mesma entrega. O ponto em comum: os numeros ja existiam,
o que faltava era explicacao e caminho para chegar no CT-e.

### 24.1 O "100,00% do CT-e" embaixo do valor da nota

O texto embaixo do valor da nota nao e o frete: e `nf_pct_rateio_no_cte`, a fatia do **rateio dos
itens** daquela nota dentro do CT-e. `100,00%` significa "esta nota levou tudo o que foi rateado
no CT-e". Como o leigo lia isso como "o frete desta nota", virou um `InfoButton` ao lado com o
conteudo `rateioCteInfoContent` (`src/lib/info-content/ferramentas.ts`), que explica em uma frase o
que e rateio e da 3 exemplos.

O `% NO CT-e` da coluna passou a se chamar **`% do CT-e`** (e a coluna `pct_nf_no_total_cte`, a fatia
da NOTA dentro do CT-e). As duas somam 100% dentro de um CT-e, por isso os nomes precisam ficar
distintos.

`InfoButton` ganhou `label?: string` (default `"Informacoes da tela"`) para o botao poder ter nome
proprio em vez de repetir o texto generico.

### 24.2 Nova coluna `% CT-e sobre a nota`

`pct_cte_sobre_total_nfs` (total do CT-e / soma das NF-e do CT-e), com `BadgeFaixaFrete` na mesma
faixa da regra: ate 1,5% verde, 1,5% a 2,0% laranja, acima de 2,0% vermelho. O valor e do CT-e, nao
da nota, entao repete nas NF-e do mesmo CT-e.

A coluna ja existia como texto no cabecalho do card do CT-e e no CSV; agora ela esta **linha a linha**,
que era o que faltava para achar o CT-e problematico sem abrir o card.

O rodape do CT-e mudou junto: `somaNf` (a soma das notas) estava embaixo de `% do CT-e`, que e
percentual. Agora a soma das notas fica sob `Valor da nota`, o rateio sob `Rateio`, a soma das fatias
(`somaPctNf`, que fecha em 100%) sob `% do CT-e` e o selo sob a coluna nova.

### 24.3 Card `Percentual total`

`resumo.totalFrete / mercadoriaTotal * 100` no card novo, com o sufixo `frete / mercadoria`.

Atencao ao contraste com a secao 23.3: nos breakdowns por transportadora e regiao a metrica continua
sendo a **media por CT-e**, porque ali o ratio agregado distorce. No total do periodo o ratio e a
leitura natural, e e o numero que o dono reconhece. O comentario no codigo registra isso para ninguem
"consertar" depois.

### 24.4 Filtro de regiao e o alcance do filtro de data

- **`Regiao do cliente`** (select novo na toolbar, junto de `Transportadora`): `filtrarPorRegiao`
  resolve a regiao do CT-e pela **primeira `nf_od_regiao` preenchida** -- a mesma regra de
  `agruparPorCte` -- e mantem **todas** as NF-e do CT-es escolhido. Filtrar por linha deixaria o card
  do CT-e pela metade. As opcoes saem de `nomeRegiaoDistinct(agruparPorCte(itens))`, sobre os itens
  carregados e nao sobre os ja filtrados, para o select nao sumir a opcao selecionada.
- **O filtro De/Ate ja mudava a tela inteira** (dashboard, grade e resumo saem de `filtrados`), mas
  ele so **reduz** a janela de dois meses que o endpoint traz -- a janela esta fixa no SQL do
  Systextil (secao 21.1). Um periodo fora dela devolvia "Nenhuma NF-e" sem explicar o porque. Agora
  `alcanceCarregado(itens)` mostra `O relatorio carregado cobre DD/MM/AAAA a DD/MM/AAAA` na tela
  vazia. Para **ampliar** o periodo seria preciso parametro de data no endpoint -- nao foi feito.
- A tela vazia tambem passou a distinguir "periodo sem resultado" de "filtro sem resultado"
  (`filtrosAtivos`).

### 24.5 Drill-down e PDF dos CT-es selecionados

Clicar num card abre `ModalCtes` (`components/modal-ctes.tsx`) com a listagem dos CT-es do recorte:
numero, emissao, transportadora, n de NF-e, mercadoria, frete e o selo de faixa. O recorte vem de:

- cards de **resumo** (`onDetalhe`): NF-e, CT-es, Mercadoria, Frete total, Percentual total e Rateio
  dos itens abrem todos os CT-es; `NF-e com valor` e `Rateio divergente` abrem so os CT-es que tem
  valor / os divergentes;
- cards de **faixa** de frete sobre a mercadoria;
- linhas dos **breakdowns** de transportadora e de regiao.

No modal, checkbox por CT-e (+ "selecionar todos"), orientacao retrato/paisagem e `Gerar PDF (N)`.

`components/cte-pdf.ts` segue o padrao do romaneio: `jspdf` + `jspdf-autotable` com import
dinamico, `carregarEmpresa()` em `/api/admin/config/empresa`, logo com fallback no
`/api/proxy-image`, header azul, box de identificacao, grade das NF-e rateadas e rodape por pagina.
`gerarPdfCte` (um CT-e) e `gerarPdfCtes` (consolidado, uma pagina por CT-e) seguem a mesma convencao
de nome do romaneio: `cte-195476.pdf` e `ctes-<lista ou faixa>.pdf`.

Diferencas em relacao ao romaneio: sem `any` (o modulo Comercial ja tinha resolvido isso com
`DocPdfComAutoTable`/`EmpresaConfig`/`LinhaTabela`, e o padrao foi copiado), e a tabela mostra o
rateio e os dois percentuais por NF-e em vez de rolos/mettragem.

Os cards viraram `<button>` com `aria-label` proprio (`Ver os CT-es de Frete total`) -- o nome
acessivel antes era so o rotulo, que deixava "NF-e" e "NF-e com valor" indistinguiveis para leitor de
tela. Sem `aria-label` explicito, o nome vem do conteudo e o `title` nao conta.

### 24.6 BUG: frete R$ 0,00 nos modais e no PDF

O modal de CT-es e o PDF mostravam `R$ 0,00` na coluna Frete. Causa: os dois liam
`GrupoCte.valorFrete`, que vem de `cte_valor_frete` -- e esse campo **nao vem preenchido**
(medido em 01/10/2026 na janela publicada: 0 de 70 linhas com valor > 0). O frete deste relatorio
e `cte_valor_total`, que ja era o que o card da grade usava ("Frete"), o que `calcularResumo` soma
uma vez por CT-e e o que `pct_cte_sobre_total_nfs` usa no numerador -- por isso as faixas e o card
"Frete total" apareciam certos enquanto o modal aparecia errado.

Corrigido com `freteCte(grupo)` em `utils.ts`, que fixa a fonte em um lugar so (documentado com o
numero da medicao). Tela e PDF passam por ele, e ha trava em `utils.test.ts` ("ignora
`cte_valor_frete` mesmo quando ele vem preenchido") mais uma no `page.test.tsx` que usa o
`cte_valor_frete: 0` real do endpoint.

Regra: **nunca ler `GrupoCte.valorFrete` para exibir frete.** Ele existe no tipo porque o endpoint
projeta a coluna; o valor confiavel e `freteCte()`.

## 25. Atalhos de periodo (select "Periodo") + janela de 12 meses

O SQL publicado em 02/10/2026 trocou a janela fixa de 2 meses por 12 meses rolantes:

```sql
COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -12)
AND COALESCE(b.nf_data, b.cte_data) <  ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
```

Ou seja: do dia 1 do mes ha 12 meses ate o fim do mes corrente. O endpoint **sempre**
devolve essa janela, independente do periodo enviado - o filtro de data da tela segue
reduzindo no cliente, nunca ampliando (a barra mostra "Carregado: ... a ...").

### Atalhos

Select "Periodo" antes dos campos De/Ate. Escolher um atalho preenche as duas datas:

| Atalho | De | Ate |
|---|---|---|
| Ultimos 12 meses (padrao) | dia 1 do mes ha 12 meses | hoje |
| Ultimos 6 meses | dia 1 do mes ha 6 meses | hoje |
| Ultimo trimestre | dia 1 do mes ha 3 meses | hoje |
| Ano atual | 1o de janeiro | hoje |
| Mes atual | dia 1 do mes | hoje |
| Mes anterior | dia 1 do mes anterior | ultimo dia do mes anterior |
| Ultimos 7 dias | hoje - 6 | hoje |
| Ontem | ontem | ontem |
| Hoje | hoje | hoje |
| Personalizado | - | - |

- `periodoPadrao()` virou "ultimos 12 meses" (era 2 meses) para casar com a janela do
  endpoint e nao deixar linha de fora na primeira consulta.
- "Personalizado" nao e atalho: `presetQueCombinaCom()` devolve `null` quando o periodo
  nao bate com nenhum atalho, e a tela entra nele quando alguem digita a data na mao. Se
  a data digitada bater com um atalho, ele volta a aparecer marcado - select que mente
  sobre o periodo vigente e pior do que select sem atalho.
- Os dois botoes "Ultimos 2 meses" / "Mes corrente" foram removidos: o select cobre os
  dois casos e os dois presets.

### Paginao: teto elevado e aviso de truncamento

`MAX_PAGINAS` foi de 20 para 100 (2.000 -> 10.000 linhas). Com 12 meses o esperado sao
~1.100 NF-e, mas o teto agora e' alto o bastante para o ano inteiro; e se mesmo assim
bater, `buscarTodasPaginas` avisa por `aoTruncar` e a tela mostra "Resultado truncado em
N linhas - reduza o periodo para ver os totais completos". Antes o corte era calado, o que
daria total errado sem nenhum aviso.

## 26. Aba "Ordens de despacho" (03/10/2026)

Segunda aba da tela `/ferramentas/nfe-cte`. **A aba de CT-e nao foi mexida**: ela continua
sendo a aba inicial, com dashboard, grade, resumo, exportacao e PDF exatamente como antes.
A aba nova reaproveita os mesmos filtros (periodo, transportadora, regiao, busca).

### Fonte dos dados: os campos `nf_od_*` do proprio CT-e

O endpoint dedicado `api_ordem_despacho` (integracao 8, tela `ordem-despacho`) **nao foi
usado**. Ele devolve ~8-9 mil registros com chave minuscula (`NF_OD_PEDIDO`,
`NF_OD_ROMANEI`, ...), aceita **somente** `limit`/`offset` (os filtros `NF_OD_DATA_INI`/
`NF_OD_DATA_FIM` e `order by` sao ignorados) e cada pagina leva 8-12 s. Paginaria tudo
para filtrar e ordenar no navegador.

A aba usa o payload que a tela **ja carrega**: cada linha CT-e x NF-e vem acompanhada dos
`nf_od_*`. Custo zero de rede. Medicao real no recorte de 12 meses (03/10/2026): 930 linhas
apos dedupe, **907 com `NF_OD_PEDIDO > 0`**, virando 300 cargas.

Consequencia a ter em mente: a aba so mostra NF-e que **tambem tem CT-e** dentro da janela
carregada. NF-e despachada sem CT-e nao aparece (e nao da para dizer "total de despacho do
periodo" sem o endpoint dedicado).

### O que cada campo significa (aqui errou a primeira vez)

Os nomes do endpointpem `QTDE`/`QTDE_ROLOS` e induzem a leitura errada. O que o SQL entrega
(ver o CTE `dsp` do relatorio):

| Campo da tela | Origem no SQL | Granularidade | O que e' |
| --- | --- | --- | --- |
| `nf_od_qtde` | `dsp.qtde_saida` = `SUM(qtde_saida)` do `pmdvw_nfs` | **por NF-e** (`GROUP BY nf`) | **metros** faturados/despachados da nota |
| `nf_od_valor` | `dsp.valor_saida` | por NF-e | valor da nota |
| `nf_od_data` | `dsp.data_movto` | por NF-e | data do despacho |
| `nf_od_qtde_rolos` | `rol.qtde_rolos` = `COUNT(DISTINCT codigo_rolo)` do `pmdvw_rolos` | **por pedido** | **volumes (rolos)** do romaneio |
| `nf_od_peso_*` | `rol.peso_*` do `pmdvw_rolos` | por pedido | peso do romaneio |

Confirmado nos dados: `QTDE_ROLOS` 7, 8, 49, 81 (inteiros pequenos) e `QUANTIDADE`/`qtde_saida`
1410, 4064, 3906 (metros). Mediana de **200 m por volume** (p10 88, p90 700).

A metragem despachada **nao esta no pedido**: o pedido e' a fase anterior da nota (e'
romaneado e depois faturado) e nao e' atendido com a metragem exata dele. Por isso os metros
saem da **nota** (`nf_od_qtde`), nunca do pedido. Volumes e peso, ao contrario, sao do
romaneio do pedido - e por isso nao podem ser somados nota a nota.

### Regra de agrupamento: transportadora + dia

Ordem de despacho e' a **carga**: as NF-e que sairam no mesmo dia pela mesma transportadora.
Medido nas 907 NF-e despachadas:

| Chave | Grupos | Distribuicao |
| --- | --- | --- |
| **transportadora + data** | **300** | 125 com 1 NF-e; a maior com 12 NF-e, 12 pedidos e 12 cidades |
| pedido + romaneio (versao errada) | 884 | 870 com uma unica NF-e |

Por pedido+romaneio a tela virava uma lista de notas - que nao e' o documento de quem opera
o despacho. `chaveOrdemDespacho = transportadora + "|" + nf_od_data`.

Detalhes da carga:

- Entra so linha com `nf_od_pedido > 0` (`nfTemDespacho`): `PEDIDO = 0` e' o placeholder da
  base para NF-e que nao entrou em ordem nenhuma.
- **Uma carga pode ter varias notas, varios pedidos e varios destinos** (138 das 300 cargas
  tem 1 cidade; a maior tem 12). O cabecalho mostra os destinos, com `+N` quando sao muitos.
- `pedido` e `romaneio` ficam **na nota**, nao na ordem.
- Transportadora vem dos campos `cte_*` da linha via `nomeTransportadora` (mesma funcao do
  cabecalho do CT-e).
- Ordenacao: data da carga (BR `dd/mm/aaaa`, via `parseDataBr`) decrescente.

### Volumes e pesos contam uma vez por romaneio

`qtde_rolos`/`peso_*` sao **do pedido**, e o endpoint repete o mesmo valor em todas as NF-e
desse pedido (13 de 14 pedidos com 2+ NF-e medidos). Pior: 12 desses 14 pedidos tem NF-e em
**dias diferentes** - sem trava, os mesmos 13 volumes do pedido apareceriam em duas cargas.

Solucao: `agruparOrdensDespacho` ordena as linhas por data (mais antiga primeiro) e mantem um
`Set` de romaneios ja contabilizados. O romaneio e' somado **so na carga da NF-e mais
antiga**; as outras notas do mesmo romaneio entram com `repetido: true` e `volumes: null`, e a
tela mostra um travessao com `title` explicando. Metros e valor, por serem por NF-e, somam
normalmente em todas as notas.

### Totais e "sem despacho"

4 cards: Ordens de despacho, Notas despachadas, Volumes (rolos) e Metros; o valor total vai
no texto de apoio ("Total despachado R$ ..."). Mais `semDespacho`: quantas NF-e do recorte
**nao** entraram em ordem (`semDespacho = linhas - comDespacho`) - explica o "pedido 0 na
base", que e' assim que a base representa NF-e sem despacho.

Vazio: "Nenhuma ordem de despacho no recorte" + a contagem de NF-e sem despacho.

### Detalhe da carga

Cartao expansivel: cabecalho com data, transportadora, destinos e o resumo (volumes, metros,
pesos, valor); e a lista das notas (numero, pedido, romaneio, destino, volumes, metros,
valor). Via `title` no travessao e nota de rodape, a tela diz que volumes/peso sao totais do
pedido/romaneio e por isso aparecem uma vez so.

### Arquivos

- `components/types.ts` - `NotaDespacho`, `OrdemDespacho`, `ResumoDespacho`.
- `components/utils.ts` - `chaveOrdemDespacho`, `agruparOrdensDespacho`,
  `resumoOrdensDespacho`.
- `components/aba-ordens-despacho.tsx` - a aba.
- `page.tsx` - `ABAS`, `abaAtiva` e o render condicional.

### Pegadinha de teste

Os fixtures de `page.test.tsx` nao podem repetir `cte_numero` + `nf_numero`: `deduplicarPorCteNf`
mantem a **primeira** linha da chave, entao a segunda versao do mesmo CT-e x NF-e e'
descartada - foi assim que `comDespacho` sumia por ter o mesmo par de `semValores`.

### Medicao: `scripts/tmp-diag-od-ordem.js` (temporario, nao commitado)

Mesma autenticacao de `scripts/verificar-rel-nf-cte.js` (token OAuth2 + `limit`/`offset` na
integracao `api_rel_nfe_cte_periodo`). Foi ele que mediu as duas tabelas acima e mostrou que
os rolos/pesos repetem por NF-e do pedido.
