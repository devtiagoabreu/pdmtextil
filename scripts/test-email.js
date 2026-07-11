const { neon } = require("@neondatabase/serverless")
const nodemailer = require("nodemailer")
const crypto = require("crypto")
const dotenv = require("dotenv")
const path = require("path")

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") })

const ALGORITHM = "aes-256-gcm"
const SEPARATOR = ":"

function getKey() {
  return crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY).digest()
}

function decrypt(encrypted) {
  const parts = encrypted.split(SEPARATOR)
  if (parts.length !== 3) return encrypted
  const [ivHex, authTagHex, data] = parts
  try {
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    return decipher.update(data, "hex", "utf8") + decipher.final("utf8")
  } catch {
    return encrypted
  }
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const email = process.argv[2] || "devtiagoabreu@gmail.com"

  console.log("Buscando config SMTP...")
  const configs = await sql`SELECT * FROM email_config WHERE ativo = true LIMIT 1`
  if (configs.length === 0) {
    console.log("Nenhuma config SMTP ativa encontrada.")
    process.exit(1)
  }

  const cfg = configs[0]
  console.log(`SMTP: ${cfg.host}:${cfg.port} (${cfg.user})`)

  const pass = decrypt(cfg.pass)
  console.log("Senha obtida com sucesso")

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass },
  })

  const baseUrl = "https://pdmprotextil.vercel.app"
  const trackingId = crypto.randomUUID()
  const pixelUrl = `${baseUrl}/api/admin/email-massa/tracking/${trackingId}`

  const imgProduto1 = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80"
  const imgProduto2 = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80"
  const imgProduto3 = "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80"

  const linksParaTestar = [
    { label: "Visitar Site PDM Têxtil", url: "https://pdmprotextil.vercel.app" },
    { label: "Ver Instagram", url: "https://instagram.com" },
    { label: "Pesquisar no Google", url: "https://google.com" },
    { label: "Ver Unsplash", url: "https://unsplash.com" },
  ]

  const linksHtml = linksParaTestar
    .map(l => {
      const clickUrl = `${baseUrl}/api/admin/email-massa/click/${trackingId}?url=${encodeURIComponent(l.url)}`
      return `<li><a href="${clickUrl}" style="color:#1e40af;font-weight:500">${l.label}</a></li>`
    })
    .join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#1e40af;text-align:center">Email de Teste - PDM T\u00eaxtil</h1>
      <p style="text-align:center;color:#666">Sistema de Email em Massa com Tracking</p>

      <p>Ol\u00e1! Este email foi enviado para testar o <strong>tracking de abertura e cliques</strong>.</p>

      <h2 style="color:#333;margin-top:30px">Imagens</h2>
      <p>Se estas imagens carregarem, o pixel tracking j\u00e1 vai registrar a abertura:</p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:15px 0">
        <img src="${imgProduto1}" width="180" style="border-radius:8px" alt="Produto 1" />
        <img src="${imgProduto2}" width="180" style="border-radius:8px" alt="Produto 2" />
        <img src="${imgProduto3}" width="180" style="border-radius:8px" alt="Produto 3" />
      </div>

      <h2 style="color:#333;margin-top:30px">Links para Testar</h2>
      <p>Clique em cada link para testar o tracking:</p>
      <ul style="line-height:2">
        ${linksHtml}
      </ul>

      <p style="color:#999;font-size:12px;margin-top:30px;text-align:center">
        Tracking ID: ${trackingId}<br />
        Enviado em ${new Date().toLocaleString("pt-BR")}
      </p>

      <img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />
    </div>
  `

  // Registra o envio no banco ANTES de enviar
  console.log("\nRegistrando envio no banco...")
  await sql`
    INSERT INTO email_enviados (email, nome, assunto, status, tracking_id)
    VALUES (${email}, 'Tiago Abreu', 'Teste Tracking - Email em Massa PDM Têxtil', 'enviado', ${trackingId})
  `
  console.log("Registrado!")

  console.log(`\nDestino: ${email}`)
  console.log(`Tracking ID: ${trackingId}`)
  console.log(`Pixel: ${pixelUrl}`)

  for (const l of linksParaTestar) {
    const clickUrl = `${baseUrl}/api/admin/email-massa/click/${trackingId}?url=${encodeURIComponent(l.url)}`
    console.log(`Link "${l.label}": ${clickUrl}`)
  }

  try {
    const info = await transporter.sendMail({
      from: `"${cfg.from_name || "PDM T\u00eaxtil"}" <${cfg.user}>`,
      to: email,
      subject: "Teste Tracking - Email em Massa PDM T\u00eaxtil",
      html,
    })
    console.log("\nEmail enviado com sucesso!")
    console.log("Message ID:", info.messageId)
    process.exit(0)
  } catch (err) {
    console.log("Erro:", err.message)
    process.exit(1)
  }
}

main()
