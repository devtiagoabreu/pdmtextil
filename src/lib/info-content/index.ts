import type { InfoContent } from "./types"
export type { InfoContent } from "./types"

import { dashboardContent } from "./dashboard"
import { comercialContent } from "./comercial"
import { cadastrosContent } from "./cadastros"
import { adminContent } from "./admin"
import { ferramentasContent } from "./ferramentas"
import { outrosContent } from "./outros"

const infoContent: Record<string, InfoContent> = {
  ...dashboardContent,
  ...comercialContent,
  ...cadastrosContent,
  ...adminContent,
  ...ferramentasContent,
  ...outrosContent,
}

export function getInfoContent(pathname: string): InfoContent | null {
  const exact = infoContent[pathname]
  if (exact) return exact

  const match = Object.keys(infoContent).find(
    (key) => pathname.startsWith(key) || key.startsWith(pathname)
  )
  if (match) return infoContent[match]

  return null
}
