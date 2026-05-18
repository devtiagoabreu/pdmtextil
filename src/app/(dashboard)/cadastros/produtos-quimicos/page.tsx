"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Upload, Download } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

type ProdutoQuimico = {
  id: number
  codigo: string
  nome: string
  descricao: string | null
  categoria: string | null
  unidadePadrao: string
  tipo: string | null
  ativo: boolean | null
}

export default function ProdutosQuimicosPage() {
  const router = useRouter()
  const [data, setData] = useState<ProdutoQuimico[]>([])
  const [search, setSearch] = useState("")
  const [importing, setImporting] = useState(false)

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
          <label className="cursor-pointer">
            <Button variant="outline" disabled={importing} asChild>
              <span><Upload className="h-4 w-4 mr-1" /> Importar</span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".csv,.json"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
          </label>
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

      <DataTable
        columns={[
          { header: "Código", accessorKey: "codigo" },
          { header: "Nome", accessorKey: "nome" },
          { header: "Categoria", accessorKey: "categoria" },
          { header: "Unidade", accessorKey: "unidadePadrao" },
          { header: "Tipo", accessorKey: "tipo" },
          {
            header: "Ativo",
            accessorKey: "ativo",
            cell: ({ row }) => (
              <Badge variant={row.original.ativo ? "default" : "secondary"}>
                {row.original.ativo ? "Ativo" : "Inativo"}
              </Badge>
            ),
          },
        ]}
        data={data}
        onRowClick={(row) => router.push(`/cadastros/produtos-quimicos/${row.id}`)}
      />
    </div>
  )
}
