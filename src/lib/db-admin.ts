import { Pool } from "pg"

function parseConnString(connString: string): { base: string } {
  // postgresql://user:pass@host:5432/db?params
  // postgresql:///db?host=/socket  (socket)
  // simple: /var/run/postgresql or host:port/db
  try {
    const url = new URL(connString)
    const dbName = url.pathname.replace(/^\//, "") || "postgres"
    url.pathname = "/postgres"
    return { base: url.toString() }
  } catch {
    // Not a valid URL — treat as local socket or shorthand
    const slashIdx = connString.lastIndexOf("/")
    if (slashIdx >= 0) {
      return { base: connString.slice(0, slashIdx + 1) + "postgres" }
    }
    return { base: connString ? "postgresql:///" + connString : "postgresql:///postgres" }
  }
}

function serverBase(connString: string): string {
  const { base } = parseConnString(connString)
  return base
}

function dbConnString(connString: string, dbName: string): string {
  try {
    const url = new URL(connString)
    url.pathname = "/" + dbName
    return url.toString()
  } catch {
    const slashIdx = connString.lastIndexOf("/")
    if (slashIdx >= 0) {
      return connString.slice(0, slashIdx + 1) + dbName
    }
    return "postgresql:///" + dbName
  }
}

export async function createDatabase(connString: string, dbName: string): Promise<{ success: boolean; message: string }> {
  const pool = new Pool({ connectionString: serverBase(connString) })
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
  const server = serverBase(sourceConn)

  const pool = new Pool({ connectionString: server })
  try {
    const result = await pool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [sourceDb])
    if (result.rows.length === 0) {
      return { success: false, message: `Banco de origem "${sourceDb}" não encontrado.` }
    }
  } finally {
    await pool.end()
  }

  const sameServer = serverBase(sourceConn) === serverBase(targetConn)

  if (sameServer) {
    const pool2 = new Pool({ connectionString: server })
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
    // cross-server: check if target exists
    const tgtPool = new Pool({ connectionString: dbConnString(targetConn, targetDb) })
    try {
      const exists = await tgtPool.query(`SELECT 1 FROM information_schema.tables LIMIT 1`)
      if (exists.rows.length > 0) {
        return { success: false, message: `Banco "${targetDb}" já existe e contém dados. Remova ou escolha outro nome.` }
      }
    } finally {
      await tgtPool.end()
    }
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
  const primaryPool = new Pool({ connectionString: dbConnString(primaryConn, primaryDb) })
  const standbyPool = new Pool({ connectionString: dbConnString(standbyConn, standbyDb) })

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
    const primaryFullConn = dbConnString(primaryConn, primaryDb)
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
