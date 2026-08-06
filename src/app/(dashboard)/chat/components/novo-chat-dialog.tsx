import { useState, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function NovoChatDialog({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [destinatarios, setDestinatarios] = useState<string>("")
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([])
  const [destOpen, setDestOpen] = useState(false)
  const destRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/usuarios/ativos")
      .then((r: any) => r.json())
      .then((data: any) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!destOpen) return
    const handle = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setDestOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [destOpen])

  const criarChat = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          mensagem,
          destinatarios: destinatarios === "todos" ? "todos" : [parseInt(destinatarios)],
        }),
      })
      if (!res.ok) throw new Error("Erro ao criar chat")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success("Chat criado!")
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao criar chat"),
  })

  const destLabel = !destinatarios
    ? "Selecione..."
    : destinatarios === "todos"
      ? "Todos os usuários"
      : usuarios.find((u: any) => u.id.toString() === destinatarios)?.name || "Selecione..."

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Novo Chat</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full mt-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm"
              placeholder="Assunto da conversa"
            />
          </div>

          <div ref={destRef} className="relative">
            <label className="text-xs font-medium text-slate-500">Destinatários</label>
            <button
              type="button"
              onClick={() => setDestOpen(!destOpen)}
              className="w-full mt-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm text-left flex items-center justify-between text-slate-900 dark:text-slate-200"
            >
              <span className={destinatarios ? "" : "text-slate-400"}>{destLabel}</span>
              <svg className={`w-4 h-4 transition-transform ${destOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {destOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setDestinatarios("todos"); setDestOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${destinatarios === "todos" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-200"}`}
                >Todos os usuários</button>
                {usuarios
                  .filter((u: any) => u.id !== parseInt(session?.user?.id || "0"))
                  .map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setDestinatarios(u.id.toString()); setDestOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${destinatarios === u.id.toString() ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-200"}`}
                    >{u.name}</button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm min-h-[80px] resize-none"
              placeholder="Digite sua mensagem..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            onClick={() => criarChat.mutate()}
            disabled={!titulo.trim() || !mensagem.trim() || !destinatarios || criarChat.isPending}
          >
            {criarChat.isPending ? "Criando..." : "Criar Chat"}
          </Button>
        </div>
      </div>
    </div>
  )
}
