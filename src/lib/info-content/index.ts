import type { InfoContent } from "./types"
export type { InfoContent } from "./types"

import { dashboardContent } from "./dashboard"
import { comercialContent } from "./comercial"
import { cadastrosContent } from "./cadastros"
import { adminContent } from "./admin"
import { ferramentasContent } from "./ferramentas"
import { documentosContent } from "./documentos"
import { outrosContent } from "./outros"
import { crmContent } from "./crm"

const infoContent: Record<string, InfoContent> = {
  ...dashboardContent,
  ...comercialContent,
  ...cadastrosContent,
  ...adminContent,
  ...ferramentasContent,
  ...documentosContent,
  ...outrosContent,
  ...crmContent,
}

export function getInfoContent(pathname: string): InfoContent | null {
  const exact = infoContent[pathname]
  if (exact) return exact

  let bestKey = ""
  for (const key of Object.keys(infoContent)) {
    if ((pathname.startsWith(key) || key.startsWith(pathname)) && key.length > bestKey.length) {
      bestKey = key
    }
  }
  if (bestKey) return infoContent[bestKey]

  return null
}
