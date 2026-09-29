-- PROBE: por que as NFs do CT-e nao aparecem na ordem de despacho
-- Gerado em 2026-09-29 contra o endpoint publicado.
--
-- CONTROLE (3 NFs que casaram): se a chave volta, o join numero-serie esta certo.
-- As 3 tem de aparecer com achou_nfs = 1 e exatamente os mesmos dados que a
-- ordem de despacho devolve hoje (fantasia, cidade, valor_saida, romaneio).
--
-- RESULTADO ESPERADO DAS 39 QUE FALTARAM:
--   achou_nfs = 0                    -> a NF nao existe em PMDVW_NFS
--   achou_nfs = 1, entrada_saida <> 'Saida'  ou faturamento <> 'Sim' ou cfop = '0'
--                                    -> a NF existe mas e filtrada pela ordem de despacho
--   achou_nfs = 1, flags ok, rolos_fora_estoque = 0
--                                    -> e o INNER JOIN com PMDVW_ROLOS que some com ela
--
-- Sem bind, sem WITH, sem ponto e virgula. Pode rodar direto no console.

SELECT x.nf,
       (SELECT COUNT(*) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)          AS achou_nfs,
       (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)     AS pedido,
       (SELECT MAX(TRIM(v.entrada_saida)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)         AS entrada_saida,
       (SELECT MAX(TRIM(v.faturamento_sim_nao)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)   AS faturamento,
       (SELECT MAX(TRIM(v.cfop)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)                 AS cfop,
       (SELECT MAX(TO_CHAR(v.data_movto,'DD/MM/YYYY')) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS data_movto,
       (SELECT MAX(v.qtde_saida) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)  AS qtde_saida,
       (SELECT MAX(v.valor_saida) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS valor_saida,
       (SELECT MAX(TRIM(v.natureza)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS natureza,
       (SELECT COUNT(*) FROM pmdvw_rolos r
         WHERE r.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)
           AND TRIM(r.situacao) = 'Fora do estoque')                          AS rolos_fora_estoque,
       (SELECT MAX(r.romaneio) FROM pmdvw_rolos r
         WHERE r.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)
           AND TRIM(r.situacao) = 'Fora do estoque')                          AS romaneio,
       (SELECT MAX(TRIM(w.nome_cliente)) FROM pmdvw_vendas w
         WHERE w.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)) AS nome_cliente
  FROM (
  SELECT '35835-1' AS nf FROM dual
UNION ALL
  SELECT '35845-1' AS nf FROM dual
UNION ALL
  SELECT '35843-1' AS nf FROM dual
UNION ALL
  SELECT '35822-1' AS nf FROM dual
UNION ALL
  SELECT '23479-1' AS nf FROM dual
UNION ALL
  SELECT '35782-1' AS nf FROM dual
UNION ALL
  SELECT '35764-1' AS nf FROM dual
UNION ALL
  SELECT '35761-1' AS nf FROM dual
UNION ALL
  SELECT '35756-1' AS nf FROM dual
UNION ALL
  SELECT '35737-1' AS nf FROM dual
UNION ALL
  SELECT '12600-1' AS nf FROM dual
UNION ALL
  SELECT '35714-1' AS nf FROM dual
UNION ALL
  SELECT '35712-1' AS nf FROM dual
UNION ALL
  SELECT '35684-1' AS nf FROM dual
UNION ALL
  SELECT '35674-1' AS nf FROM dual
UNION ALL
  SELECT '20184-1' AS nf FROM dual
UNION ALL
  SELECT '23391-1' AS nf FROM dual
UNION ALL
  SELECT '23392-1' AS nf FROM dual
UNION ALL
  SELECT '35610-1' AS nf FROM dual
UNION ALL
  SELECT '35596-1' AS nf FROM dual
UNION ALL
  SELECT '35591-1' AS nf FROM dual
UNION ALL
  SELECT '20762-1' AS nf FROM dual
UNION ALL
  SELECT '35570-1' AS nf FROM dual
UNION ALL
  SELECT '35569-1' AS nf FROM dual
UNION ALL
  SELECT '35547-1' AS nf FROM dual
UNION ALL
  SELECT '35551-1' AS nf FROM dual
UNION ALL
  SELECT '35544-1' AS nf FROM dual
UNION ALL
  SELECT '35541-1' AS nf FROM dual
UNION ALL
  SELECT '35528-1' AS nf FROM dual
UNION ALL
  SELECT '35532-1' AS nf FROM dual
UNION ALL
  SELECT '35531-1' AS nf FROM dual
UNION ALL
  SELECT '35530-1' AS nf FROM dual
UNION ALL
  SELECT '35522-1' AS nf FROM dual
UNION ALL
  SELECT '23282-1' AS nf FROM dual
UNION ALL
  SELECT '35510-1' AS nf FROM dual
UNION ALL
  SELECT '35505-1' AS nf FROM dual
UNION ALL
  SELECT '35506-1' AS nf FROM dual
UNION ALL
  SELECT '35504-1' AS nf FROM dual
UNION ALL
  SELECT '35503-1' AS nf FROM dual
  ) x
 ORDER BY x.nf


-- CONTROLE POSITIVO: mesmas colunas, 3 NFs que casaram com a ordem de despacho.
SELECT x.nf,
       (SELECT COUNT(*) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)          AS achou_nfs,
       (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)     AS pedido,
       (SELECT MAX(TRIM(v.entrada_saida)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)         AS entrada_saida,
       (SELECT MAX(TRIM(v.faturamento_sim_nao)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)   AS faturamento,
       (SELECT MAX(TRIM(v.cfop)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)                 AS cfop,
       (SELECT MAX(TO_CHAR(v.data_movto,'DD/MM/YYYY')) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS data_movto,
       (SELECT MAX(v.qtde_saida) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)  AS qtde_saida,
       (SELECT MAX(v.valor_saida) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS valor_saida,
       (SELECT MAX(TRIM(v.natureza)) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf) AS natureza,
       (SELECT COUNT(*) FROM pmdvw_rolos r
         WHERE r.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)
           AND TRIM(r.situacao) = 'Fora do estoque')                          AS rolos_fora_estoque,
       (SELECT MAX(r.romaneio) FROM pmdvw_rolos r
         WHERE r.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)
           AND TRIM(r.situacao) = 'Fora do estoque')                          AS romaneio,
       (SELECT MAX(TRIM(w.nome_cliente)) FROM pmdvw_vendas w
         WHERE w.pedido = (SELECT MAX(v.pedido) FROM pmdvw_nfs v WHERE TRIM(v.nf) = x.nf)) AS nome_cliente
  FROM (
  SELECT '35832-1' AS nf FROM dual
UNION ALL
  SELECT '35839-1' AS nf FROM dual
UNION ALL
  SELECT '35827-1' AS nf FROM dual
  ) x
 ORDER BY x.nf
