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



