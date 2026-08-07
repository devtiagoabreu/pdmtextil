import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const { Pool } = pg;

async function main() {
  const mainUrl = process.env.DATABASE_URL;
  const neonUrl = process.env.DATABASE_URL_NEON;

  console.log('=== BANCO PRINCIPAL (DATABASE_URL) ===');
  const main = new Pool({ connectionString: mainUrl, connectionTimeoutMillis: 20000 });
  try {
    await probe(main);
    await orphans(main);
  } catch (e) {
    console.log('ERRO conectando principal:', e.message);
  } finally {
    await main.end().catch(() => {});
  }

  console.log('\n=== NEON (DATABASE_URL_NEON) ===');
  const neon = new Pool({ connectionString: neonUrl, connectionTimeoutMillis: 20000 });
  try {
    await probe(neon);
  } catch (e) {
    console.log('ERRO conectando neon:', e.message);
  } finally {
    await neon.end().catch(() => {});
  }
}

async function probe(pool) {
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  );
  console.log(`Tabelas: ${tables.rows.length}`);
  const want = ['solicitacoes', 'anexos', 'produtos_cru', 'produto_cru_amostra', 'usuarios', 'fornecedores',
    'produto_cru_composicao', 'produto_cru_estrutura', 'produto_cru_acabamento', 'produto_cru_acabamento_amostra',
    'produto_cru_acabamento_receita', 'produto_cru_fios', 'fios', 'composicoes', 'origens', 'titulos', 'corantes', 'pigmentos'];
  for (const t of want) {
    try {
      const r = await pool.query(`SELECT COUNT(*)::int AS c FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].c}`);
    } catch {
      console.log(`  ${t}: (não existe)`);
    }
  }
}

async function orphans(pool) {
  console.log('\n-- Referências órfãs (FK apontando para id inexistente) --');
  const checks = [
    ['anexos.solicitacao_id', `SELECT COUNT(*)::int c FROM anexos a LEFT JOIN solicitacoes s ON s.id=a.solicitacao_id WHERE s.id IS NULL`],
    ['produtos_cru.solicitacao_desenvolvimento_id', `SELECT COUNT(*)::int c FROM produtos_cru p LEFT JOIN solicitacoes s ON s.id=p.solicitacao_desenvolvimento_id WHERE p.solicitacao_desenvolvimento_id IS NOT NULL AND s.id IS NULL`],
    ['produto_cru_amostra.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_amostra a LEFT JOIN produtos_cru p ON p.id=a.produto_cru_id WHERE p.id IS NULL`],
    ['produto_cru_composicao.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_composicao c LEFT JOIN produtos_cru p ON p.id=c.produto_cru_id WHERE p.id IS NULL`],
    ['produto_cru_estrutura.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_estrutura e LEFT JOIN produtos_cru p ON p.id=e.produto_cru_id WHERE p.id IS NULL`],
    ['produto_cru_acabamento.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_acabamento a LEFT JOIN produtos_cru p ON p.id=a.produto_cru_id WHERE p.id IS NULL`],
    ['produto_cru_acabamento_amostra.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_acabamento_amostra a LEFT JOIN produtos_cru p ON p.id=a.produto_cru_id WHERE p.id IS NULL`],
    ['produto_cru_acabamento_receita.produto_cru_id', `SELECT COUNT(*)::int c FROM produto_cru_acabamento_receita r LEFT JOIN produtos_cru p ON p.id=r.produto_cru_id WHERE p.id IS NULL`],
    ['solicitacoes.solicitante_id', `SELECT COUNT(*)::int c FROM solicitacoes s LEFT JOIN usuarios u ON u.id=s.solicitante_id WHERE s.solicitante_id IS NOT NULL AND u.id IS NULL`],
    ['solicitacoes.responsavel_id', `SELECT COUNT(*)::int c FROM solicitacoes s LEFT JOIN usuarios u ON u.id=s.responsavel_id WHERE s.responsavel_id IS NOT NULL AND u.id IS NULL`],
    ['anexos.criado_por', `SELECT COUNT(*)::int c FROM anexos a LEFT JOIN usuarios u ON u.id=a.criado_por WHERE a.criado_por IS NOT NULL AND u.id IS NULL`],
    ['produtos_cru.criado_por', `SELECT COUNT(*)::int c FROM produtos_cru p LEFT JOIN usuarios u ON u.id=p.criado_por WHERE p.criado_por IS NOT NULL AND u.id IS NULL`],
    ['fornecedores.criado_por', `SELECT COUNT(*)::int c FROM fornecedores f LEFT JOIN usuarios u ON u.id=f.criado_por WHERE f.criado_por IS NOT NULL AND u.id IS NULL`],
  ];
  for (const [name, q] of checks) {
    try {
      const r = await pool.query(q);
      const flag = r.rows[0].c > 0 ? '  <<< DANO' : '';
      console.log(`  ${name}: ${r.rows[0].c} órfãos${flag}`);
    } catch (e) {
      console.log(`  ${name}: erro (${e.message.split('\n')[0]})`);
    }
  }
}

main();
