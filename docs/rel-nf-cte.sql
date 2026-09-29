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
   ============================================================================ */
SELECT b.cte_numero,
       b.cte_serie,
       TO_CHAR(b.cte_data, 'DD/MM/YYYY')                                    AS cte_data,
       TO_CHAR(b.cte_data_transacao, 'DD/MM/YYYY')                          AS cte_data_transacao,
       b.cte_valor_total,
       b.cte_valor_frete,
       b.cte_natureza,
       b.cte_tipo_conhecimento,
       b.cte_cod_cidade_origem,
       b.cte_cod_cidade_destino,
       b.cte_situacao,
       b.cte_transportadora_razao,
       b.cte_transportadora_fantasia,
       b.cte_tomador_razao,
       b.cte_tomador_fantasia,
       b.nf_numero,
       b.nf_serie,
       TO_CHAR(b.nf_data, 'DD/MM/YYYY')                                    AS nf_data,
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
       b.nf_cliente_razao,
       b.nf_cliente_fantasia,
       b.nf_fornecedor_razao,
       b.nf_fornecedor_fantasia,
       b.nf_cab_origem,
       b.nf_item_qtd,
       b.nf_item_qtd_total,
       b.nf_item_unidade,
       b.nf_item_descricoes,
       b.nf_item_valor_total,
       b.nf_item_icms,
       SUM(b.nf_item_valor_total) OVER (PARTITION BY b.cte_numero, b.cte_serie) AS soma_rateio_do_cte,
       ROUND(b.nf_item_valor_total / NULLIF(b.cte_valor_total, 0) * 100, 2)    AS nf_pct_rateio_no_cte,
       CASE WHEN b.nf_cab_origem <> 'SEM_CABECALHO' THEN 'CABECALHO_NF'
            WHEN b.nf_item_valor_total IS NOT NULL  THEN 'RATEIO_CTE'
            ELSE 'SEM_VALOR' END                  AS nf_valor_origem
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
                it.item_icms AS nf_item_icms
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
                             LISTAGG(SUBSTR(i.descricao_item, 1, 60), ' | ')
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
       ) b
 WHERE COALESCE(b.nf_data, b.cte_data) >= ADD_MONTHS(TRUNC(SYSDATE), -2)
   AND COALESCE(b.nf_data, b.cte_data) <  TRUNC(SYSDATE) + 1
 ORDER BY b.cte_data DESC, b.cte_numero, b.cte_serie, b.nf_numero, b.nf_serie
