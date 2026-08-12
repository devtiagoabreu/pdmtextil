import { ImapFlow } from "imapflow"
import { db } from "./db"
import { userEmailConfig } from "./db/schema/user-email-config"
import { emailEnviados } from "./db/schema/email-enviados"
import { emailDisparos } from "./db/schema/email-disparos"
import { and, eq, inArray, sql } from "drizzle-orm"
import { decrypt } from "./crypto"

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const RECIPIENT_PATTERNS = [
  /(?:not|wasn'?t) delivered to\s*:?\s*([^\s<>]+)/i,
  /(?:não|nao) foi entregue (?:a|para)\s*:?\s*([^\s<>]+)/i,
  /couldn'?t (?:be delivered|find)\s*:?\s*([^\s<>]+)/i,
]
const DSN_SENDERS = /^(mailer-daemon|postmaster|noreply|no-reply|abuse|administrator)@/i
const BOUNCE_MAILBOX = /mailer[-_ ]?daemon/i
const JANELA_DIAS = 90
const MAX_UIDS_POR_PASTA = 1000

async function pastasDeBounce(client: ImapFlow): Promise<string[]> {
  const pastas = ["INBOX"]
  const list = await client.list()
  for (const mb of list) {
    if (BOUNCE_MAILBOX.test(`${mb.name} ${mb.path}`) && !pastas.includes(mb.path)) {
      pastas.push(mb.path)
    }
  }
  return pastas
}

function parseRecipientsHeader(value: string): string[] | null {
  const found = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => EMAIL_REGEX.test(s))
  return found.length > 0 ? [...new Set(found)] : null
}

export function parseFailedRecipients(rawSource: string): string[] {
  const lines = rawSource.split(/\r?\n/)
  let bodyStart = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === "") {
      bodyStart = i + 1
      break
    }
    if (/^X-Failed-Recipients:/i.test(line)) {
      let value = line.replace(/^[^:]*:\s*/i, "")
      while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
        i++
        value += lines[i].trim()
      }
      const fromHeader = parseRecipientsHeader(value)
      if (fromHeader) return fromHeader
    }
  }

  const body = lines.slice(bodyStart).join("\n")

  for (const pattern of RECIPIENT_PATTERNS) {
    const matches = body.match(pattern) || []
    if (matches.length > 1) return [...new Set(matches.slice(1))]
  }

  const all = (body.match(EMAIL_REGEX) || [])
    .map((e) => e.toLowerCase())
    .filter((e) => !DSN_SENDERS.test(e))
  return [...new Set(all)]
}

async function recomputarContadores(disparoId: number) {
  await db
    .update(emailDisparos)
    .set({
      enviados: sql`(select count(*) from email_enviados where disparo_id = ${disparoId} and status = 'enviado')`,
      falhas: sql`(select count(*) from email_enviados where disparo_id = ${disparoId} and status = 'falhou')`,
    })
    .where(eq(emailDisparos.id, disparoId))
}

export async function sincronizarBounces(usuarioId: number) {
  const cfgs = await db
    .select()
    .from(userEmailConfig)
    .where(and(eq(userEmailConfig.usuarioId, usuarioId), eq(userEmailConfig.ativo, true)))
    .limit(1)

  if (cfgs.length === 0) {
    return { processados: 0, marcados: 0, disparos: [], erro: "Nenhuma configuração de email ativa encontrada para o usuário" }
  }

  const cfg = cfgs[0]
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: cfg.email, pass: decrypt(cfg.senhaApp) },
    logger: false,
  })

  await client.connect()

  let processados = 0
  const recipients = new Set<string>()

  try {
    const pastas = await pastasDeBounce(client)
    for (const pasta of pastas) {
      const lock = await client.getMailboxLock(pasta)
      try {
        const desde = new Date()
        desde.setDate(desde.getDate() - JANELA_DIAS)
        const uids = (await client.search({ from: "mailer-daemon@googlemail.com", since: desde }, { uid: true })) || []
        for (const uid of uids.slice(-MAX_UIDS_POR_PASTA)) {
          const msg = await client.fetchOne(uid, { headers: true }, { uid: true })
          if (!msg) continue
          const headerText = Buffer.from(msg.headers as Uint8Array).toString("utf8")
          let recips = parseFailedRecipients(headerText)
          if (recips.length === 0 && !/^X-Failed-Recipients:/im.test(headerText)) {
            const full = await client.fetchOne(uid, { source: true }, { uid: true })
            if (full) recips = parseFailedRecipients(Buffer.from(full.source as Uint8Array).toString("utf8"))
          }
          for (const r of recips) recipients.add(r.toLowerCase())
          processados++
        }
      } finally {
        lock.release()
      }
    }
  } finally {
    await client.logout()
  }

  if (recipients.size === 0) {
    return { processados, marcados: 0, disparos: [] }
  }

  const recipientsArray = [...recipients]

const recipientsParam = sql.join(
  recipientsArray.map((r) => sql`${r}`),
  sql`, `
)

const envios = await db
  .select({ id: emailEnviados.id, disparoId: emailEnviados.disparoId })
  .from(emailEnviados)
  .innerJoin(emailDisparos, eq(emailEnviados.disparoId, emailDisparos.id))
  .where(
    and(
      sql`lower(${emailEnviados.email}) = any(ARRAY[${recipientsParam}])`,
      eq(emailEnviados.status, "enviado"),
      eq(emailDisparos.criadoPor, usuarioId),
    )
  )

  const porDisparo = new Map<number, number[]>()
  for (const e of envios) {
    if (!porDisparo.has(e.disparoId!)) porDisparo.set(e.disparoId!, [])
    porDisparo.get(e.disparoId!)!.push(e.id)
  }

  let marcados = 0
  const disparosResult: { disparoId: number; marcados: number }[] = []
  for (const [disparoId, ids] of porDisparo) {
    const updates = await db
      .update(emailEnviados)
      .set({ status: "falhou", error: "Bounce: endereço não encontrado (mailer-daemon)" })
      .where(inArray(emailEnviados.id, ids))
      .returning({ id: emailEnviados.id })
    marcados += updates.length
    await recomputarContadores(disparoId)
    disparosResult.push({ disparoId, marcados: updates.length })
  }

  return { processados, marcados, disparos: disparosResult }
}
