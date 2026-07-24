type BlockType = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "img" | "ul" | "ol" | "hr"

export type ModeloBlock = {
  t: BlockType
  c?: string
  s?: string
  p?: "inline" | "float-left" | "float-right" | "free"
  a?: string
  l?: "left" | "center" | "right"
  f?: string
  z?: string
  i?: string[]
}

const INLINE_MD: Record<string, [string, string]> = {
  B: ["**", "**"],
  STRONG: ["**", "**"],
  I: ["*", "*"],
  EM: ["*", "*"],
  S: ["~~", "~~"],
  STRIKE: ["~~", "~~"],
  DEL: ["~~", "~~"],
}

function inlineToMarkdown(el: ChildNode): string {
  const text = el.textContent ?? ""
  if (el.nodeType === 3) return text
  if (el.nodeType !== 1) return text
  const tag = (el as HTMLElement).tagName
  const em = (el as HTMLElement).style

  if (tag === "A") {
    const href = (el as HTMLAnchorElement).href || ""
    return `[${text}](${href})`
  }

  if (tag === "U") return `<u>${text}</u>`

  if (tag === "IMG") {
    const img = el as HTMLImageElement
    return `<img src="${img.src}" alt="${img.alt || ""}" />`
  }

  if (tag === "SPAN" || tag === "FONT") {
    const styles: string[] = []
    if (em.color) styles.push(`color:${em.color}`)
    if (em.backgroundColor) styles.push(`background-color:${em.backgroundColor}`)
    if (em.fontFamily) styles.push(`font-family:${em.fontFamily}`)
    if (em.fontSize) styles.push(`font-size:${em.fontSize}`)
    if (styles.length) return `<span style="${styles.join(";")}">${text}</span>`
    return text
  }

  let inner = ""
  for (const child of el.childNodes) inner += inlineToMarkdown(child)

  const md = INLINE_MD[tag]
  if (md) return `${md[0]}${inner}${md[1]}`

  if (tag === "BR") return "\n"

  return inner
}

function blockAlign(el: HTMLElement): "left" | "center" | "right" | undefined {
  const a = el.getAttribute("align") || el.style.textAlign
  if (a === "center" || a === "right") return a
  return undefined
}

function blockFontFamily(el: HTMLElement): string | undefined {
  return el.style.fontFamily || undefined
}

function blockFontSize(el: HTMLElement): string | undefined {
  return el.style.fontSize || undefined
}

function getImageBlock(el: HTMLElement): ModeloBlock | null {
  const img = el.querySelector("img")
  if (!img) return null
  const style = el.style
  let position: ModeloBlock["p"] = "inline"
  if (style.cssFloat === "left" || style.float === "left") position = "float-left"
  else if (style.cssFloat === "right" || style.float === "right") position = "float-right"
  else if (style.position === "absolute") position = "free"
  return {
    t: "img",
    s: img.src,
    a: img.alt || undefined,
    p: position,
  }
}

export function htmlToModelo(html: string): string {
  if (typeof DOMParser === "undefined") return html
  const parser = new DOMParser()
  const doc = parser.parseFromString(
    `<div id="_r">${html}</div>`,
    "text/html"
  )
  const root = doc.getElementById("_r")
  if (!root) return html
  const blocks: ModeloBlock[] = []

  for (const el of root.childNodes) {
    if (el.nodeType === 3) {
      const t = el.textContent?.trim()
      if (t) blocks.push({ t: "p", c: t })
      continue
    }
    if (el.nodeType !== 1) continue
    const e = el as HTMLElement
    const tag = e.tagName

    if (e.classList.contains("resizable-image")) {
      const img = getImageBlock(e)
      if (img) blocks.push(img)
      continue
    }

    if (/^H[1-6]$/.test(tag)) {
      blocks.push({
        t: tag.toLowerCase() as BlockType,
        c: inlineToMarkdown(e),
        l: blockAlign(e),
        f: blockFontFamily(e),
        z: blockFontSize(e),
      })
      continue
    }

    if (tag === "P" || tag === "DIV") {
      const imgBlock = getImageBlock(e)
      if (imgBlock) {
        blocks.push(imgBlock)
        continue
      }
      const c = inlineToMarkdown(e).trim()
      if (c) blocks.push({ t: "p", c, l: blockAlign(e) })
      continue
    }

    if (tag === "UL" || tag === "OL") {
      const items: string[] = []
      for (const li of e.querySelectorAll(":scope > li")) {
        items.push(inlineToMarkdown(li))
      }
      blocks.push({
        t: tag.toLowerCase() as "ul" | "ol",
        i: items,
      })
      continue
    }

    if (tag === "HR") {
      blocks.push({ t: "hr" })
      continue
    }

    if (tag === "IMG") {
      const img = e as HTMLImageElement
      blocks.push({ t: "img", s: img.src, a: img.alt || undefined, p: "inline" })
      continue
    }
  }

  return JSON.stringify(blocks)
}

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

export function modeloToHtml(stored: string): string {
  let blocks: ModeloBlock[]
  try {
    blocks = JSON.parse(stored)
    if (!Array.isArray(blocks)) throw 0
  } catch {
    return isHtml(stored) ? stored : stored.replace(/\n/g, "<br>")
  }

  function renderInline(md: string): string {
    let r = md
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\*([^*]+)\*/g, "<i>$1</i>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    if (!r.includes("<u>")) return r
    return r.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
  }

  return blocks
    .map((b) => {
      const style = [b.l ? `text-align:${b.l}` : "", b.f ? `font-family:${b.f}` : "", b.z ? `font-size:${b.z}` : ""]
        .filter(Boolean)
        .join(";")
      const sty = style ? ` style="${style}"` : ""

      if (b.t === "img") {
        const posStyles: Record<string, string> = {
          "float-left": " float:left; margin-right:12px;",
          "float-right": " float:right; margin-left:12px;",
          free: " position:absolute;",
        }
        const ps = posStyles[b.p ?? "inline"] ?? ""
        return `<div contenteditable="false" class="resizable-image" style="${ps}width:fit-content;position:relative;overflow:visible"><img src="${b.s || ""}" alt="${b.a || ""}" style="max-width:100%" /><span class="resize-handle" style="position:absolute;bottom:-4px;right:-4px;width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:2px;cursor:nwse-resize;display:block;z-index:10;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span></div>`
      }

      if (b.t === "hr") return "<hr>"

      if (b.t === "ul" || b.t === "ol") {
        const tag = b.t === "ul" ? "ul" : "ol"
        const items = (b.i || []).map((li) => `<li>${renderInline(li)}</li>`).join("")
        return `<${tag}${sty}>${items}</${tag}>`
      }

      const content = renderInline(b.c || "")
      if (b.t === "p") return `<p${sty}>${content}</p>`
      return `<${b.t}${sty}>${content}</${b.t}>`
    })
    .join("\n")
}
