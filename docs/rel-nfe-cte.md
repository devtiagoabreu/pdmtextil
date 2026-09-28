# Relatório NF-e → CT-e — Por Período

> Documento de referência com o SQL oficial.
> Lista **todas as NFs que possuem CT-e** dentro de um período, com razão social de
> transportadora, tomador e fornecedor, e o percentual de cada NF no total do CT-e.

**Arquivo do SQL pronto para o programador usar:**
[`docs/rel-nf-cte.sql`](./rel-nf-cte.sql) → **Select 3**

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
`nf_valor_total` e `nf_data` vieram preenchidos em **9 linhas**; `nf_fornecedor_razao` em 72.
O motivo está em §6: o `LEFT JOIN` com a `OBRF_010` da NF-e só acha o cabeçalho quando o CNPJ
(`CGC_CLI_FOR_9/4/2`) bate com o fornecedor do relacionamento.

Por isso a tela **recalcula** a soma das NFs e o percentual do CT-e no cliente
(`agruparPorCte`) e rotula como `(calculada)` / `(calculado)` tudo o que não veio da API —
assim não se confunde valor do ERP com valor derivado.

### A faixa padrão do endpoint é fixa no servidor

Sem parâmetros a API devolve de 01/08/2026 a 31/08/2026 (somente agosto no dia da verificação).
A tela aplica por cima o período escolhido, com padrão de **últimos 2 meses**, então o filtro
real tem alcance maior que o da API.
