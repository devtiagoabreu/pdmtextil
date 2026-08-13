/**
 * Extrai um ou mais emails de uma string que pode conter vários emails
 * separados por vírgula ou ponto e vírgula (ex.: "a@x.com;b@y.com").
 * Normaliza para minúsculas e remove espaços. Ignora valores sem "@".
 */
export function extrairEmails(valor: unknown): string[] {
  return String(valor ?? "")
    .split(/[;,]/)
    .map((e) => e.trim().toLowerCase().replace(/\s+/g, ""))
    .filter((e) => e.includes("@"))
}
