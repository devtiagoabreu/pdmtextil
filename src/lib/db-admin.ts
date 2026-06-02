import { Pool } from "pg"

function parseConnString(connString: string): { base: string } {
  const base = connString.replace(/\/[^/]+$/, "/postgres")
  return { base }
}

export async function createDatabase(connString: string, dbName: string): Promise<{ success: boolean; message: string }> {
  const { base } = parseConnString(connString)
  const pool = new Pool({ connectionString: base })
  try {
    await pool.query(`CREATE DATABASE "${dbName}"`)
    return { success: true, message: `Banco "${dbName}" criado com sucesso.` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, message: msg }
  } finally {
    await pool.end()
  }
}

export async function cloneDatabase(
  sourceConn: string,
  targetConn: string,
  sourceDb: string,
  targetDb: string
): Promise<{ success: boolean; message: string }> {
  const sourceParsed = parseConnString(sourceConn)
  const targetParsed = parseConnString(targetConn)

  const pool = new Pool({ connectionString: sourceParsed.base })
  try {
    const result = await pool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [sourceDb])
    if (result.rows.length === 0) {
      return { success: false, message: `Banco de origem "${sourceDb}" não encontrado.` }
    }
  } finally {
    await pool.end()
  }

  const sameServer = sourceParsed.base === targetParsed.base

  if (sameServer) {
    const pool2 = new Pool({ connectionString: sourceParsed.base })
    try {
      await pool2.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [sourceDb])
      const exists = await pool2.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb])
      if (exists.rows.length > 0) {
        return { success: false, message: `Banco "${targetDb}" já existe. Remova ou escolha outro nome.` }
      }
      await pool2.query(`CREATE DATABASE "${targetDb}" WITH TEMPLATE "${sourceDb}"`)
      return { success: true, message: `Banco "${sourceDb}" clonado para "${targetDb}" com sucesso (mesmo servidor, TEMPLATE).` }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, message: msg }
    } finally {
      await pool2.end()
    }
  } else {
    const srcPool = new Pool({ connectionString: `${sourceParsed.base.replace(/\/[^/]+$/, "")}/${sourceDb}` })
    const tgtPool = new Pool({ connectionString: `${targetParsed.base.replace(/\/[^/]+$/, "")}/${targetDb}` })
    try {
      const exists = await tgtPool.query(`SELECT 1 FROM information_schema.tables LIMIT 1`)
      if (exists.rows.length > 0) {
        return { success: false, message: `Banco "${targetDb}" já existe e contém dados. Remova ou escolha outro nome.` }
      }
    } finally {
      await tgtPool.end()
    }
    // cross-server via pg_dump/pg_restore not available in serverless
    return { success: false, message: `Clone entre servidores diferentes requer pg_dump/pg_restore local. Execute manualmente ou configure no mesmo servidor.` }
  }
}

export async function setupRedundancy(
  primaryConn: string,
  standbyConn: string,
  publicationName: string,
  subscriptionName: string,
  primaryDb: string,
  standbyDb: string
): Promise<{ success: boolean; message: string }> {
  const primaryPool = new Pool({ connectionString: `${parseConnString(primaryConn).base.replace(/\/[^/]+$/, "")}/${primaryDb}` })
  const standbyPool = new Pool({ connectionString: `${parseConnString(standbyConn).base.replace(/\/[^/]+$/, "")}/${standbyDb}` })

  try {
    await primaryPool.query(`DROP PUBLICATION IF EXISTS "${publicationName}"`)
    await primaryPool.query(`CREATE PUBLICATION "${publicationName}" FOR ALL TABLES`)
  } catch (err: unknown) {
    await primaryPool.end()
    await standbyPool.end()
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, message: `Erro ao criar publicação: ${msg}` }
  }

  try {
    // Get the primary connection string with the specific database for the subscription
    const primaryFullConn = `${parseConnString(primaryConn).base.replace(/\/[^/]+$/, "")}/${primaryDb}`
    await standbyPool.query(`DROP SUBSCRIPTION IF EXISTS "${subscriptionName}"`)
    await standbyPool.query(`CREATE SUBSCRIPTION "${subscriptionName}" CONNECTION $1 PUBLICATION "${publicationName}"`, [primaryFullConn])
    return { success: true, message: `Redundância configurada: publicação "${publicationName}" no primário, inscrição "${subscriptionName}" no standby.` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Try to clean up the publication on primary
    try { await primaryPool.query(`DROP PUBLICATION IF EXISTS "${publicationName}"`) } catch { /* ignore */ }
    return { success: false, message: `Erro ao criar inscrição: ${msg}` }
  } finally {
    await primaryPool.end()
    await standbyPool.end()
  }
}
