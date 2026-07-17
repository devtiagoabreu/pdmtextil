import { NextRequest } from "next/server"
import { SQL, asc, gt, and } from "drizzle-orm"

export interface PaginationParams {
  cursor?: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: number | null
  hasMore: boolean
}

export function getPaginationParams(req: NextRequest, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit,
    maxLimit
  )
  return {
    cursor: cursor ? parseInt(cursor, 10) : undefined,
    limit,
  }
}

export function cursorCondition(table: { id: any }, cursor: number | undefined): SQL | undefined {
  if (!cursor) return undefined
  return gt(table.id, cursor)
}

export function buildPaginatedResponse<T extends { id: number }>(
  rows: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? data[data.length - 1].id : null
  return { data, nextCursor, hasMore }
}
