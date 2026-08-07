import pg from 'pg';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

const TS_TYPES = new Set([
  'timestamp without time zone', 'timestamp with time zone', 'date',
  'time without time zone', 'time with time zone',
]);

// FKs declaradas apenas no schema Drizzle (ausentes como constraint no banco restaurado).
// key: colunas usadas para casar linha neon <-> main (a propria coluna FK entra na chave,
// pois o restore preservou os ids antigos nas colunas de dados).
const EXTRA_FKS = [
  { child: 'anexos', col: 'solicitacao_id', parent: 'solicitacoes', key: ['solicitacao_id', 'tipo', 'titulo', 'url'] },
  { child: 'produtos_cru', col: 'solicitacao_desenvolvimento_id', parent: 'solicitacoes', key: ['solicitacao_desenvolvimento_id', 'codigo_pdm'] },
  { child: 'produtos_cru', col: 'criado_por', parent: 'usuarios', key: ['criado_por', 'codigo_pdm'] },
  { child: 'produto_cru_amostra', col: 'produto_cru_id', parent: 'produtos_cru', key: ['produto_cru_id', 'descricao', 'status'] },
  { child: 'produto_cru_composicao', col: 'produto_cru_id', parent: 'produtos_cru', key: ['produto_cru_id', 'material', 'percentual'] },
  { child: 'produto_cru_estrutura', col: 'produto_cru_id', parent: 'produtos_cru', key: ['produto_cru_id', 'tipo', 'fio_id', 'base_urdume_id', 'ordem'] },
  { child: 'produto_cru_acabamento', col: 'produto_cru_id', parent: 'produtos_cru', key: ['produto_cru_id', 'tipo_acabamento', 'descricao'] },
  // base_urdume_fios (schema refs sem constraint no banco)
  { child: 'base_urdume_fios', col: 'base_urdume_id', parent: 'bases_urdume', key: ['base_urdume_id', 'fio_id'] },
  { child: 'base_urdume_fios', col: 'fio_id', parent: 'fios', key: ['base_urdume_id', 'fio_id'] },
  // chats / mensagens / participantes / leituras
  { child: 'chats', col: 'criado_por', parent: 'usuarios', key: ['criado_por', 'tipo', 'titulo'] },
  { child: 'chat_mensagens', col: 'chat_id', parent: 'chats', key: ['chat_id', 'remetente_id', 'mensagem', 'created_at'], tsCol: 'created_at' },
  { child: 'chat_mensagens', col: 'remetente_id', parent: 'usuarios', key: ['chat_id', 'remetente_id', 'mensagem', 'created_at'], tsCol: 'created_at' },
  { child: 'chat_participantes', col: 'chat_id', parent: 'chats', key: ['chat_id', 'usuario_id'] },
  { child: 'chat_participantes', col: 'usuario_id', parent: 'usuarios', key: ['chat_id', 'usuario_id'] },
  { child: 'chat_participantes', col: 'ultima_mensagem_lida_id', parent: 'chat_mensagens', key: ['chat_id', 'usuario_id'] },
  { child: 'chat_leituras', col: 'mensagem_id', parent: 'chat_mensagens', key: ['mensagem_id', 'usuario_id'] },
  { child: 'chat_leituras', col: 'usuario_id', parent: 'usuarios', key: ['mensagem_id', 'usuario_id'] },
  // crm misc
  { child: 'crm_equipe_membros', col: 'equipe_id', parent: 'crm_equipes', key: ['equipe_id', 'representante_id'] },
  { child: 'crm_treino_licoes', col: 'modulo_id', parent: 'crm_treino_modulos', key: ['modulo_id', 'titulo'] },
  { child: 'crm_pessoas', col: 'responsavel_id', parent: 'usuarios', key: ['responsavel_id', 'razao_social'] },
  // notificacoes / email / menus
  { child: 'user_email_config', col: 'usuario_id', parent: 'usuarios', key: ['usuario_id', 'email'] },
  { child: 'user_menus', col: 'usuario_id', parent: 'usuarios', key: ['usuario_id', 'role', 'titulo'] },
  { child: 'user_menu_itens', col: 'user_menu_id', parent: 'user_menus', key: ['user_menu_id', 'titulo', 'url'] },
];

async function q(pool, text, params) {
  return (await pool.query(text, params)).rows;
}

// ------------------------- construção do mapa id antigo (neon) -> id novo (main) -------------------------

async function buildParentMaps(main, neon) {
  const maps = {};

  // chaves naturais simples (colunas de identidade)
  const SIMPLE = {
    usuarios: ['email'],
    fios: ['codigo_completo'],
    fornecedores: ['cnpj'],
    bases_urdume: ['codigo_completo'],
    clientes: ['cnpj'],
    representantes: ['cnpj'],
    crm_equipes: ['nome'],
    crm_estados: ['uf'],
    produtos_cru: ['codigo_pdm'],
    crm_pessoas: ['cnpj'],
    chats: ['titulo'],
    crm_treino_modulos: ['titulo'],
    user_menus: ['usuario_id', 'role', 'titulo'],
  };

  for (const [t, keys] of Object.entries(SIMPLE)) {
    const kcols = keys.join(', ');
    const m = await q(main, `SELECT id, ${kcols} FROM "${t}" ORDER BY id`);
    const n = await q(neon, `SELECT id, ${kcols} FROM "${t}" ORDER BY id`);
    const keyOf = (r) => keys.map((k) => String(r[k] ?? '∅').trim()).join('|');
    const mByKey = new Map();
    let dupM = 0;
    for (const r of m) {
      const k = keyOf(r);
      if (mByKey.has(k)) dupM++;
      mByKey.set(k, r);
    }
    const map = new Map();
    for (const r of n) {
      const mrow = mByKey.get(keyOf(r));
      if (mrow && mrow.id !== r.id) map.set(String(r.id), String(mrow.id));
    }
    maps[t] = { map, dupM, rowsM: m.length, rowsN: n.length };
  }

  // solicitacoes: chave (tipo, status, cliente, projeto) + created_at com deslocamento
  {
    const t = 'solicitacoes';
    const cols = `id, tipo, status, cliente, cnpj, projeto, solicitante_id, responsavel_id, created_at`;
    const m = await q(main, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const n = await q(neon, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const baseKey = (r) => [r.tipo, r.status, norm(r.cliente), norm(r.projeto)].join('|');
    const mByBase = new Map();
    for (const r of m) {
      if (!mByBase.has(baseKey(r))) mByBase.set(baseKey(r), []);
      mByBase.get(baseKey(r)).push(r);
    }
    // deslocamento: media da diferenca para pares unicos
    let offset = 0;
    const diffs = [];
    for (const r of n) {
      const cands = mByBase.get(baseKey(r)) || [];
      if (cands.length === 1) {
        diffs.push(new Date(cands[0].created_at) - new Date(r.created_at));
      }
    }
    if (diffs.length) offset = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length / 3600000) * 3600000;
    if (diffs.length < 6) offset = 3 * 3600000;

    const map = new Map();
    const ambiguous = [];
    const pairs = [];
    for (const r of n) {
      const cands = mByBase.get(baseKey(r)) || [];
      const target = new Date(r.created_at).getTime() + offset;
      const scored = cands
        .map((c) => ({ c, d: Math.abs(new Date(c.created_at).getTime() - target) }))
        .sort((a, b) => a.d - b.d);
      if (scored.length && scored[0].d < 60 * 60 * 1000 && (scored.length === 1 || scored[1].d - scored[0].d > 5 * 60 * 1000)) {
        const best = scored[0].c;
        pairs.push({ neon: r, main: best });
        if (best.id !== r.id) map.set(String(r.id), String(best.id));
      } else {
        ambiguous.push({ key: baseKey(r), neonId: r.id, cands: cands.map((c) => c.id) });
      }
    }
    maps[t] = { map, dupM: 0, rowsM: m.length, rowsN: n.length, offsetH: offset / 3600000, ambiguous, pairs };
  }

  // requisicoes_corte: chave (status, observacoes)
  {
    const t = 'requisicoes_corte';
    const m = await q(main, `SELECT id, status, observacoes, requisitante_id FROM "${t}" ORDER BY id`);
    const n = await q(neon, `SELECT id, status, observacoes, requisitante_id FROM "${t}" ORDER BY id`);
    const keyOf = (r) => `${r.status}|${String(r.observacoes ?? '').trim()}`;
    const mByKey = new Map();
    for (const r of m) mByKey.set(keyOf(r), r);
    const map = new Map();
    for (const r of n) {
      const mrow = mByKey.get(keyOf(r));
      if (mrow && mrow.id !== r.id) map.set(String(r.id), String(mrow.id));
    }
    maps[t] = { map, dupM: 0, rowsM: m.length, rowsN: n.length };
  }

  // chat_mensagens: chave (chat_id, remetente_id, mensagem) + created_at com deslocamento
  {
    const t = 'chat_mensagens';
    const cols = `id, chat_id, remetente_id, mensagem, created_at`;
    const m = await q(main, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const n = await q(neon, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const baseKey = (r) => `${r.chat_id}|${r.remetente_id}|${String(r.mensagem ?? '').trim()}`;
    const mByBase = new Map();
    for (const r of m) {
      if (!mByBase.has(baseKey(r))) mByBase.set(baseKey(r), []);
      mByBase.get(baseKey(r)).push(r);
    }
    let offset = 0;
    const diffs = [];
    for (const r of n) {
      const cands = mByBase.get(baseKey(r)) || [];
      if (cands.length === 1) diffs.push(new Date(cands[0].created_at) - new Date(r.created_at));
    }
    if (diffs.length) offset = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);

    const map = new Map();
    const ambiguous = [];
    for (const r of n) {
      const cands = mByBase.get(baseKey(r)) || [];
      const target = new Date(r.created_at).getTime() + offset;
      const scored = cands
        .map((c) => ({ c, d: Math.abs(new Date(c.created_at).getTime() - target) }))
        .sort((a, b) => a.d - b.d);
      if (scored.length && scored[0].d < 60 * 60 * 1000 && (scored.length === 1 || scored[1].d - scored[0].d > 5 * 60 * 1000)) {
        const best = scored[0].c;
        if (best.id !== r.id) map.set(String(r.id), String(best.id));
      } else {
        ambiguous.push({ key: baseKey(r), neonId: r.id, cands: cands.map((c) => c.id) });
      }
    }
    maps[t] = { map, dupM: 0, rowsM: m.length, rowsN: n.length, offsetH: offset / 3600000, ambiguous };
  }

  return maps;
}

// ------------------------- remap por linha de cada FK -------------------------

async function buildRemaps(main, neon, maps, fks) {
  const updates = []; // { child, col, rows: [{ id, from, to, note }] }

  for (const fk of fks) {
    const { child, col, parent } = fk;
    const pmap = maps[parent];
    if (!pmap) {
      updates.push({ child, col, parent, skipped: true, reason: `sem mapa para pai ${parent}` });
      continue;
    }
    if (pmap.map.size === 0) {
      updates.push({ child, col, parent, skipped: true, reason: `pai ${parent} sem renumeracao (ids preservados)` });
      continue;
    }

    // colunas comuns para chave de casamento (exclui id, timestamps, jsonb);
    // para FKs extras (sem constraint no banco) usa a chave explicita definida acima
    let keyCols;
    let jsonbCols;
    if (fk.key) {
      keyCols = fk.key.map((c) => ({ column_name: c, data_type: 'key' }));
      jsonbCols = [];
    } else {
      const cols = await q(main, `
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [child]);
      keyCols = cols.filter(
        (c) => c.column_name !== 'id' && !TS_TYPES.has(c.data_type) && c.data_type !== 'jsonb' && c.data_type !== 'ARRAY'
      );
      jsonbCols = cols.filter((c) => c.data_type === 'jsonb' || c.data_type === 'ARRAY').map((c) => c.column_name);
    }
    const keySel = keyCols.map((c) => c.column_name).join(', ');

    const mRows = await q(main, `SELECT id, ${col}, ${keySel} FROM "${child}" WHERE "${col}" IS NOT NULL ORDER BY id`);
    let nRows;
    try {
      nRows = await q(neon, `SELECT id, ${col}, ${keySel} FROM "${child}" WHERE "${col}" IS NOT NULL ORDER BY id`);
    } catch {
      updates.push({ child, col, parent, skipped: true, reason: `neon sem a tabela/coluna` });
      continue;
    }

    const keyOf = (r) => keyCols.map((c) => String(r[c.column_name] ?? '∅')).join('|');
    const nByKey = new Map();
    for (const r of nRows) {
      const k = keyOf(r);
      if (!nByKey.has(k)) nByKey.set(k, []);
      nByKey.get(k).push(r);
    }

    const rows = [];
    const unmatched = [];
    const ambiguous = [];

    if (fk.tsCol) {
      // casamento por chave base + created_at com deslocamento (main vs neon fora de sincronia)
      const baseKeyCols = keyCols.filter((c) => c.column_name !== fk.tsCol);
      const keyOfBase = (r) => baseKeyCols.map((c) => String(r[c.column_name] ?? '∅')).join('|');
      const mByBase = new Map();
      for (const r of mRows) {
        const k = keyOfBase(r);
        if (!mByBase.has(k)) mByBase.set(k, []);
        mByBase.get(k).push(r);
      }
      const diffs = [];
      for (const r of nRows) {
        const cands = mByBase.get(keyOfBase(r)) || [];
        if (cands.length === 1) diffs.push(new Date(cands[0][fk.tsCol]) - new Date(r[fk.tsCol]));
      }
      let offset = 0;
      if (diffs.length) offset = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      const nByBase = new Map();
      for (const r of nRows) {
        const k = keyOfBase(r);
        if (!nByBase.has(k)) nByBase.set(k, []);
        nByBase.get(k).push(r);
      }
      for (const mr of mRows) {
        const matches = nByBase.get(keyOfBase(mr)) || [];
        if (matches.length === 0) { unmatched.push(mr.id); continue; }
        const target = new Date(mr[fk.tsCol]).getTime();
        const scored = matches
          .map((c) => ({ c, d: Math.abs(new Date(c[fk.tsCol]).getTime() + offset - target) }))
          .sort((a, b) => a.d - b.d);
        if (scored[0].d >= 60 * 60 * 1000 || (scored.length > 1 && scored[1].d - scored[0].d <= 5 * 60 * 1000)) {
          ambiguous.push(mr.id);
          continue;
        }
        const match = scored[0].c;
        const oldVal = String(match[fk.col]);
        if (!pmap.map.has(String(mr[fk.col]))) {
          rows.push({ id: mr.id, from: oldVal, to: null, note: 'valor ja novo/preservado (nao tocar)' });
          continue;
        }
        const newVal = pmap.map.get(oldVal);
        if (newVal === undefined) {
          rows.push({ id: mr.id, from: oldVal, to: null, note: 'sem mapeamento do pai' });
          continue;
        }
        if (String(mr[fk.col]) === newVal) continue;
        rows.push({ id: mr.id, from: oldVal, to: newVal, note: '' });
      }
      updates.push({ child, col, parent, rows, unmatched, ambiguous, skipped: false, offsetH: offset / 3600000 });
      continue;
    }

    for (const mr of mRows) {
      const matches = nByKey.get(keyOf(mr)) || [];
      if (matches.length === 0) { unmatched.push(mr.id); continue; }
      if (matches.length > 1) { ambiguous.push(mr.id); continue; }
      const oldVal = String(matches[0][col]);
      if (!pmap.map.has(String(mr[col]))) {
        rows.push({ id: mr.id, from: oldVal, to: null, note: 'valor ja novo/preservado (nao tocar)' });
        continue;
      }
      const newVal = pmap.map.get(oldVal);
      if (newVal === undefined) {
        rows.push({ id: mr.id, from: oldVal, to: null, note: 'sem mapeamento do pai' });
        continue;
      }
      if (String(mr[col]) === newVal) continue; // ja correto
      rows.push({ id: mr.id, from: oldVal, to: newVal, note: jsonbCols.length ? `jsonb:${jsonbCols.join(',')}` : '' });
    }

    updates.push({ child, col, parent, rows, unmatched, ambiguous, skipped: false });
  }

  return updates;
}

// ------------------------- execucao -------------------------

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000, options: '-c timezone=UTC' });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000, options: '-c timezone=UTC' });

  const maps = await buildParentMaps(main, neon);

  console.log('=== MAPAS (id antigo -> id novo) ===');
  for (const [t, info] of Object.entries(maps)) {
    console.log(`\n${t}: ${info.map.size} renumerados (main ${info.rowsM}, neon ${info.rowsN})${info.offsetH ? `, offset ${info.offsetH}h` : ''}${info.ambiguous && info.ambiguous.length ? `, AMBÍGUOS: ${info.ambiguous.length}` : ''}`);
    const arr = [...info.map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
    for (const [from, to] of arr.slice(0, 60)) console.log(`   ${from} -> ${to}`);
    if (arr.length > 60) console.log(`   ... +${arr.length - 60}`);
    if (info.ambiguous) for (const a of info.ambiguous) console.log(`   ⚠ ambíguo: ${a.key} neonId=${a.neonId} cands=[${a.cands.join(',')}]`);
  }

  const fks = await q(main, `
    SELECT tc.table_name AS child, kcu.column_name AS col, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY child, col`);

  const allFks = fks.concat(EXTRA_FKS);
  const seen = new Set();
  // FKs resolvidas por decisão manual (fora do remap mecânico):
  // user_email_config id=1 (restaurada) é duplicada pela id=2 (criada pós-restore);
  // mantida a id=2, a id=1 é apagada no apply -> seção de remap é desnecessária.
  const SKIP_FKS = new Set(['user_email_config|usuario_id|usuarios']);
  const uniqueFks = allFks.filter((f) => {
    const k = `${f.child}|${f.col}|${f.parent}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return !SKIP_FKS.has(k);
  });

  const updates = await buildRemaps(main, neon, maps, uniqueFks);

  console.log('\n=== REMAP GERADO ===');
  let totalRows = 0;
  const sqlParts = ['-- Fix FKs: remap de ids antigos (Neon) para novos (pdm_textil)', '-- Gerado automaticamente por scripts/fix-remap.mjs', '', 'BEGIN;'];
  const report = ['RELATÓRIO DE REMAP', '', '=== MAPAS ==='];
  for (const [t, info] of Object.entries(maps)) {
    report.push(`${t}: ${info.map.size} renumerados`);
  }

  for (const u of updates) {
    if (u.skipped) {
      console.log(`\n${u.child}.${u.col} -> ${u.parent}: [pulado] ${u.reason}`);
      report.push(`\n${u.child}.${u.col} -> ${u.parent}: PULADO (${u.reason})`);
      continue;
    }
    const { child, col, parent, rows, unmatched, ambiguous } = u;
    const valid = rows.filter((r) => r.to !== null);
    totalRows += valid.length;
    console.log(`\n${child}.${col} -> ${parent}: ${valid.length} updates, ${unmatched.length} novos (sem tocar), ${ambiguous.length} ambíguos`);
    for (const r of rows.slice(0, 12)) {
      console.log(`   id=${r.id}: ${r.from} -> ${r.to ?? '??'}${r.note ? ` [${r.note}]` : ''}`);
    }
    if (rows.length > 12) console.log(`   ... +${rows.length - 12}`);
    report.push(`\n${child}.${col} -> ${parent}: ${valid.length} updates (${unmatched.length} novos ignorados, ${ambiguous.length} ambíguos)`);
    for (const r of rows) report.push(`  id=${r.id}: ${r.from} -> ${r.to ?? 'SEM MAPA'}`);

    if (valid.length) {
      const vals = valid.map((r) => `(${r.id}, ${r.to})`).join(',\n  ');
      sqlParts.push(`\n-- ${child}.${col} -> ${parent}: ${valid.length} linhas`);
      sqlParts.push(`UPDATE "${child}" SET "${col}" = v.nv FROM (VALUES`);
      sqlParts.push(`  ${vals}`);
      sqlParts.push(`) AS v(id, nv) WHERE "${child}".id = v.id;`);
    }
  }

  // solicitante_id / responsavel_id: casamento pelo mapa de pares de solicitacoes
  // (full-row match falha pois briefing/observacoes foram editados apos o restore)
  {
    const sol = maps.solicitacoes;
    const usMap = maps.usuarios.map;
    for (const colName of ['solicitante_id', 'responsavel_id']) {
      const rows = [];
      for (const { neon, main } of sol.pairs) {
        const oldVal = String(neon[colName] ?? '');
        if (!oldVal || oldVal === '∅' || oldVal === 'null') continue;
        const newVal = usMap.get(oldVal);
        if (!newVal) {
          // id preservado: verificar se realmente o mesmo usuario
          rows.push({ id: main.id, from: oldVal, to: null, note: 'id sem renumeração (verificar)' });
          continue;
        }
        if (String(main[colName]) === newVal) continue;
        rows.push({ id: main.id, from: oldVal, to: newVal, note: '' });
      }
      const valid = rows.filter((r) => r.to !== null);
      if (rows.length) {
        totalRows += valid.length;
        console.log(`\nsolicitacoes.${colName} -> usuarios: ${valid.length} updates (via pares), ${rows.length - valid.length} id preservado`);
        report.push(`\nsolicitacoes.${colName} -> usuarios: ${valid.length} updates (via pares)`);
        for (const r of rows) report.push(`  id=${r.id}: ${r.from} -> ${r.to ?? 'PRESERVADO'}`);
        if (valid.length) {
          const vals = valid.map((r) => `(${r.id}, ${r.to})`).join(',\n  ');
          sqlParts.push(`\n-- solicitacoes.${colName} -> usuarios: ${valid.length} linhas`);
          sqlParts.push(`UPDATE "solicitacoes" SET "${colName}" = v.nv FROM (VALUES`);
          sqlParts.push(`  ${vals}`);
          sqlParts.push(`) AS v(id, nv) WHERE "solicitacoes".id = v.id;`);
        }
      }
    }
  }

  // requisitante_id (coluna sem FK declarada mas referencia usuarios)
  {
    const usMap = maps.usuarios.map;
    const m = await q(main, `SELECT id, requisitante_id FROM requisicoes_corte ORDER BY id`);
    const n = await q(neon, `SELECT id, requisitante_id FROM requisicoes_corte ORDER BY id`);
    const keyOf = (r) => `${r.status ?? ''}`;
    void keyOf;
    const rows = [];
    const nById = new Map(n.map((r) => [String(r.id), r]));
    for (const mr of m) {
      const oldVal = nById.get(String(mr.id));
      void oldVal;
    }
    // casa por posicao/status: usar o mapa de requisicoes_corte construido acima
    const rc = maps.requisicoes_corte;
    const nByStatus = new Map(n.map((r) => [r.status, r]));
    for (const mr of m) {
      const nr = nByStatus.get(mr.status);
      if (nr && String(mr.requisitante_id) !== '∅') {
        const newVal = usMap.get(String(mr.requisitante_id));
        if (newVal && String(mr.requisitante_id) !== newVal) rows.push({ id: mr.id, from: mr.requisitante_id, to: newVal });
      }
    }
    void rc;
    if (rows.length) {
      totalRows += rows.length;
      console.log(`\nrequisicoes_corte.requisitante_id -> usuarios: ${rows.length} updates (sem FK declarada)`);
      report.push(`\nrequisicoes_corte.requisitante_id -> usuarios: ${rows.length} updates (sem FK declarada)`);
      for (const r of rows) report.push(`  id=${r.id}: ${r.from} -> ${r.to}`);
      const vals = rows.map((r) => `(${r.id}, ${r.to})`).join(',\n  ');
      sqlParts.push(`\n-- requisicoes_corte.requisitante_id -> usuarios: ${rows.length} linhas (sem FK declarada)`);
      sqlParts.push(`UPDATE "requisicoes_corte" SET "requisitante_id" = v.nv FROM (VALUES`);
      sqlParts.push(`  ${vals}`);
      sqlParts.push(`) AS v(id, nv) WHERE "requisicoes_corte".id = v.id;`);
    }
  }

  // notificacoes.usuario_id: remap por VALOR (ids antigos de usuario na coluna).
  // casamento por chave e ambíguo em lotes de notificações idênticas; linhas restauradas
  // preservam o id antigo do usuario e linhas novas usam ids novos (fora do mapa) -> skip.
  {
    const usMap = maps.usuarios.map;
    const m = await q(main, `SELECT id, usuario_id FROM notificacoes WHERE usuario_id IS NOT NULL ORDER BY id`);
    const rows = [];
    for (const r of m) {
      const oldVal = String(r.usuario_id);
      if (!usMap.has(oldVal)) continue; // ja novo ou usuario preservado (6/23)
      const newVal = usMap.get(oldVal);
      if (String(r.usuario_id) === newVal) continue;
      rows.push({ id: r.id, from: oldVal, to: newVal });
    }
    if (rows.length) {
      totalRows += rows.length;
      console.log(`\nnotificacoes.usuario_id -> usuarios: ${rows.length} updates (remap por valor)`);
      report.push(`\nnotificacoes.usuario_id -> usuarios: ${rows.length} updates (remap por valor)`);
      for (const r of rows.slice(0, 12)) report.push(`  id=${r.id}: ${r.from} -> ${r.to}`);
      if (rows.length > 12) report.push(`  ... +${rows.length - 12}`);
      const vals = rows.map((r) => `(${r.id}, ${r.to})`).join(',\n  ');
      sqlParts.push(`\n-- notificacoes.usuario_id -> usuarios: ${rows.length} linhas (remap por valor)`);
      sqlParts.push(`UPDATE "notificacoes" SET "usuario_id" = v.nv FROM (VALUES`);
      sqlParts.push(`  ${vals}`);
      sqlParts.push(`) AS v(id, nv) WHERE "notificacoes".id = v.id;`);
    }
  }

  sqlParts.push('', 'COMMIT;', '', '-- verificacao pós-fix:', '-- SELECT COUNT(*) FROM anexos a LEFT JOIN solicitacoes s ON s.id=a.solicitacao_id WHERE s.id IS NULL;', '-- ...');
  writeFileSync('backups/fix-fk-remap.sql', sqlParts.join('\n'), 'utf8');
  writeFileSync('backups/fix-fk-report.txt', report.join('\n'), 'utf8');

  console.log(`\nTOTAL: ${totalRows} updates gerados`);
  console.log('Arquivos: backups/fix-fk-remap.sql e backups/fix-fk-report.txt');

  await main.end();
  await neon.end();
}

main();
