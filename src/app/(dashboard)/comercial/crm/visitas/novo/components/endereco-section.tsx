import { toast } from "sonner"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"

interface EnderecoSectionProps {
  form: any
  setField: (field: string, value: string) => void
  estadoId: number | null
  tipoEntidade: "CLIENTE" | "PESSOA" | "AVULSA" | ""
  onCopiarEndereco: () => void
}

export function EnderecoSection({
  form,
  setField,
  estadoId,
  tipoEntidade,
  onCopiarEndereco,
}: EnderecoSectionProps) {
  const handleCopiarEndereco = () => {
    const entidadeId = tipoEntidade === "PESSOA" ? form.empresaId : form.clienteId
    if (!entidadeId) {
      toast.error(`Selecione um${tipoEntidade === "CLIENTE" ? " cliente" : "a pessoa"} primeiro`)
      return
    }
    onCopiarEndereco()
  }

  return (
    <div>
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Endereço da Visita</h3>
          {tipoEntidade !== "AVULSA" && (
            <button
              type="button"
              onClick={handleCopiarEndereco}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Copiar endereço {tipoEntidade === "CLIENTE" ? "do cliente" : "do negócio"}
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro</label>
            <input
              type="text"
              value={form.endereco}
              onChange={e => setField("endereco", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
            <input
              type="text"
              value={form.numero}
              onChange={e => setField("numero", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
            <input
              type="text"
              value={form.complemento}
              onChange={e => setField("complemento", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
            <input
              type="text"
              value={form.bairro}
              onChange={e => setField("bairro", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
            <SelectUf value={form.uf} onChange={v => setField("uf", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
            <SelectCidade value={form.cidade} onChange={v => setField("cidade", v)} estadoId={estadoId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
            <input
              type="text"
              value={form.cep}
              onChange={e => setField("cep", e.target.value)}
              placeholder="00.000-000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
