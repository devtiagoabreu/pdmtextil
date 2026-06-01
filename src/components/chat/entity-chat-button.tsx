"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Props {
  entidadeTipo: string
  entidadeId: number
  titulo: string
  mensagem?: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "icon"
  showIcon?: boolean
  children?: React.ReactNode
}

export function EntityChatButton({
  entidadeTipo,
  entidadeId,
  titulo,
  mensagem,
  variant = "outline",
  size = "sm",
  showIcon = true,
  children,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/chats/entidade?tipo=${encodeURIComponent(entidadeTipo)}&id=${entidadeId}`)
      if (!res.ok) throw new Error()
      const chat = await res.json()
      if (chat?.id) {
        router.push(`/chat?chatId=${chat.id}`)
      } else {
        const criarRes = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo,
            mensagem: mensagem || titulo,
            destinatarios: "todos",
            entidadeTipo,
            entidadeId,
          }),
        })
        if (!criarRes.ok) throw new Error()
        const data = await criarRes.json()
        router.push(`/chat?chatId=${data.chat.id}`)
      }
    } catch {
      toast.error("Erro ao acessar chat")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
    >
      {showIcon && <MessageSquare size={size === "sm" ? 14 : 16} className={children ? "mr-1.5" : ""} />}
      {children || (loading ? "..." : "Chat")}
    </Button>
  )
}
