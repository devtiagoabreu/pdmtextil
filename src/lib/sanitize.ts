import DOMPurify from "dompurify"

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    return html
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
      "span", "div", "img", "table", "thead", "tbody", "tr", "th", "td",
      "hr", "sub", "sup", "del", "ins", "mark", "small",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "width", "height",
      "class", "style", "title", "id",
    ],
  })
}
