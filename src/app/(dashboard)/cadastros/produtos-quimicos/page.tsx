"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Upload } from "lucide-react"

type ProdutoQuimico = {
  id: number
  codigo: string
  nome: string
  descricao: string | null
  categoria: string | null
  unidadePadrao: string
  tipo: string | null
  idIntegracao: string | null
  ativo: boolean | null
}

export default function ProdutosQuimicosPage() {
  const router = useRouter()
  const [data, setData] = useState<ProdutoQuimico[]>([])
  const [search, setSearch] = useState("")
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [search])

  async function fetchData() {
    const url = search ? `/api/cadastros/produtos-quimicos?search=${encodeURIComponent(search)}` : "/api/cadastros/produtos-quimicos"
    const res = await fetch(url)
    if (res.ok) setData(await res.json())
  }

  async function handleImport(file: File) {
    setImporting(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/cadastros/produtos-quimicos/import", { method: "POST", body: form })
    const result = await res.json()
    alert(`Importados: ${result.imported}${result.errors?.length ? "\nErros: " + result.errors.join("\n") : ""}`)
    fetchData()
    setImporting(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos Químicos</h1>
        <div className="flex gap-2">
          <Button variant="outline" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.json"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
          <Button onClick={() => router.push("/cadastros/produtos-quimicos/novo")}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por código ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="text-left p-3 font-medium">Código</th>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Categoria</th>
              <th className="text-left p-3 font-medium">Unidade</th>
              <th className="text-left p-3 font-medium">ID Integração</th>
              <th className="text-left p-3 font-medium">Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => router.push(`/cadastros/produtos-quimicos/${item.id}`)}
              >
                <td className="p-3 font-mono text-xs">{item.codigo}</td>
                <td className="p-3">{item.nome}</td>
                <td className="p-3 text-slate-500">{item.categoria || "—"}</td>
                <td className="p-3">{item.unidadePadrao}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{item.idIntegracao || "—"}</td>
                <td className="p-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Nenhum produto químico encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
