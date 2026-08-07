import { vi } from "vitest"

const CHAIN_METHODS = [
  "select",
  "from",
  "where",
  "and",
  "or",
  "orderBy",
  "limit",
  "offset",
  "set",
  "values",
  "returning",
  "groupBy",
  "having",
  "innerJoin",
  "leftJoin",
  "rightJoin",
  "on",
]

export function createQueryBuilder<T>(result: T): any {
  const builder: any = {}
  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve?: (value: T) => unknown) => Promise.resolve(result).then(resolve)
  builder.catch = (reject?: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject)
  return builder
}

export function resetDb(db: any) {
  for (const key of ["select", "insert", "update", "delete", "execute"]) {
    if (typeof db[key]?.mockReset === "function") db[key].mockReset()
  }
}

export function createDbMock() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  }
}
