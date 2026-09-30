/* ============================================================================
 *  RELATORIO: NFs com CT-e por periodo
 *  Systextil  |  OBRF_016 + OBRF_010 + SUPR_010
 *  Bind variables: :DATA_INI / :DATA_FIM
 *
 *  ---------------------------------------------------------------------------
 *  v1 (rodando hoje no endpoint api_rel_nfe_cte_periodo) — 3 defeitos:
 *
 *   1) LEFT JOIN OBRF_010 nfe exigia  nfe.CGC_CLI_FOR_9/4/2 = nf.FORNECEDOR9/4/2
 *      Em 208 linhas reais o cabecalho da NF-e foi encontrado em 9. Consequencia:
 *      NF_DATA, NF_VALOR_TOTAL, NF_FRETE_RATEADO, NF_SITUACAO, SOMA_NF_DO_CTE,
 *      PCT_NF_NO_TOTAL_CTE e PCT_CTE_SOBRE_TOTAL_NFS vieram nulos em 199 linhas.
 *      A CGC_CLI_FOR da nota e o codigo do *cliente* (comprador); o FORNECEDOR da
 *      OBRF_016 e o *emissor*. Em nota de saida as duas coisas nao sao iguais, e
 *      o ON nunca casa.
 *
 *   2) CTE_TOMADOR_* (CGC_CLI_FOR do CT-e) funcionava, mas nao havia nenhuma coluna
 *      com a razao social do *cliente da NF*. O nome do fornecedor vinha da
 *      SUPR_010 pela chave FORNECEDOR da OBRF_016 (72/208) — que e outra chave.
 *
 *   3) As janelas SUM(...) OVER eram calculadas sobre nfe.TOTAL_DOCTO (nulo),
 *      portanto SOMA_NF_DO_CTE e os percentuais vinham nulos mesmo quando a nota
 *      existia. A v2 calcula as janelas sobre o total ja resolvido.
 *
 *  ---------------------------------------------------------------------------
 *  v2 (esta):
 *
 *   - `cab`: CTE que garante 1 linha por (DOCUMENTO, SERIE) da OBRF_010,
 *     preferindo especie de NF. Como e 1 linha por chave, os 3 LEFT JOIN abaixo
 *     NAO duplicam linhas do relatorio.
 *
 *   - 3 caminhos para achar o cabecalho da NF, nesta ordem, e o caminho usado
 *     sai na coluna NF_CAB_ORIGEM para diagnostico:
 *       c1  CNPJ_FORNECEDOR  -> documento+serie+FORNECEDOR da OBRF_016 (nota de entrada)
 *       c2  CNPJ_CLIENTE_NF  -> documento+serie+CGC_CLI_FOR do proprio CT-e
 *                               (nota de saida: o comprador da NF e o tomador do CT-e)
 *       c3  DOCUMENTO_SERIE  -> documento+serie (ultimo recurso)
 *
 *   - NF_CLIENTE_RAZAO / NF_CLIENTE_FANTASIA: razao social do cliente pelo CGC da
 *     propria nota (o que o v1 nao trazia).
 *
 *   CONFERIR ANTES: a lista de especies de documento aceitas esta no bloco de
 *   auditoria 3 no fim deste arquivo. Se `UPPER(especie_docto) LIKE 'NF%'` nao
 *   pegar a especie da NF-e, ajustar o ORDER BY da CTE `cab`.
 * ========================================================================== */
WITH cab AS (
    SELECT documento,
           serie,
           cgc_cli_for_9,
           cgc_cli_for_4,
           cgc_cli_for_2,
           data_emissao,
           total_docto,
           valor_frete,
           situacao_entrada
      FROM ( SELECT o.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY o.documento, o.serie
                        ORDER BY CASE WHEN UPPER(o.especie_docto) LIKE 'NF%' THEN 0 ELSE 1 END,
                                 CASE WHEN o.cgc_cli_for_9 IS NOT NULL THEN 0 ELSE 1 END,
                                 o.data_emissao DESC NULLS LAST
                    ) rn
               FROM OBRF_010 o
            )
     WHERE rn = 1
)
SELECT b.cte_numero,
       b.cte_serie,
       TO_CHAR(b.cte_data, 'DD/MM/YYYY')                                    AS cte_data,
       b.cte_valor_total,
       SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie)  AS soma_nf_do_cte,
       ROUND(b.cte_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_cte_sobre_total_nfs,
       b.cte_valor_frete,
       b.cte_situacao,
       b.cte_transportadora_razao,
       b.cte_transportadora_fantasia,
       b.cte_tomador_razao,
       b.cte_tomador_fantasia,

       b.nf_numero,
       b.nf_serie,
       TO_CHAR(b.nf_data, 'DD/MM/YYYY')                                    AS nf_data,
       b.nf_valor_total,
       ROUND(b.nf_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_nf_no_total_cte,
       b.nf_frete_rateado,
       b.nf_situacao,
       b.nf_cliente_razao,
       b.nf_cliente_fantasia,
       b.nf_fornecedor_razao,
       b.nf_fornecedor_fantasia,
       b.nf_cab_origem
  FROM ( SELECT cte.documento                              AS cte_numero,
                cte.serie                                  AS cte_serie,
                cte.data_emissao                           AS cte_data,
                cte.total_docto                            AS cte_valor_total,
                cte.valor_frete                            AS cte_valor_frete,
                cte.situacao_entrada                       AS cte_situacao,
                transp.nome_fornecedor                     AS cte_transportadora_razao,
                transp.nome_fantasia                       AS cte_transportadora_fantasia,
                tomador.nome_fornecedor                    AS cte_tomador_razao,
                tomador.nome_fantasia                      AS cte_tomador_fantasia,
                nf.numero_nota                             AS nf_numero,
                nf.serie_nota                              AS nf_serie,
                COALESCE(c1.data_emissao, c2.data_emissao, c3.data_emissao)  AS nf_data,
                COALESCE(c1.total_docto,  c2.total_docto,  c3.total_docto)   AS nf_valor_total,
                COALESCE(c1.valor_frete,  c2.valor_frete,  c3.valor_frete)   AS nf_frete_rateado,
                COALESCE(c1.situacao_entrada, c2.situacao_entrada, c3.situacao_entrada) AS nf_situacao,
                CASE WHEN c1.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR'
                     WHEN c2.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF'
                     WHEN c3.documento IS NOT NULL THEN 'DOCUMENTO_SERIE'
                     ELSE 'SEM_CABECALHO' END            AS nf_cab_origem,
                /* razao social do CLIENTE da NF: pelo CGC da propria nota */
                cli.nome_fornecedor                        AS nf_cliente_razao,
                cli.nome_fantasia                          AS nf_cliente_fantasia,
                /* razao social do EMISSOR: pela chave FORNECEDOR da OBRF_016 */
                forn.nome_fornecedor                       AS nf_fornecedor_razao,
                forn.nome_fantasia                         AS nf_fornecedor_fantasia
           FROM obrf_016 rel
           JOIN obrf_010 cte
             ON cte.documento      = rel.num_conhecimento
            AND cte.serie          = rel.ser_conhecimento
            AND cte.especie_docto  = 'CTE'
           JOIN obrf_016 nf
             ON nf.num_conhecimento = rel.num_conhecimento
            AND nf.ser_conhecimento = rel.ser_conhecimento
           LEFT JOIN cab c1
             ON c1.documento      = nf.numero_nota
            AND c1.serie          = nf.serie_nota
            AND c1.cgc_cli_for_9  = nf.fornecedor9
            AND c1.cgc_cli_for_4  = nf.fornecedor4
            AND c1.cgc_cli_for_2  = nf.fornecedor2
           LEFT JOIN cab c2
             ON c2.documento      = nf.numero_nota
            AND c2.serie          = nf.serie_nota
            AND c2.cgc_cli_for_9  = cte.cgc_cli_for_9
            AND c2.cgc_cli_for_4  = cte.cgc_cli_for_4
            AND c2.cgc_cli_for_2  = cte.cgc_cli_for_2
           LEFT JOIN cab c3
             ON c3.documento      = nf.numero_nota
            AND c3.serie          = nf.serie_nota
           LEFT JOIN supr_010 cli
             ON cli.fornecedor9  = COALESCE(c1.cgc_cli_for_9, c2.cgc_cli_for_9, c3.cgc_cli_for_9)
            AND cli.fornecedor4  = COALESCE(c1.cgc_cli_for_4, c2.cgc_cli_for_4, c3.cgc_cli_for_4)
            AND cli.fornecedor2  = COALESCE(c1.cgc_cli_for_2, c2.cgc_cli_for_2, c3.cgc_cli_for_2)
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
       ) b
 WHERE COALESCE(b.nf_data, b.cte_data) >= :DATA_INI
   AND COALESCE(b.nf_data, b.cte_data) <  :DATA_FIM + 1
 ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie;


/* ============================================================================
 *  AUDITORIA — rodar ANTES de publicar a v2, para confirmar a causa.
 *  Todas leem as mesmas tabelas do relatório, sem escrita.
 * ========================================================================== */

/* --- 1) O cabecalho da NF existe na OBRF_010? ------------------------------ */
SELECT COUNT(*)                                                       AS nfs,
       SUM(CASE WHEN (SELECT COUNT(*)
                        FROM obrf_010 x
                       WHERE x.documento = nf.numero_nota
                         AND x.serie     = nf.serie_nota) = 0
                THEN 1 ELSE 0 END)                                     AS sem_cabecalho,
       SUM(CASE WHEN (SELECT COUNT(*)
                        FROM obrf_010 x
                       WHERE x.documento = nf.numero_nota
                         AND x.serie     = nf.serie_nota) > 0
                THEN 1 ELSE 0 END)                                     AS com_cabecalho
  FROM obrf_016 rel
  JOIN obrf_010 cte
    ON cte.documento     = rel.num_conhecimento
   AND cte.serie         = rel.ser_conhecimento
   AND cte.especie_docto = 'CTE'
  JOIN obrf_016 nf
    ON nf.num_conhecimento = rel.num_conhecimento
   AND nf.ser_conhecimento = rel.ser_conhecimento
 WHERE cte.data_emissao >= :DATA_INI
   AND cte.data_emissao <  :DATA_FIM;


/* --- 2) Quando existe, qual CNPJ ele tem? --------------------------------- */
/*  Esperado na v2: NF_CAB_ORIGEM = CNPJ_FORNECEDOR (entrada) ou CNPJ_CLIENTE_NF (saida). */
/*  Trocar 35835/23479 por outras notas se precisar. */
SELECT nf.numero_nota,
       nf.serie_nota,
       nf.fornecedor9 || nf.fornecedor4 || nf.fornecedor2               AS cnpj_emissor_rel,
       cte.cgc_cli_for_9 || cte.cgc_cli_for_4 || cte.cgc_cli_for_2     AS cnpj_tomador_cte,
       (SELECT COUNT(*) FROM obrf_010 x
         WHERE x.documento = nf.numero_nota AND x.serie = nf.serie_nota) AS qtd_cab,
       (SELECT LISTAGG(x.especie_docto || '=' || TO_CHAR(x.cgc_cli_for_9) || '/'
                                || TO_CHAR(x.cgc_cli_for_4) || '/' || TO_CHAR(x.cgc_cli_for_2), ' | ')
          FROM obrf_010 x
         WHERE x.documento = nf.numero_nota AND x.serie = nf.serie_nota) AS cabecalhos
  FROM obrf_016 rel
  JOIN obrf_010 cte
    ON cte.documento     = rel.num_conhecimento
   AND cte.serie         = rel.ser_conhecimento
   AND cte.especie_docto = 'CTE'
  JOIN obrf_016 nf
    ON nf.num_conhecimento = rel.num_conhecimento
   AND nf.ser_conhecimento = rel.ser_conhecimento
 WHERE nf.numero_nota = 35835 AND nf.serie_nota = '1'
    OR nf.numero_nota = 23479 AND nf.serie_nota = '1';


/* --- 3) Especies de documento que existem na OBRF_010 ---------------------- */
/*  Serve para ajustar o `LIKE 'NF%'` da CTE `cab`.                          */
SELECT especie_docto,
       COUNT(*)                       AS qtd,
       MIN(documento)                 AS menor,
       MAX(documento)                 AS maior
  FROM obrf_010
 GROUP BY especie_docto
 ORDER BY qtd DESC;


/* --- 4) A chave FORNECEDOR da OBRF_016 esta preenchida? -------------------- */
/*  Se FORNECEDOR9/4/2 vier null, a razao social do emissor nunca vai existir. */
SELECT COUNT(*)                                   AS linhas,
       SUM(CASE WHEN fornecedor9 IS NULL THEN 1 ELSE 0 END) AS fornecedor9_nulo,
       SUM(CASE WHEN fornecedor9 = 0    THEN 1 ELSE 0 END) AS fornecedor9_zero
  FROM obrf_016;


/* --- 5) As duas chaves sao o mesmo espaco de codigo? ---------------------- */
/*  Confere se CGC_CLI_FOR_* (OBRF_010) e FORNECEDOR_* (SUPR_010) se cruzam.  */
SELECT (SELECT COUNT(*) FROM supr_010
         WHERE fornecedor9 = 44683019 AND fornecedor4 = 1 AND fornecedor2 = 55) AS achou_no_cadastro,
       (SELECT COUNT(*) FROM obrf_010
         WHERE cgc_cli_for_9 = 44683019 AND cgc_cli_for_4 = 1 AND cgc_cli_for_2 = 55) AS achou_no_documento
  FROM dual;


/* ============================================================================
 *  VERSOES PARA CONSOLE — sem bind variables
 *
 *  Ferramentas que rodam a query direto (SQLcl, PL/SQL Developer, SQL Query,
 *  console do ERP) devolvem ORA-20000 "Nao e possivel realizar testes com
 *  variaveis" quando a sentenca tem :DATA_INI / :DATA_FIM. Nessas ferramentas
 *  use as versoes abaixo, com as datas escritas.
 *
 *  Para o endpoint continuar usando bind variables — e o que deve ser
 *  publicado. As duas versoes produzem o mesmo resultado.
 *
 *  Trocar o periodo: alterar so as 2 datas do WHERE.
 *    agosto/2026  >= TO_DATE('01/08/2026','DD/MM/YYYY')  < TO_DATE('01/09/2026','DD/MM/YYYY')
 *    hoje         >= ADD_MONTHS(TRUNC(SYSDATE), -2)      < TRUNC(SYSDATE) + 1
 *    mes corrente >= TRUNC(SYSDATE, 'MM')                 < TRUNC(SYSDATE) + 1
 *  O fim e sempre exclusivo: o ultimo dia do periodo entra inteiro.
 * ========================================================================== */

/* --- 6) Auditoria 1 em versao console (agosto/2026) ------------------------ */
SELECT COUNT(*)                                                       AS nfs,
       SUM(CASE WHEN (SELECT COUNT(*)
                        FROM obrf_010 x
                       WHERE x.documento = nf.numero_nota
                         AND x.serie     = nf.serie_nota) = 0
                THEN 1 ELSE 0 END)                                     AS sem_cabecalho,
       SUM(CASE WHEN (SELECT COUNT(*)
                        FROM obrf_010 x
                       WHERE x.documento = nf.numero_nota
                         AND x.serie     = nf.serie_nota) > 0
                THEN 1 ELSE 0 END)                                     AS com_cabecalho
  FROM obrf_016 rel
  JOIN obrf_010 cte
    ON cte.documento     = rel.num_conhecimento
   AND cte.serie         = rel.ser_conhecimento
   AND cte.especie_docto = 'CTE'
  JOIN obrf_016 nf
    ON nf.num_conhecimento = rel.num_conhecimento
   AND nf.ser_conhecimento = rel.ser_conhecimento
 WHERE cte.data_emissao >= TO_DATE('01/08/2026', 'DD/MM/YYYY')
   AND cte.data_emissao <  TO_DATE('01/09/2026', 'DD/MM/YYYY');


/* --- 7) Relatorio v2 em versao console (agosto/2026) --------------------- */
WITH cab AS (
    SELECT documento, serie, cgc_cli_for_9, cgc_cli_for_4, cgc_cli_for_2,
           data_emissao, total_docto, valor_frete, situacao_entrada
      FROM ( SELECT o.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY o.documento, o.serie
                        ORDER BY CASE WHEN UPPER(o.especie_docto) LIKE 'NF%' THEN 0 ELSE 1 END,
                                 CASE WHEN o.cgc_cli_for_9 IS NOT NULL THEN 0 ELSE 1 END,
                                 o.data_emissao DESC NULLS LAST
                    ) rn
               FROM OBRF_010 o
            )
     WHERE rn = 1
)
SELECT b.cte_numero,
       b.cte_serie,
       TO_CHAR(b.cte_data, 'DD/MM/YYYY')                                    AS cte_data,
       b.cte_valor_total,
       SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie)  AS soma_nf_do_cte,
       ROUND(b.cte_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_cte_sobre_total_nfs,
       b.cte_valor_frete,
       b.cte_situacao,
       b.cte_transportadora_razao,
       b.cte_transportadora_fantasia,
       b.cte_tomador_razao,
       b.cte_tomador_fantasia,
       b.nf_numero,
       b.nf_serie,
       TO_CHAR(b.nf_data, 'DD/MM/YYYY')                                    AS nf_data,
       b.nf_valor_total,
       ROUND(b.nf_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_nf_no_total_cte,
       b.nf_frete_rateado,
       b.nf_situacao,
       b.nf_cliente_razao,
       b.nf_cliente_fantasia,
       b.nf_fornecedor_razao,
       b.nf_fornecedor_fantasia,
       b.nf_cab_origem
  FROM ( SELECT cte.documento            AS cte_numero,
                cte.serie                AS cte_serie,
                cte.data_emissao         AS cte_data,
                cte.total_docto          AS cte_valor_total,
                cte.valor_frete          AS cte_valor_frete,
                cte.situacao_entrada     AS cte_situacao,
                transp.nome_fornecedor   AS cte_transportadora_razao,
                transp.nome_fantasia     AS cte_transportadora_fantasia,
                tomador.nome_fornecedor  AS cte_tomador_razao,
                tomador.nome_fantasia    AS cte_tomador_fantasia,
                nf.numero_nota           AS nf_numero,
                nf.serie_nota            AS nf_serie,
                COALESCE(c1.data_emissao, c2.data_emissao, c3.data_emissao)             AS nf_data,
                COALESCE(c1.total_docto,  c2.total_docto,  c3.total_docto)              AS nf_valor_total,
                COALESCE(c1.valor_frete,  c2.valor_frete,  c3.valor_frete)              AS nf_frete_rateado,
                COALESCE(c1.situacao_entrada, c2.situacao_entrada, c3.situacao_entrada) AS nf_situacao,
                CASE WHEN c1.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR'
                     WHEN c2.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF'
                     WHEN c3.documento IS NOT NULL THEN 'DOCUMENTO_SERIE'
                     ELSE 'SEM_CABECALHO' END            AS nf_cab_origem,
                cli.nome_fornecedor        AS nf_cliente_razao,
                cli.nome_fantasia          AS nf_cliente_fantasia,
                forn.nome_fornecedor       AS nf_fornecedor_razao,
                forn.nome_fantasia         AS nf_fornecedor_fantasia
           FROM OBRF_016 rel
           JOIN OBRF_010 cte
             ON cte.documento     = rel.num_conhecimento
            AND cte.serie         = rel.ser_conhecimento
            AND cte.especie_docto = 'CTE'
           JOIN OBRF_016 nf
             ON nf.num_conhecimento = rel.num_conhecimento
            AND nf.ser_conhecimento = rel.ser_conhecimento
           LEFT JOIN cab c1
             ON c1.documento     = nf.numero_nota
            AND c1.serie         = nf.serie_nota
            AND c1.cgc_cli_for_9 = nf.fornecedor9
            AND c1.cgc_cli_for_4 = nf.fornecedor4
            AND c1.cgc_cli_for_2 = nf.fornecedor2
           LEFT JOIN cab c2
             ON c2.documento     = nf.numero_nota
            AND c2.serie         = nf.serie_nota
            AND c2.cgc_cli_for_9 = cte.cgc_cli_for_9
            AND c2.cgc_cli_for_4 = cte.cgc_cli_for_4
            AND c2.cgc_cli_for_2 = cte.cgc_cli_for_2
           LEFT JOIN cab c3
             ON c3.documento = nf.numero_nota
            AND c3.serie     = nf.serie_nota
           LEFT JOIN SUPR_010 cli
             ON cli.fornecedor9 = COALESCE(c1.cgc_cli_for_9, c2.cgc_cli_for_9, c3.cgc_cli_for_9)
            AND cli.fornecedor4 = COALESCE(c1.cgc_cli_for_4, c2.cgc_cli_for_4, c3.cgc_cli_for_4)
            AND cli.fornecedor2 = COALESCE(c1.cgc_cli_for_2, c2.cgc_cli_for_2, c3.cgc_cli_for_2)
           LEFT JOIN SUPR_010 transp
             ON transp.fornecedor9 = cte.transpa_forne9
            AND transp.fornecedor4 = cte.transpa_forne4
            AND transp.fornecedor2 = cte.transpa_forne2
           LEFT JOIN SUPR_010 tomador
             ON tomador.fornecedor9 = cte.cgc_cli_for_9
            AND tomador.fornecedor4 = cte.cgc_cli_for_4
            AND tomador.fornecedor2 = cte.cgc_cli_for_2
           LEFT JOIN SUPR_010 forn
             ON forn.fornecedor9 = nf.fornecedor9
            AND forn.fornecedor4 = nf.fornecedor4
            AND forn.fornecedor2 = nf.fornecedor2
       ) b
 WHERE COALESCE(b.nf_data, b.cte_data) >= TO_DATE('01/08/2026', 'DD/MM/YYYY')
   AND COALESCE(b.nf_data, b.cte_data) <  TO_DATE('01/09/2026', 'DD/MM/YYYY')
 ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie;



/* --- 8) Relatorio v2 SEM WITH, em um unico SELECT (runner mais simples) ----
 *  Formatada para o console de teste do ERP, que nao aceita bind variables
 *  (ORA-20000) e falhou com o WITH (ORA-00907). Sem comentario, sem ; final.
 *  Periodo: agosto/2026. Para outro periodo, trocar so as 2 datas do WHERE.    */SELECT b.cte_numero, b.cte_serie, TO_CHAR(b.cte_data, 'DD/MM/YYYY') AS cte_data, b.cte_valor_total, SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie) AS soma_nf_do_cte, ROUND(b.cte_valor_total / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0) * 100, 2) AS pct_cte_sobre_total_nfs, b.cte_valor_frete, b.cte_situacao, b.cte_transportadora_razao, b.cte_transportadora_fantasia, b.cte_tomador_razao, b.cte_tomador_fantasia, b.nf_numero, b.nf_serie, TO_CHAR(b.nf_data, 'DD/MM/YYYY') AS nf_data, b.nf_valor_total, ROUND(b.nf_valor_total / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0) * 100, 2) AS pct_nf_no_total_cte, b.nf_frete_rateado, b.nf_situacao, b.nf_cliente_razao, b.nf_cliente_fantasia, b.nf_fornecedor_razao, b.nf_fornecedor_fantasia, b.nf_cab_origem FROM ( SELECT cte.documento AS cte_numero, cte.serie AS cte_serie, cte.data_emissao AS cte_data, cte.total_docto AS cte_valor_total, cte.valor_frete AS cte_valor_frete, cte.situacao_entrada AS cte_situacao, transp.nome_fornecedor AS cte_transportadora_razao, transp.nome_fantasia AS cte_transportadora_fantasia, tomador.nome_fornecedor AS cte_tomador_razao, tomador.nome_fantasia AS cte_tomador_fantasia, nf.numero_nota AS nf_numero, nf.serie_nota AS nf_serie, COALESCE(c1.data_emissao, c2.data_emissao, c3.data_emissao) AS nf_data, COALESCE(c1.total_docto, c2.total_docto, c3.total_docto) AS nf_valor_total, COALESCE(c1.valor_frete, c2.valor_frete, c3.valor_frete) AS nf_frete_rateado, COALESCE(c1.situacao_entrada, c2.situacao_entrada, c3.situacao_entrada) AS nf_situacao, CASE WHEN c1.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR' WHEN c2.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF' WHEN c3.documento IS NOT NULL THEN 'DOCUMENTO_SERIE' ELSE 'SEM_CABECALHO' END AS nf_cab_origem, cli.nome_fornecedor AS nf_cliente_razao, cli.nome_fantasia AS nf_cliente_fantasia, forn.nome_fornecedor AS nf_fornecedor_razao, forn.nome_fantasia AS nf_fornecedor_fantasia FROM obrf_016 rel JOIN obrf_010 cte ON cte.documento = rel.num_conhecimento AND cte.serie = rel.ser_conhecimento AND cte.especie_docto = 'CTE' JOIN obrf_016 nf ON nf.num_conhecimento = rel.num_conhecimento AND nf.ser_conhecimento = rel.ser_conhecimento LEFT JOIN ( SELECT documento, serie, cgc_cli_for_9, cgc_cli_for_4, cgc_cli_for_2, data_emissao, total_docto, valor_frete, situacao_entrada FROM ( SELECT o.*, ROW_NUMBER() OVER (PARTITION BY o.documento, o.serie ORDER BY CASE WHEN UPPER(o.especie_docto) LIKE 'NF%' THEN 0 ELSE 1 END, CASE WHEN o.cgc_cli_for_9 IS NOT NULL THEN 0 ELSE 1 END, o.data_emissao DESC NULLS LAST) rn FROM obrf_010 o ) WHERE rn = 1 ) c1 ON c1.documento = nf.numero_nota AND c1.serie = nf.serie_nota AND c1.cgc_cli_for_9 = nf.fornecedor9 AND c1.cgc_cli_for_4 = nf.fornecedor4 AND c1.cgc_cli_for_2 = nf.fornecedor2 LEFT JOIN ( SELECT documento, serie, cgc_cli_for_9, cgc_cli_for_4, cgc_cli_for_2, data_emissao, total_docto, valor_frete, situacao_entrada FROM ( SELECT o.*, ROW_NUMBER() OVER (PARTITION BY o.documento, o.serie ORDER BY CASE WHEN UPPER(o.especie_docto) LIKE 'NF%' THEN 0 ELSE 1 END, CASE WHEN o.cgc_cli_for_9 IS NOT NULL THEN 0 ELSE 1 END, o.data_emissao DESC NULLS LAST) rn FROM obrf_010 o ) WHERE rn = 1 ) c2 ON c2.documento = nf.numero_nota AND c2.serie = nf.serie_nota AND c2.cgc_cli_for_9 = cte.cgc_cli_for_9 AND c2.cgc_cli_for_4 = cte.cgc_cli_for_4 AND c2.cgc_cli_for_2 = cte.cgc_cli_for_2 LEFT JOIN ( SELECT documento, serie, cgc_cli_for_9, cgc_cli_for_4, cgc_cli_for_2, data_emissao, total_docto, valor_frete, situacao_entrada FROM ( SELECT o.*, ROW_NUMBER() OVER (PARTITION BY o.documento, o.serie ORDER BY CASE WHEN UPPER(o.especie_docto) LIKE 'NF%' THEN 0 ELSE 1 END, CASE WHEN o.cgc_cli_for_9 IS NOT NULL THEN 0 ELSE 1 END, o.data_emissao DESC NULLS LAST) rn FROM obrf_010 o ) WHERE rn = 1 ) c3 ON c3.documento = nf.numero_nota AND c3.serie = nf.serie_nota LEFT JOIN supr_010 cli ON cli.fornecedor9 = COALESCE(c1.cgc_cli_for_9, c2.cgc_cli_for_9, c3.cgc_cli_for_9) AND cli.fornecedor4 = COALESCE(c1.cgc_cli_for_4, c2.cgc_cli_for_4, c3.cgc_cli_for_4) AND cli.fornecedor2 = COALESCE(c1.cgc_cli_for_2, c2.cgc_cli_for_2, c3.cgc_cli_for_2) LEFT JOIN supr_010 transp ON transp.fornecedor9 = cte.transpa_forne9 AND transp.fornecedor4 = cte.transpa_forne4 AND transp.fornecedor2 = cte.transpa_forne2 LEFT JOIN supr_010 tomador ON tomador.fornecedor9 = cte.cgc_cli_for_9 AND tomador.fornecedor4 = cte.cgc_cli_for_4 AND tomador.fornecedor2 = cte.cgc_cli_for_2 LEFT JOIN supr_010 forn ON forn.fornecedor9 = nf.fornecedor9 AND forn.fornecedor4 = nf.fornecedor4 AND forn.fornecedor2 = nf.fornecedor2 ) b WHERE COALESCE(b.nf_data, b.cte_data) >= TO_DATE('01/08/2026', 'DD/MM/YYYY') AND COALESCE(b.nf_data, b.cte_data) < TO_DATE('01/09/2026', 'DD/MM/YYYY') ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie

/* ============================================================================
   9) VERSAO DEFINITIVA DO ENDPOINT  --  api_rel_nfe_cte_periodo
   ----------------------------------------------------------------------------
   SEM bind variable. O endpoint sempre devolve a janela movel de 2 meses ate
   hoje, calculada no proprio SQL com SYSDATE/ADD_MONTHS:

     de  = ADD_MONTHS(TRUNC(SYSDATE), -2)   (mesmo dia, 2 meses atras)
     ate = TRUNC(SYSDATE) + 1                (hoje inteiro, exclusivo no fim)

   Validada no Oracle em 28/09/2026: sem parametros, em um unico SELECT, sem
   comentario dentro do SELECT (o console do ERP rejeita) e sem ';' final.

   Diferenca em relacao ao teste com datas literais: nada no corpo, so a janela.
   UPPER(nfs.especie_docto) LIKE 'NF%' (especie confirmada em 28/09/2026: a especie da
   NF-e e 'NFe') impede que o ultimo recurso (documento + serie, sem CNPJ) capture o
   cabecalho de um CT-e ou de outro tipo de documento com o mesmo numero/serie.

   Para outro periodo: trocar a expressao do WHERE por datas fixas, ex.
     COALESCE(b.nf_data, b.cte_data) >= TO_DATE('01/08/2026', 'DD/MM/YYYY')
     COALESCE(b.nf_data, b.cte_data) <  TO_DATE('01/09/2026', 'DD/MM/YYYY')

   CORRECOES v2.1 (29/09/2026) — achadas medindo o payload ja publicado:

   1) O JOIN de 'rel' foi removido. 'rel' e 'nf' sao a MESMA tabela (OBRF_016)
      e as duas se ligavam pelo mesmo conhecimento, entao o auto-join fazia
      produto cartesiano: CT-e com 2 NFs virava 4 linhas. Medido no endpoint
      publicado: CT-e 11757/1 e 351348/1 saíram duplicados (4 linhas cada).
      Efeito colateral grave: a janela SUM() contava cada NF duas vezes, entao
      o percentual de cada NF saia pela metade (NF 23391 = 22,06% em vez de
      44,12%) e o SOMA_NF_DO_CTE saia dobrado. As CT-es com 1 NF nao eram
      afetadas — por isso o bug passou despercebido.

   2) O ultimo recurso (documento + serie, sem CNPJ) ganhou trava de data:
      a NF-e precisa estar entre -60 e +180 dias do CT-e. Sem isso, ele
      amarrou o CT-e 156277/1 de 01/08/2023 com a NF 28490/1 de 03/09/2026
      (1129 dias de distancia) e trouxe uma NF de 3 anos para o relatório.
      Os 9 acertos por CNPJ estao todos entre -5 e 0 dias, entao so o
      fallback de documento+serie precisava da trava.

   Resultado MEDIDO no payload depois de republicar (29/09/2026): 201 linhas,
   199 CT-es (2 deles com 2 NFs), zero par CT-e/NF repetido, zero linha sem nf_numero,
   CT-e 11757/1 com 2 linhas em 44,12% e 55,88% (conferido a mao: 28605,27/64832,93),
   SOMA_NF_DO_CTE do 11757 = 64.832,93 (antes vinha 129.665,86, dobrado) e o CT-e
   156277/1 de 2023 saiu do relatorio.

   Nao raciocine sobre a contagem de linhas para validar: o filtro de periodo usa
   COALESCE(nf_data, cte_data), e na v2.0 o fallback sem trava casava NFs erradas com
   datas que empurravam E puxavam linhas nos dois sentidos — a v2.0 nao era superconjunto
   da v2.1. Valide por: duplicata = 0, soma dos pct de cada CT-e = 100%, distancia
   data CT-e x data NF-e <= 45 dias, e a conferencia a mao de um CT-e com 2+ NFs.

   ---------------------------------------------------------------------------
   v3.0 — ITENS E RATEIO POR NF (29/09/2026) — esta e a versao do SELECT abaixo

   O relatorio nao trazia os dados da NF porque so lia cabecalho (OBRF_010) e o indice
   CT-e<->NF (OBRF_016). Os itens/rateio estao na OBRF_015, que tem as duas pontas:
   CAPA_ENT_NRDOC/CAPA_ENT_SERIE (o CT-e) e NUM_NF_SAIDA/SERIE_NF_SAIDA (a NF).

   1) A OBRF_015 entra por SUBQUERY AGREGADA, nao por LEFT JOIN cru:

        LEFT JOIN (SELECT i.capa_ent_nrdoc, i.capa_ent_serie, i.num_nf_saida,
                          i.serie_nf_saida, COUNT(*) AS item_qtd,
                          SUM(i.quantidade) AS item_qtd_total,
                          MAX(i.unidade_medida) AS item_unidade,
                          LISTAGG(SUBSTR(i.descricao_item, 1, 60), ' | ')
                            WITHIN GROUP (ORDER BY i.sequencia) AS item_descricoes,
                          SUM(i.valor_total) AS item_valor_total,
                          SUM(i.valor_icms) AS item_icms
                     FROM obrf_015 i
                    WHERE i.num_nf_saida IS NOT NULL
                    GROUP BY i.capa_ent_nrdoc, i.capa_ent_serie,
                             i.num_nf_saida, i.serie_nf_saida) it

      Agrupar pela chave CT-e+NF devolve no MAXIMO uma linha por par, entao o join de
      itens nao multiplica nada — que e exatamente o bug da v2.0, e o mesmo que
      reapareceria aqui. Medido: 201 linhas antes e depois, zero par repetido.

      Por que subquery e nao WITH: o console do ERP recusa WITH. Subquery no FROM e
      aceito.

   2) VALOR DA NOTA E VALOR DO RATEIO FICARAM EM COLUNAS SEPARADAS, de proposito.

      VALOR_TOTAL do item e a COTA DE FRETE rateada no CT-e, nao o total da nota fiscal.
      Com 1 item e 1 NF os dois numeros coincidem, e foi o que me enganou na primeira
      leitura da tela do ERP. Com 2+ NFs o rateio diz quanto do frete coube a cada nota.

      Por isso NF_VALOR_TOTAL continua sendo SO o do cabecalho, e a procedencia vai em
      NF_VALOR_ORIGEM: CABECALHO_NF / RATEIO_CTE / SEM_VALOR. Misturar os dois no mesmo
      campo quebraria o PCT_NF_NO_TOTAL_CTE, que passaria a somar total de nota com
      cota de frete.

   3) Capa do CT-e: natureza da operacao, tipo de conhecimento, data de transacao e
      codigos de cidade de origem/destino.

   Resultado MEDIDO no payload publicado (29/09/2026): 201 linhas, 38 colunas,
   199 CT-es, zero par CT-e/NF duplicado, zero linha sem nf_numero, ZERO linha sem
   valor de nenhum tipo (194 RATEIO_CTE + 7 CABECALHO_NF), soma dos pct de cada CT-e
   = 100%, zero NF-e a mais de 45 dias do CT-e.

   A prova de que o rateio presta: no CT-e 11757/1 o rateio por NF deu 44,12% e 55,88%
   — o MESMO split do valor das notas (28605,27 e 36227,66 sobre 64832,93). Dois
   caminhos independentes, um pelo rateio de frete e outro pelos totais de nota,
   chegando no mesmo lugar.

   DIVERGENCIA CONHECIDA (nao e bug do SQL): o CT-e 351348/1 tem rateio de 917,34
   contra total de 199,99 — o item da NF 31933 carrega 717,35. A diferenca do periodo
   inteiro e exatamente 717,35, ou seja, fora esse CT-e os outros 198 fecham ao
   centavo. Nao limitei o valor no total de proposito: se o rateio passa do total, o
   dado tem que aparecer e a conta fica visivel (SOMA_RATEIO_DO_CTE ao lado de
   CTE_VALOR_TOTAL). Arredondar ou capar seria inventar numero. Confirmar com:

      SELECT capa_ent_nrdoc, capa_ent_serie, sequencia, num_nf_saida,
             descricao_item, quantidade, valor_total, valor_icms
        FROM obrf_015
       WHERE capa_ent_nrdoc = 351348 AND capa_ent_serie = '1'
       ORDER BY sequencia;

   Risco conhecido do LISTAGG: sem ON OVERFLOW TRUNCATE, um CT-e com mais de ~63
   itens (60 chars + separador) estoura o limite de 4000 e derruba a query INTEIRA,
   nao so uma linha. Em 2 meses de janela so 4 CT-es tinham 2 itens, mas um CT-e
   grande e um unico dado derrubando o relatorio inteiro. Se o ERP for 12.2+:

       LISTAGG(...) WITHIN GROUP (ORDER BY i.sequencia)
         ON OVERFLOW TRUNCATE '...' WITH COUNT

   ---------------------------------------------------------------------------
   v3.1b — ORDEM DE DESPACHO EM MODO ADITIVO (29/09/2026) — esta e a versao do SELECT

   v3.1a (mesma data) nao rodou: ORA-12705, "nao e possivel acessar arquivos de dados
   NLS ou ambiente invalido especificado". Esse nao e erro de SQL — e falha na abertura
   da sessao. SELECT 1 FROM dual passou na mesma hora, entao o ambiente esta sao e o que
   morreu foi a sessao da query: ela ficou pesada demais, a conexao do pool caiu e
   voltou quebrada. A v3.1b corta o custo em dois lugares (itens 5 e 6).

   Por que: o relatorio nasceu para reunir as NOTAS DE SAIDA vinculadas aos CT-es.
   Ate aqui a NF era procurada so no fiscal (OBRF_010), que devolveu SEM_CABECALHO
   em 194 das 201 linhas. Cruzado contra a api_ordem_despacho, 162 dessas 194
   existem la — as notas nao estavam perdidas, estavam na fonte errada. A ordem de
   despacho (pedido -> NF -> romaneio/rolos) tem o tipo de documento que o relatorio
   quer reunir.

   O QUE MUDA EM RELACAO A v3.0: SO A COLUNA. O SELECT de fora ganha 17 colunas
   NF_OD_* e o bloco interno ganha um LEFT JOIN (dsp). Nenhum calculo existente foi
   tocado — nf_valor_total, nf_cab_origem, nf_valor_origem, as window functions, o
   WHERE e o ORDER BY sao os mesmos da v3.0.

   POR QUE ESTA VERSAO EXISTE, E O QUE ELA NAO E. A primeira tentativa (v3.1) somava
   a coluna nova com mudanca no COALESCE do nf_valor_total e com o ramo ORDEM_DESPACHO
   no nf_cab_origem. Nao foi publicada: dava ORA-06502 ao rodar. Como cada peca
   isolada passava nas medicoes (chave 4.417/4.417, TO_CHAR 46.929/46.929, peso
   11.632.320 somados, join novo 24.360 linhas, dsp materializando), o problema nao
   era coluna ruim — era a interacao. A v3.1a separa DADO de VALOR: primeiro prova que
   o join funciona sem tocar em nenhum calculo, e so depois liga o valor (v3.2). Se
   rodar, o ORA-06502 era a mudanca de tipo na window function; se nao rodar, e o
   join e o bloco interno precisa ser reescrito.

   1) A ORDEM DE DESPACHO ENTRA POR SUBQUERY AGREGADA, COM GROUP BY NA CHAVE DA NF.

        LEFT JOIN (SELECT TRIM(d.nf) AS nf_chave, MAX(...), SUM(...)
                     FROM pmdvw_nfs d
                     LEFT JOIN pmdvw_vendas w
                       ON w.pedido = d.pedido
                     LEFT JOIN (SELECT x.pedido, MAX(x.romaneio) AS romaneio, ...
                                  FROM (SELECT r.pedido, ..., DENSE_RANK() OVER
                                           (PARTITION BY r.pedido ORDER BY r.romaneio DESC) AS rn
                                          FROM pmdvw_rolos r
                                         WHERE r.romaneio IS NOT NULL
                                           AND r.situacao = 'Fora do estoque') x
                                      GROUP BY x.pedido) rol
                            ON rol.pedido = d.pedido
                           AND d.pedido > 0
                    WHERE TRIM(d.entrada_saida) = 'Saida'
                      AND d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)
                    GROUP BY TRIM(d.nf)) dsp
          ON dsp.nf_chave = TRIM(nf.numero_nota || '-' || nf.serie_nota)

      Sem o GROUP BY, um LEFT JOIN cru na PMDVW_NFS devolve uma linha por PEDIDO x NF
      e multiplica o relatorio inteiro — exatamente o defeito da v2.0, que nao posso
      repetir. Agregando pela chave da NF o join traz no maximo uma linha.

   2) A CHAVE E NUMERO DA NOTA + '-' + SERIE.

      A PMDVW_NFS traz a chave pronta num campo so: '35832-1'. O OBRF_016 traz
      NUMERO_NOTA e SERIE_NOTA separados. A concatenacao usa || e nao TO_CHAR de
      proposito: || converte numero em texto sozinho, entao funciona se NUMERO_NOTA
      for NUMBER ou VARCHAR (medido: Typ=2 NUMBER e Typ=1 VARCHAR). TO_CHAR sobre
      NUMBER daria o mesmo resultado, mas quebraria com ORA-00904 se fosse VARCHAR.
      TRIM nos dois lados porque campo do tipo CHAR vem preenchido com espaco.
      Medido: 4.417 linhas de OBRF_016 concatenam sem erro.

   3) ROMANEI E ROLOS VIRARAM LEFT JOIN, E OS FILTROS DE FATURAMENTO SAIRAM.

      A api_ordem_despacho tem INNER JOIN com PMDVW_ROLOS e exige
      SITUACAO = 'Fora do estoque'. NF faturada cujo pedido ainda nao tem rolo
      expedido nao aparece na lista — foi assim que a NF 35835 (pedido 8305) sumiu
      do cruzamento. Aqui o romaneio virou LEFT JOIN: a NF entra com pedido, cliente,
      valor e data, e o romaneio vem vazio se ainda nao existir. O relatorio quer a
      NOTA, nao o romaneio.

      FATURAMENTO_SIM_NAO = 'Sim' e CFOP <> '0' tambem sairam, e os dois campos
      viraram coluna (NF_OD_FATURAMENTO / NF_OD_CFOP). Eles existem para a ordem de
      despacho mostrar so o que ja foi faturado; no relatorio seriam um filtro a
      mais, escondendo nota de quem factura e despacha no mesmo dia. Sem eles o join
      nao traz falso positivo: a chave e o numero exato que veio no proprio CT-e.

   4) O QUE FICOU DE FORA DE PROPONITO, E VOLTA NA v3.2

      NF_VALOR_TOTAL segue sem o VALOR_SAIDA do despacho. Consequencia esperada e
      correta: as 194 NFs que o fiscal nao acham continuam SEM VALOR ate a v3.2, e o
      relatorio mostra os mesmos 7 valores de sempre (194 RATEIO_CTE + 7
      CABECALHO_NF). Se a contagem de linhas sem valor mudar, isso sim e quebra.

      NF_CAB_ORIGEM continua sendo so sobre o fiscal: SEM_CABECALHO quer dizer
      "o OBRF_010 nao achou", e nao "a NF nao existe". A v3.2 acrescenta o
      ORDEM_DESPACHO.

      NF_VALOR_ORIGEM continua sem o valor ORDEM_DESPACHO, pelo mesmo motivo.

      NF_DATA continua vindo so do OBRF_010. DATA_MOVTO e data de movimentacao, nao
      de emissao, e trocar a coluna do filtro mudaria quais CT-es entram na janela
      (antes caia no CTE_DATA, agora cairia no movimento). A data do despacho sai em
      NF_OD_DATA, ao lado, e nao no lugar.

    5) DUAS CORRECOES DENTRO DO DSP

       PEDIDO ZERADO. O teste do dsp devolveu NFs com PEDIDO = 0 (10-99 e 102-99,
       as duas com romaneio 24795). Sem trava no ON, o LEFT JOIN por pedido traz
       romaneio e peso de um pedido inexistente. O corte e d.pedido > 0 e nao
       d.pedido IS NOT NULL: 0 nao e NULL, e o 0 e o placeholder que a base usa
       quando a NF-e nao entrou em nenhuma ordem. Medido: 46.929 NFs de saida, o
       filtro e o que mantem pedido e romaneio do mesmo embarque. A tela do PDM
       (nfTemDespacho) usa a mesma regra, para nao exibir romaneio de pedido zero.

   6) CUSTO — AS DUAS MUDANCAS QUE A v3.1b FEZ NA v3.1a

      a) ULTIMO ROMANEO EM UMA VARREDURA SO, COM DENSE_RANK. A v3.1a (e a v3.1) faziam
         a mesma coisa com o JOIN aninhado em `ult`: DUAS varreduras de PMDVW_ROLOS
         mais um self-join por PEDIDO, dentro de uma subquery que ja agrupa 241 mil
         linhas de PMDVW_NFS. DENSE_RANK faz a mesma selecao (so as rolos do romaneio
         mais alto de cada pedido) numa varredura e uma ordenacao, sem tabela de hash
         do rolos inteiro. Resultado identico, custo bem menor.

         O sintoma nao era ORA de sintaxe nem de tipo: era a sessao morrendo de
         trabalho. E por isso que PMDVW_ROLOS precisa estar medido dentro do dsp
         antes de subir — a soma simples em PMDVW_ROLOS passa, mas duas varreduras
         com self-join, nao.

      b) CORTE POR DATA NO DSP. O relatorio so quer CT-e dos ultimos 2 meses
         (WHERE do fim da query), e por ANTT o conhecimento e despachado em poucos
         dias apos a emissao. Entao a ordem de despacho so e consultada a partir de
         3 meses atras:

             AND d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)

         O -3 em vez de -2 e folga de um mes. O que isso NAO faz: nao corta nenhuma
         NF do relatorio, so deixa as colunas NF_OD_* vazias para NF despachada ha
         muito mais que isso. Se alguma NF do periodo aparecer sem pedido, o
         primeiro ajuste e alargar este numero, nao mexer no join.

   7) LIMITACAO CONHECIDA: o GROUP BY e pela NF, nao pelo par NF + PEDIDO. Se a mesma
      nota estiver em dois pedidos, o agrupamento soma os VALOR_SAIDA dos dois e
      mostra um pedido so (o MAX). A ordem de despacho separa por pedido; aqui a
      precedencia foi nunca duplicar linha no relatorio. Se aparecer numero de nota
      que nao bate com o esperado, e esse caso.

   O QUE MEDIR ASSIM QUE PUBLICAR

      201 linhas (igual a v3.0), 55 colunas (38 + 17), zero par CT-e/NF duplicado,
      194 linhas sem valor (como a v3.0), e — o que interessa — quantas linhas vieram
      com NF_OD_PEDIDO preenchido. O cruzamento com a api_ordem_despacho diz 162. Se
      vier perto disso, a chave numero-serie funciona em producao e a v3.2 fica
      liberada. Se vier 0, o join esta errado e o bloco interno precisa ser reescrito.

   O QUE FALTA MEDIR (docs/probe-nf-ordem-despacho.sql): 39 NFs seguem sem casar.
   7 sao as antigas de compra que o OBRF_010 ja resolve. As outras 32 sao de 2026, e
   o probe diz se e falta na PMDVW_NFS, filtro de flag ou romaneio. O LEFT JOIN do
   item 3 ja resolve o caso do romaneio, se for esse.

    Nao coloquei ON OVERFLOW TRUNCATE no LISTAGG do OBRF_015: exige 12.2+ e, se a base
    for antiga, derruba a query INTEIRA. Confirmar a versao antes:

       SELECT banner FROM v$version

    ---------------------------------------------------------------------------
    v3.1b PUBLICADA E MEDIDA (29/09/2026) — 201 linhas, 55 colunas, ZERO preenchida

    O SELECT acima esta no endpoint e responde 200 com 201 linhas e as 55 colunas.
    Zero par CT-e/NF duplicado, 194 linhas sem valor (como na v3.0), as 7 com valor
    intactas. Mas as 17 colunas NF_OD_* vieram NULAS nas 201 linhas:

       nf_od_pedido preenchido: 0 de 201     (o cruzamento previa 161)

    E o cruzamento, refeito em JS a partir dos DOIS endpoints publicados
    (scripts/diag-despacho-cruzamento.js), provou que o problema NAO e falta de
    dado e NAO e a chave:

       - a chave numero-serie casa: 162 das 201 NFs do relatorio existem no
         despacho (35832-1 -> pedido 8198, romaneio 24597, 3.613,90, 18/09/2026);
       - `entrada_saida = 'Saida'` passa nas 162 — o valor e mesmo 'Saida', sem
         acento (nao ha o que ajustar);
       - `pedido > 0` passa nas 162;
       - o corte `data >= -3 meses` derruba SO 1: a 31933-1, que e o CT-e 351348,
         ja conhecido como o do rateio divergente.

    Logo o bloco `dsp` deveria devolver 161 chaves e devolve 0: o defeito esta
    DENTRO do bloco. O suspeito numero 1 e o proprio corte de data, porque
    `d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)` so e correto se
    PMDVW_NFS.DATA_MOVTO for DATE. Se for CHAR/VARCHAR2, o Oracle compara TEXTO
    com TEXTO (o DATE vira texto pelo NLS_DATE_FORMAT da sessao) e o resultado e
    lixo silencioso: nenhuma linha passa e nenhum erro aparece.
    docs/diag-ora-06502-dsp.sql mede o tipo com DUMP e conta o bloco em tres
    degraus; os itens 5 e 5b ja respondem se e o corte.

    CORRECAO DE METODO (para quem for medir de novo): a api_ordem_despacho pagina
    em 100 e o `count` da resposta e o da PAGINA, nao o total. A primeira pagina
    traz 2022-10 a 2022-12, entao cruzar so a primeira pagina da 0 de 201 e parece
    que a chave esta errada. Sao 9 paginas, 8.035 registros, de 2022 a 2026-09-29.
    O cruzamento so da certo depois de paginar ate hasMore = false.

    ---------------------------------------------------------------------------
    ORA-06502 — o que ele e (29/09/2026)

    "ORA-06502: PL/SQL: character value buffer too small" + "Ocorreu 1 erro" NAO e
    erro de sintaxe e NAO e coluna inexistente: a sentenca chegou a executar. O
     prefixo PL/SQL e o "Ocorreu 1 erro" vem do runner do console do ERP, que monta
     a linha num buffer fixo. A v3.1b roda no endpoint (201 linhas, 55 colunas) e
     estoura no console: mesmo SQL, dois runners. O SQL NAO esta errado — quem nao
     aguenta e o runner do console, que embrulha a sentenca em PL/SQL.


     DESCARTADO 1 — A LARGURA DA LINHA. A v3.1c colocou teto em todas as 18
     colunas de texto da projecao e o console devolveu ORA-06502 IGUAL. A largura
     caiu e o erro nao mudou, entao nao e largura. (O item do LISTAGG, esse, segue
     valendo como limite de 4.000 bytes do proprio LISTAGG, que e coisa do Oracle
     e daria ORA-01489, nao ORA-06502.)

     DESCARTADO 2 — O LIMITE DE COLUNAS. As sondas 7, 8 e 9 de
     docs/diag-ora-06502-dsp.sql, que sao 38, 55 e 60 colunas sinteticas em DUAL
     sem tocar em tabela nenhuma, PASSARAM as tres. O runner mostra 60 colunas de
     boa, entao nem contagem nem largura explicam o erro. Nao adianta quebrar o
     relatorio em duas sentencas.

     SOBROU O CONTEUDO DO BLOCO `dsp`. Entre a v3.0 (que roda, sem `dsp`) e a
     v3.1 (que nao roda, com `dsp`) a unica diferenca que sobrou no ar e o bloco.
     Os itens 10, 11 e 12 do mesmo arquivo abrem o `dsp` em camadas — 10 e o
     nucleo cru (PMDVW_NFS e os agregados), 11 acrescenta o join de PMDVW_VENDAS,
     12 acrescenta o `rol` com o DENSE_RANK sobre PMDVW_ROLOS.

     DESCARTADO 3 — O BLOCO `dsp`. MEDIDO em 29/09/2026: os itens 10, 11 e 12
     passaram os tres. O `dsp` inteiro, com o DENSE_RANK, roda no console.

     DESCARTADO 4 (por via indireta) — A DATA_MOVTO SER CHAR. A v3.1c removeu o
     corte e o endpoint precisa ser medido de novo, mas o console ja deixou de
     ser a via de prova disso.

     O QUE SOBROU DE VERDADE: O VOLUME. E a dimensao que nenhuma sonda mediu, e a
     falha e MINHA. Todas as sondas que passaram devolvem no maximo 20 linhas: as
     sinteticas, 1; as do dsp, 20. O relatorio real sao 201 linhas x 55 colunas.
     Se o runner montar o resultado num buffer ACUMULADO (v_result :=
     v_result || linha, dentro de um laco), o que estoura e o produto LINHAS x
     LARGURA, e nao a contagem nem a largura sozinhas — o que explica as tres
     sondas de 60 colunas de 2 caracteres passando, o dsp de 18 colunas passando, e
     o relatorio completo estourando. E explica por que a v3.0 rodava: nao era so
     ter 38 colunas, era 38 colunas vezes MENOS linhas.

     Se for isso, o relatorio INTEIRO nao roda no console e nao ha conserto de SQL
     que resolva: ou se reduz o volume por execucao (periodo menor) ou a
     conferencia desse relatorio passa a ser pelo endpoint, que devolve 201 linhas
     e 55 colunas sem reclamar. Os itens 13 e 14 do diag-ora-06502-dsp.sql medem
     isso: 201 linhas de coluna minuscula, e o relatorio inteiro com teto de
     ROWNUM em 20, 60 e 120.


    ---------------------------------------------------------------------------
    v3.1c — CORRECAO DO BLOCO `dsp` E TETO NAS COLUNAS DE TEXTO (29/09/2026) — esta e
    a versao do SELECT abaixo. Duas mudancas, uma por sintoma, para dar para
    atribuir o resultado de cada uma.

    RESULTADO MEDIDO: a mudanca 1 e o que interessa; a mudanca 2 NAO resolveu o
    ORA-06502 do console (leia a secao do ORA acima). Ela fica porque e boa
    pratica e porque corta o risco de ORA-01489 no LISTAGG — mas nao era a causa
    do erro.

    1) CORTEI O `d.data_movto >= ADD_MONTHS(TRUNC(SYSDATE), -3)` DO BLOCO `dsp`.

       E a unica comparacao do bloco que depende do TIPO de uma coluna que ninguem
       mediu: so esta correta se PMDVW_NFS.DATA_MOVTO for DATE. Se for CHAR ou
       VARCHAR2, o Oracle converte o DATE da outra ponta para texto pelo
       NLS_DATE_FORMAT da sessao e compara TEXTO COM TEXO — '18/09/2026' contra
       '29/06/26' — e o resultado e lixo silencioso: nenhuma linha passa, nenhum
       erro aparece. E o sintoma medido e exatamente esse: 0 de 161 chaves
       possiveis, sem erro.

       O corte era economia de custo, e a economia nao existe: sao ~47 mil NFs de
       saida, um GROUP BY de uma coluna. A janela do relatorio ja e imposta pelo
       WHERE de fora, sobre a data do CT-e. E o corte nao protegia nada: a chave e
       numero-serie, que identifica a nota, entao nao ha como um despacho antigo
       se grudar num CT-e novo.

       Se o DUMP do item 1 de docs/diag-ora-06502-dsp.sql mostrar que DATA_MOVTO
       e mesmo DATE, entao o corte nao era a causa e o proximo suspeito e o join
       com `rol` (itens 5b x 5c). Nesse caso o corte volta, e so ai.

    2) TODA COLUNA DE TEXTO DA PROJECAO GANHOU TETO DE TAMANHO.

       SUBSTR(TRIM(x), 1, n) em todas as 17 colunas de nome, mais
       NF_ITEM_DESCRICOES com teto de 300. ISTO NAO RESOLVEU O ORA-06502 — foi
       testado e o console devolveu o mesmo erro. A linha ficou com largura fixa
       e conhecida, o que e boa pratica e corta o risco de ORA-01489, mas o
       disparador do console nao era a largura. Fica a mudanca; so nao se crema
       que ela conserta o console.

       O que ela resolve de verdade: o TRIM antes do SUBSTR mata o preenchimento
       com espaco das colunas CHAR (as de PMDVW_NFS/PMDVW_VENDAS sao CHAR — foi
       por isso que o probe de docs/probe-nf-ordem-despacho.sql envolve as flags
       em TRIM), e o mesmo TRIM foi posto dentro do bloco `dsp`, nas 11 colunas
       de texto dele.

       O item do LISTAGG caiu de 60 para 40 caracteres, o que joga o estouro de
       4.000 bytes de ~63 para ~95 itens por par CT-e/NF. Com 2 itens no maior CT-e
       da janela, e folgado; e continua valendo o que a v3.0 ja dizia: se a base for
       12.2+, acrescente `ON OVERFLOW TRUNCATE '...' WITH COUNT` ao LISTAGG e o
       risco some de vez.

    3) O QUE NAO MEXI, DE PROPOSITO.

       nf_valor_total, nf_cab_origem, nf_valor_origem, as duas window functions, o
       WHERE de fora e o ORDER BY estao identicos aos da v3.1b. Continua valendo o
       item 4 da v3.1b: o VALOR_SAIDA do despacho NAO entra no valor da nota, entao
       as 194 NFs previstas continuam sem valor e o relatorio mostra os mesmos 7 de
       sempre. A v3.2 e quem liga o valor — e so depois que o join casar.

       Uma mexida pequena e de arrumacao, nao de resultado: o `d.pedido > 0` estava
       no ON do join com `rol`, e foi para o WHERE do `dsp`, que e onde um filtro da
       tabela preservada pertence. Antes ele era um filtro de join (as NFs de
       pedido 0 entravam no grupo, sem rolo); agora sao eliminadas antes de
       qualquer join. No relatorio nao muda nada, porque as 162 NFs que casam na
       chave ja tem todas pedido > 0, e ainda evita de ir em pmdvw_vendas e
       pmdvw_rolos para um pedido que nao existe.

    O QUE MEDIR ASSIM QUE PUBLICAR A v3.1c

       - o que NAO pode mudar: 201 linhas, 55 colunas, zero par CT-e/NF repetido,
         194 linhas sem valor, soma dos pct = 100% por CT-e;
       - o que tem de mudar: NF_OD_PEDIDO preenchido em ~161 das 201 linhas
         (161 e o numero medido: 162 casam na chave, e o corte de data antigo
         derrubava a 31933-1, o CT-e 351348 do rateio divergente);
       - se vier 0 de novo, o corte de data NAO era a causa: rode o item 5b e o
         5c de docs/diag-ora-06502-dsp.sql e me traga os dois numeros.
    ============================================================================ */
SELECT b.cte_numero,
       b.cte_serie,
       TO_CHAR(b.cte_data, 'DD/MM/YYYY')                                              AS cte_data,
       TO_CHAR(b.cte_data_transacao, 'DD/MM/YYYY')                                    AS cte_data_transacao,
       b.cte_valor_total,
       b.cte_valor_frete,
       b.cte_natureza,
       b.cte_tipo_conhecimento,
       b.cte_cod_cidade_origem,
       b.cte_cod_cidade_destino,
       b.cte_situacao,
       SUBSTR(TRIM(b.cte_transportadora_razao), 1, 60)                      AS cte_transportadora_razao,
       SUBSTR(TRIM(b.cte_transportadora_fantasia), 1, 60)                   AS cte_transportadora_fantasia,
       SUBSTR(TRIM(b.cte_tomador_razao), 1, 60)                             AS cte_tomador_razao,
       SUBSTR(TRIM(b.cte_tomador_fantasia), 1, 60)                          AS cte_tomador_fantasia,
       b.nf_numero,
       b.nf_serie,
       TO_CHAR(b.nf_data, 'DD/MM/YYYY')                                               AS nf_data,
       b.nf_valor_total,
       SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie)  AS soma_nf_do_cte,
       ROUND(b.nf_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_nf_no_total_cte,
       ROUND(b.cte_valor_total
             / NULLIF(SUM(b.nf_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie), 0)
             * 100, 2)                                                      AS pct_cte_sobre_total_nfs,
       b.nf_frete_rateado,
       b.nf_situacao,
       SUBSTR(TRIM(b.nf_cliente_razao), 1, 60)                              AS nf_cliente_razao,
       SUBSTR(TRIM(b.nf_cliente_fantasia), 1, 60)                           AS nf_cliente_fantasia,
       SUBSTR(TRIM(b.nf_fornecedor_razao), 1, 60)                           AS nf_fornecedor_razao,
       SUBSTR(TRIM(b.nf_fornecedor_fantasia), 1, 60)                        AS nf_fornecedor_fantasia,
       b.nf_cab_origem,
       b.nf_item_qtd,
       b.nf_item_qtd_total,
       SUBSTR(TRIM(b.nf_item_unidade), 1, 10)                               AS nf_item_unidade,
       SUBSTR(TRIM(b.nf_item_descricoes), 1, 300)                           AS nf_item_descricoes,
       b.nf_item_valor_total,
       b.nf_item_icms,
       b.nf_od_pedido,
       TO_CHAR(b.nf_od_data, 'DD/MM/YYYY')                                            AS nf_od_data,
       b.nf_od_valor,
       b.nf_od_qtde,
       SUBSTR(TRIM(b.nf_od_cliente_razao), 1, 60)                           AS nf_od_cliente_razao,
       SUBSTR(TRIM(b.nf_od_cliente_fantasia), 1, 60)                        AS nf_od_cliente_fantasia,
       b.nf_od_cod_cidade,
       SUBSTR(TRIM(b.nf_od_cidade), 1, 40)                                  AS nf_od_cidade,
       SUBSTR(TRIM(b.nf_od_regiao), 1, 30)                                  AS nf_od_regiao,
       SUBSTR(TRIM(b.nf_od_representante), 1, 60)                           AS nf_od_representante,
       b.nf_od_romaneio,
       b.nf_od_qtde_rolos,
       b.nf_od_peso_bruto,
       b.nf_od_peso_liquido,
       SUBSTR(TRIM(b.nf_od_faturamento), 1, 3)                              AS nf_od_faturamento,
       SUBSTR(TRIM(b.nf_od_cfop), 1, 10)                                    AS nf_od_cfop,
       SUBSTR(TRIM(b.nf_od_natureza), 1, 10)                                AS nf_od_natureza,
       SUM(b.nf_item_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie) AS soma_rateio_do_cte,
       ROUND(b.nf_item_valor_total / NULLIF(b.cte_valor_total, 0) * 100, 2) AS nf_pct_rateio_no_cte,
       CASE WHEN b.nf_cab_origem <> 'SEM_CABECALHO' THEN 'CABECALHO_NF'
            WHEN b.nf_item_valor_total IS NOT NULL  THEN 'RATEIO_CTE'
            ELSE 'SEM_VALOR' END                                                     AS nf_valor_origem
  FROM ( SELECT cte.documento AS cte_numero,
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
                COALESCE(nfe.data_emissao, nfc.data_emissao, nfs.data_emissao) AS nf_data,
                COALESCE(nfe.total_docto, nfc.total_docto, nfs.total_docto) AS nf_valor_total,
                COALESCE(nfe.valor_frete, nfc.valor_frete, nfs.valor_frete) AS nf_frete_rateado,
                COALESCE(nfe.situacao_entrada, nfc.situacao_entrada, nfs.situacao_entrada) AS nf_situacao,
                CASE WHEN nfe.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR'
                     WHEN nfc.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF'
                     WHEN nfs.documento IS NOT NULL THEN 'DOCUMENTO_SERIE'
                     ELSE 'SEM_CABECALHO' END AS nf_cab_origem,
                cli.nome_fornecedor AS nf_cliente_razao,
                cli.nome_fantasia AS nf_cliente_fantasia,
                forn.nome_fornecedor AS nf_fornecedor_razao,
                forn.nome_fantasia AS nf_fornecedor_fantasia,
                it.item_qtd AS nf_item_qtd,
                it.item_qtd_total AS nf_item_qtd_total,
                it.item_unidade AS nf_item_unidade,
                it.item_descricoes AS nf_item_descricoes,
                it.item_valor_total AS nf_item_valor_total,
                it.item_icms AS nf_item_icms,
                dsp.pedido            AS nf_od_pedido,
                dsp.data_movto        AS nf_od_data,
                dsp.valor_saida       AS nf_od_valor,
                dsp.qtde_saida        AS nf_od_qtde,
                dsp.nome_cliente      AS nf_od_cliente_razao,
                dsp.fantasia          AS nf_od_cliente_fantasia,
                dsp.cid               AS nf_od_cod_cidade,
                dsp.cidade            AS nf_od_cidade,
                dsp.nome_regiao       AS nf_od_regiao,
                dsp.nome_represenante AS nf_od_representante,
                dsp.romaneio          AS nf_od_romaneio,
                dsp.qtde_rolos        AS nf_od_qtde_rolos,
                dsp.peso_bruto        AS nf_od_peso_bruto,
                dsp.peso_liquido      AS nf_od_peso_liquido,
                dsp.faturamento       AS nf_od_faturamento,
                dsp.cfop              AS nf_od_cfop,
                dsp.natureza          AS nf_od_natureza
           FROM obrf_016 nf
           JOIN obrf_010 cte
             ON cte.documento     = nf.num_conhecimento
            AND cte.serie         = nf.ser_conhecimento
            AND cte.especie_docto = 'CTE'
           LEFT JOIN obrf_010 nfe
             ON nfe.documento     = nf.numero_nota
            AND nfe.serie         = nf.serie_nota
            AND nfe.cgc_cli_for_9 = nf.fornecedor9
            AND nfe.cgc_cli_for_4 = nf.fornecedor4
            AND nfe.cgc_cli_for_2 = nf.fornecedor2
           LEFT JOIN obrf_010 nfc
             ON nfc.documento     = nf.numero_nota
            AND nfc.serie         = nf.serie_nota
            AND nfc.cgc_cli_for_9 = cte.cgc_cli_for_9
            AND nfc.cgc_cli_for_4 = cte.cgc_cli_for_4
            AND nfc.cgc_cli_for_2 = cte.cgc_cli_for_2
           LEFT JOIN obrf_010 nfs
             ON nfs.documento = nf.numero_nota
            AND nfs.serie     = nf.serie_nota
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
           LEFT JOIN (SELECT i.capa_ent_nrdoc              AS capa_ent_nrdoc,
                             i.capa_ent_serie              AS capa_ent_serie,
                             i.num_nf_saida                AS num_nf_saida,
                             i.serie_nf_saida               AS serie_nf_saida,
                              COUNT(*)                      AS item_qtd,
                              SUM(i.quantidade)             AS item_qtd_total,
                              MAX(i.unidade_medida)         AS item_unidade,
                              LISTAGG(SUBSTR(i.descricao_item, 1, 40), ' | ')
                                WITHIN GROUP (ORDER BY i.sequencia) AS item_descricoes,
                              SUM(i.valor_total)            AS item_valor_total,
                              SUM(i.valor_icms)             AS item_icms
                         FROM obrf_015 i
                        WHERE i.num_nf_saida IS NOT NULL
                        GROUP BY i.capa_ent_nrdoc, i.capa_ent_serie, i.num_nf_saida, i.serie_nf_saida) it
              ON it.capa_ent_nrdoc = cte.documento
             AND it.capa_ent_serie = cte.serie
             AND it.num_nf_saida   = nf.numero_nota
              AND it.serie_nf_saida = nf.serie_nota
             LEFT JOIN (SELECT TRIM(d.nf)                      AS nf_chave,
                              MAX(d.pedido)                    AS pedido,
                              MAX(d.data_movto)                AS data_movto,
                              SUM(d.valor_saida)               AS valor_saida,
                              SUM(d.qtde_saida)                AS qtde_saida,
                              MAX(TRIM(d.faturamento_sim_nao)) AS faturamento,
                              MAX(TRIM(d.cfop))                AS cfop,
                              MAX(TRIM(d.natureza))            AS natureza,
                              MAX(TRIM(w.nome_cliente))        AS nome_cliente,
                              MAX(TRIM(w.fantasia))            AS fantasia,
                              MAX(w.cid)                       AS cid,
                              MAX(TRIM(w.cidade))              AS cidade,
                              MAX(TRIM(w.nome_regiao))         AS nome_regiao,
                              MAX(TRIM(w.nome_represenante))   AS nome_represenante,
                              MAX(rol.romaneio)                AS romaneio,
                              MAX(rol.qtde_rolos)              AS qtde_rolos,
                              MAX(rol.peso_bruto)              AS peso_bruto,
                              MAX(rol.peso_liquido)            AS peso_liquido
                         FROM pmdvw_nfs d
                         LEFT JOIN pmdvw_vendas w
                           ON w.pedido = d.pedido
                         LEFT JOIN (SELECT x.pedido,
                                           MAX(x.romaneio) AS romaneio,
                                           COUNT(DISTINCT CASE WHEN x.rn = 1 THEN x.codigo_rolo END) AS qtde_rolos,
                                           SUM(CASE WHEN x.rn = 1 THEN x.peso_bruto END) AS peso_bruto,
                                           SUM(CASE WHEN x.rn = 1 THEN x.peso_liquido END) AS peso_liquido
                                      FROM (SELECT r.pedido,
                                                   r.romaneio,
                                                   r.codigo_rolo,
                                                   r.peso_bruto,
                                                   r.peso_liquido,
                                                   DENSE_RANK() OVER (PARTITION BY r.pedido
                                                                       ORDER BY r.romaneio DESC) AS rn
                                               FROM pmdvw_rolos r
                                              WHERE r.romaneio IS NOT NULL
                                                AND r.situacao = 'Fora do estoque') x
                                     GROUP BY x.pedido) rol
                           ON rol.pedido = d.pedido
                       WHERE TRIM(d.entrada_saida) = 'Saida'
                         AND d.pedido > 0
                       GROUP BY TRIM(d.nf)) dsp
              ON dsp.nf_chave = TRIM(nf.numero_nota || '-' || nf.serie_nota)
        ) b
 WHERE COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE), -2)
   AND COALESCE(b.nf_data, b.cte_data) <  TRUNC(SYSDATE) + 1
 ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie

/* ============================================================================
 *  v3.2 — SELECT SIMPLIFICADO PARA O CONSOLE (30/09/2026)
 *
 *  DIAGNOSE do ORA-06502: a v3.1c nao roda no console mesmo com todas as colunas
 *  de texto com teto. As sondas (docs/diag-ora-06502-dsp.sql) passaram com 20
 *  linhas; o relatorio real sao 201 linhas x 55 colunas. A hipotese que resta e
 *  VOLUME (o runner embrulha o SELECT em PL/SQL e monta o resultado num buffer
 *  acumulado — v_result := v_result || linha). O endpoint devolve 201 linhas x
 *  55 colunas sem reclamar; o console nao aguenta o relatorio completo.
 *
 *  PARA ISOLAR: este SELECT roda no console (com ROWNUM <= 20) sem LISTAGG e sem
 *  as janelas de calculo — que passam a ser responsabilidade do PDM. O objetivo
 *  era provar no console, mas as sondas 13/14/15 (volume) nao rodaram nesse
 *  registro. O que entrou no endpoint como "v3.2" de fato foi:
 *
 *    - NF_ITEM_DESCRICOES  -> CAST(NULL AS VARCHAR2(1))  (sem LISTAGG)
 *    - somam os subselects `it` sem item_descricoes
 *    - sem soma_nf_do_cte, sem soma_rateio_do_cte, sem pct_cte_sobre_total_nfs,
 *      sem pct_nf_no_total_cte, sem nf_pct_rateio_no_cte
 *    - bloco `dsp` intacto (inclusive o DENSE_RANK do `rol`)
 *    - ROWNUM <= 20 SO no teste de console; o endpoint publica sem teto
 *
 *  O PDM recalcula os campos derivados no cliente (calcularDerivadosPorCte em
 *  src/app/(dashboard)/ferramentas/nfe-cte/components/utils.ts) usando exatamente
 *  as formulas da v3.1c acima: soma por cte_numero+cte_serie, percentuais com
 *  ROUND(x, 2), so preenchendo quando a API nao devolveu. Veja a secao 22 de
 *  docs/rel-nfe-cte.md.
 * ========================================================================== */
SELECT b.cte_numero,
       b.cte_serie,
       TO_CHAR(b.cte_data, 'DD/MM/YYYY')                                              AS cte_data,
       TO_CHAR(b.cte_data_transacao, 'DD/MM/YYYY')                                    AS cte_data_transacao,
       b.cte_valor_total,
       b.cte_valor_frete,
       b.cte_natureza,
       b.cte_tipo_conhecimento,
       b.cte_cod_cidade_origem,
       b.cte_cod_cidade_destino,
       b.cte_situacao,
       SUBSTR(TRIM(b.cte_transportadora_razao), 1, 60)                      AS cte_transportadora_razao,
       SUBSTR(TRIM(b.cte_transportadora_fantasia), 1, 60)                   AS cte_transportadora_fantasia,
       SUBSTR(TRIM(b.cte_tomador_razao), 1, 60)                             AS cte_tomador_razao,
       SUBSTR(TRIM(b.cte_tomador_fantasia), 1, 60)                          AS cte_tomador_fantasia,
       b.nf_numero,
       b.nf_serie,
       TO_CHAR(b.nf_data, 'DD/MM/YYYY')                                               AS nf_data,
       b.nf_valor_total,
       b.nf_frete_rateado,
       b.nf_situacao,
       SUBSTR(TRIM(b.nf_cliente_razao), 1, 60)                              AS nf_cliente_razao,
       SUBSTR(TRIM(b.nf_cliente_fantasia), 1, 60)                           AS nf_cliente_fantasia,
       SUBSTR(TRIM(b.nf_fornecedor_razao), 1, 60)                           AS nf_fornecedor_razao,
       SUBSTR(TRIM(b.nf_fornecedor_fantasia), 1, 60)                        AS nf_fornecedor_fantasia,
       b.nf_cab_origem,
       b.nf_item_qtd,
       b.nf_item_qtd_total,
       SUBSTR(TRIM(b.nf_item_unidade), 1, 10)                               AS nf_item_unidade,
       CAST(NULL AS VARCHAR2(1))                                            AS nf_item_descricoes,
       b.nf_item_valor_total,
       b.nf_item_icms,
       b.nf_od_pedido,
       TO_CHAR(b.nf_od_data, 'DD/MM/YYYY')                                            AS nf_od_data,
       b.nf_od_valor,
       b.nf_od_qtde,
       SUBSTR(TRIM(b.nf_od_cliente_razao), 1, 60)                           AS nf_od_cliente_razao,
       SUBSTR(TRIM(b.nf_od_cliente_fantasia), 1, 60)                        AS nf_od_cliente_fantasia,
       b.nf_od_cod_cidade,
       SUBSTR(TRIM(b.nf_od_cidade), 1, 40)                                  AS nf_od_cidade,
       SUBSTR(TRIM(b.nf_od_regiao), 1, 30)                                  AS nf_od_regiao,
       SUBSTR(TRIM(b.nf_od_representante), 1, 60)                           AS nf_od_representante,
       b.nf_od_romaneio,
       b.nf_od_qtde_rolos,
       b.nf_od_peso_bruto,
       b.nf_od_peso_liquido,
       SUBSTR(TRIM(b.nf_od_faturamento), 1, 3)                              AS nf_od_faturamento,
       SUBSTR(TRIM(b.nf_od_cfop), 1, 10)                                    AS nf_od_cfop,
       SUBSTR(TRIM(b.nf_od_natureza), 1, 10)                                AS nf_od_natureza,
       CASE WHEN b.nf_cab_origem <> 'SEM_CABECALHO' THEN 'CABECALHO_NF'
            WHEN b.nf_item_valor_total IS NOT NULL  THEN 'RATEIO_CTE'
            ELSE 'SEM_VALOR' END                                                     AS nf_valor_origem
  FROM ( SELECT cte.documento AS cte_numero,
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
                COALESCE(nfe.data_emissao, nfc.data_emissao, nfs.data_emissao) AS nf_data,
                COALESCE(nfe.total_docto, nfc.total_docto, nfs.total_docto) AS nf_valor_total,
                COALESCE(nfe.valor_frete, nfc.valor_frete, nfs.valor_frete) AS nf_frete_rateado,
                COALESCE(nfe.situacao_entrada, nfc.situacao_entrada, nfs.situacao_entrada) AS nf_situacao,
                CASE WHEN nfe.documento IS NOT NULL THEN 'CNPJ_FORNECEDOR'
                     WHEN nfc.documento IS NOT NULL THEN 'CNPJ_CLIENTE_NF'
                     WHEN nfs.documento IS NOT NULL THEN 'DOCUMENTO_SERIE'
                     ELSE 'SEM_CABECALHO' END AS nf_cab_origem,
                cli.nome_fornecedor AS nf_cliente_razao,
                cli.nome_fantasia AS nf_cliente_fantasia,
                forn.nome_fornecedor AS nf_fornecedor_razao,
                forn.nome_fantasia AS nf_fornecedor_fantasia,
                it.item_qtd AS nf_item_qtd,
                it.item_qtd_total AS nf_item_qtd_total,
                it.item_unidade AS nf_item_unidade,
                it.item_valor_total AS nf_item_valor_total,
                it.item_icms AS nf_item_icms,
                dsp.pedido            AS nf_od_pedido,
                dsp.data_movto        AS nf_od_data,
                dsp.valor_saida       AS nf_od_valor,
                dsp.qtde_saida        AS nf_od_qtde,
                dsp.nome_cliente      AS nf_od_cliente_razao,
                dsp.fantasia          AS nf_od_cliente_fantasia,
                dsp.cid               AS nf_od_cod_cidade,
                dsp.cidade            AS nf_od_cidade,
                dsp.nome_regiao       AS nf_od_regiao,
                dsp.nome_represenante AS nf_od_representante,
                dsp.romaneio          AS nf_od_romaneio,
                dsp.qtde_rolos        AS nf_od_qtde_rolos,
                dsp.peso_bruto        AS nf_od_peso_bruto,
                dsp.peso_liquido      AS nf_od_peso_liquido,
                dsp.faturamento       AS nf_od_faturamento,
                dsp.cfop              AS nf_od_cfop,
                dsp.natureza          AS nf_od_natureza
           FROM obrf_016 nf
           JOIN obrf_010 cte
             ON cte.documento     = nf.num_conhecimento
            AND cte.serie         = nf.ser_conhecimento
            AND cte.especie_docto = 'CTE'
           LEFT JOIN obrf_010 nfe
             ON nfe.documento     = nf.numero_nota
            AND nfe.serie         = nf.serie_nota
            AND nfe.cgc_cli_for_9 = nf.fornecedor9
            AND nfe.cgc_cli_for_4 = nf.fornecedor4
            AND nfe.cgc_cli_for_2 = nf.fornecedor2
           LEFT JOIN obrf_010 nfc
             ON nfc.documento     = nf.numero_nota
            AND nfc.serie         = nf.serie_nota
            AND nfc.cgc_cli_for_9 = cte.cgc_cli_for_9
            AND nfc.cgc_cli_for_4 = cte.cgc_cli_for_4
            AND nfc.cgc_cli_for_2 = cte.cgc_cli_for_2
           LEFT JOIN obrf_010 nfs
             ON nfs.documento = nf.numero_nota
            AND nfs.serie     = nf.serie_nota
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
           LEFT JOIN (SELECT i.capa_ent_nrdoc              AS capa_ent_nrdoc,
                             i.capa_ent_serie              AS capa_ent_serie,
                             i.num_nf_saida                AS num_nf_saida,
                             i.serie_nf_saida              AS serie_nf_saida,
                             COUNT(*)                      AS item_qtd,
                             SUM(i.quantidade)             AS item_qtd_total,
                             MAX(i.unidade_medida)         AS item_unidade,
                             SUM(i.valor_total)            AS item_valor_total,
                             SUM(i.valor_icms)             AS item_icms
                        FROM obrf_015 i
                       WHERE i.num_nf_saida IS NOT NULL
                       GROUP BY i.capa_ent_nrdoc, i.capa_ent_serie, i.num_nf_saida, i.serie_nf_saida) it
             ON it.capa_ent_nrdoc = cte.documento
            AND it.capa_ent_serie = cte.serie
            AND it.num_nf_saida   = nf.numero_nota
            AND it.serie_nf_saida = nf.serie_nota
           LEFT JOIN (SELECT TRIM(d.nf)                      AS nf_chave,
                            MAX(d.pedido)                    AS pedido,
                            MAX(d.data_movto)                AS data_movto,
                            SUM(d.valor_saida)               AS valor_saida,
                            SUM(d.qtde_saida)                AS qtde_saida,
                            MAX(TRIM(d.faturamento_sim_nao)) AS faturamento,
                            MAX(TRIM(d.cfop))                AS cfop,
                            MAX(TRIM(d.natureza))            AS natureza,
                            MAX(TRIM(w.nome_cliente))        AS nome_cliente,
                            MAX(TRIM(w.fantasia))            AS fantasia,
                            MAX(w.cid)                       AS cid,
                            MAX(TRIM(w.cidade))              AS cidade,
                            MAX(TRIM(w.nome_regiao))         AS nome_regiao,
                            MAX(TRIM(w.nome_represenante))   AS nome_represenante,
                            MAX(rol.romaneio)                AS romaneio,
                            MAX(rol.qtde_rolos)              AS qtde_rolos,
                            MAX(rol.peso_bruto)              AS peso_bruto,
                            MAX(rol.peso_liquido)            AS peso_liquido
                       FROM pmdvw_nfs d
                       LEFT JOIN pmdvw_vendas w
                         ON w.pedido = d.pedido
                       LEFT JOIN (SELECT x.pedido,
                                         MAX(x.romaneio) AS romaneio,
                                         COUNT(DISTINCT CASE WHEN x.rn = 1 THEN x.codigo_rolo END) AS qtde_rolos,
                                         SUM(CASE WHEN x.rn = 1 THEN x.peso_bruto END) AS peso_bruto,
                                         SUM(CASE WHEN x.rn = 1 THEN x.peso_liquido END) AS peso_liquido
                                    FROM (SELECT r.pedido,
                                                 r.romaneio,
                                                 r.codigo_rolo,
                                                 r.peso_bruto,
                                                 r.peso_liquido,
                                                 DENSE_RANK() OVER (PARTITION BY r.pedido
                                                                     ORDER BY r.romaneio DESC) AS rn
                                             FROM pmdvw_rolos r
                                            WHERE r.romaneio IS NOT NULL
                                              AND r.situacao = 'Fora do estoque') x
                                   GROUP BY x.pedido) rol
                         ON rol.pedido = d.pedido
                     WHERE TRIM(d.entrada_saida) = 'Saida'
                       AND d.pedido > 0
                     GROUP BY TRIM(d.nf)) dsp
            ON dsp.nf_chave = TRIM(nf.numero_nota || '-' || nf.serie_nota)
        ) b
 WHERE COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE), -2)
   AND COALESCE(b.nf_data, b.cte_data) <  TRUNC(SYSDATE) + 1
   AND ROWNUM <= 20
 ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie
