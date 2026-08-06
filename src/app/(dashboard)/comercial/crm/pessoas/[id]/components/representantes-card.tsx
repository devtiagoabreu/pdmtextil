import { Users, Search, Loader2, UserPlus, Mail, Phone, MapPin, X } from "lucide-react"

interface RepresentantesCardProps {
  vinculos: any[]
  loadingVinculos: boolean
  searchRep: string
  repResults: any[]
  searchingRep: boolean
  onSearch: (q: string) => void
  onAdd: (id: number) => void
  onRemoveClick: (v: any) => void
}

export function RepresentantesCard({
  vinculos,
  loadingVinculos,
  searchRep,
  repResults,
  searchingRep,
  onSearch,
  onAdd,
  onRemoveClick,
}: RepresentantesCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Representantes Vinculados</h2>
        {vinculos.length > 0 && (
          <span className="text-xs text-slate-400">({vinculos.length})</span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar representante por nome ou CNPJ..."
            value={searchRep}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {searchingRep && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Buscando...
        </div>
      )}

      {repResults.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto mb-4">
          {repResults.map((r: any) => (
            <button
              key={r.id}
              onClick={() => onAdd(r.id)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
            >
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{r.nome}</span>
                <span className="text-slate-400 ml-2">{r.cnpj}</span>
                {r.cidade && <span className="text-slate-400 ml-2">{r.cidade}/{r.uf}</span>}
              </div>
              <UserPlus size={14} className="text-blue-500 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {loadingVinculos ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : vinculos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-500">Nenhum representante vinculado</p>
          <p className="text-xs text-slate-400 mt-1">Busque acima para vincular representantes</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Nome</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">CNPJ</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Contato</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Cidade/UF</th>
                <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 p-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vinculos.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 text-sm font-medium text-slate-900 dark:text-slate-200">{v.nome}</td>
                  <td className="p-3 text-sm text-slate-500 font-mono">{v.cnpj || "—"}</td>
                  <td className="p-3 text-sm text-slate-500">
                    <div className="flex flex-col gap-0.5">
                      {v.email && <span className="flex items-center gap-1"><Mail size={12} />{v.email}</span>}
                      {v.telefone && <span className="flex items-center gap-1"><Phone size={12} />{v.telefone}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-500">
                    {v.cidade ? <span className="flex items-center gap-1"><MapPin size={12} />{v.cidade}/{v.uf}</span> : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => onRemoveClick(v)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
