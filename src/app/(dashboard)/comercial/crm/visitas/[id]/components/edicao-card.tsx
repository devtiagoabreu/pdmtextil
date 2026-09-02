import { AlertTriangle } from "lucide-react"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"
import { ViagemSelect } from "@/components/crm/viagem-select"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { STATUS_OPTIONS, TIPO_OPTIONS } from "./constants"

interface EdicaoCardProps {
  form: any
  visita: any
  setField: (field: string, value: any) => void
  conflictos: any[]
  estadoId: number | null
  getStatusLabel: (status: string) => string
  onCopiarEndereco: () => void
  oportunidades?: any[]
}

export function EdicaoCard({
  form,
  visita,
  setField,
  conflictos,
  estadoId,
  getStatusLabel,
  onCopiarEndereco,
  oportunidades = [],
}: EdicaoCardProps) {
  const listaOportunidades = oportunidades ?? []
  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Informações</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={form.status || visita.status}
              onChange={e => setField("status", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s: any) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Viagem</label>
            <ViagemSelect
              value={form.viagemId ? String(form.viagemId) : ""}
              onChange={v => setField("viagemId", v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Representante</label>
            <CreatableSelect
              valueId={form.representanteId || null}
              valueNome={form.representanteNome || null}
              onChange={(id, nome) => {
                setField("representanteId", id)
                setField("representanteNome", nome)
              }}
              fetchUrl="/api/representantes"
              placeholder="Buscar representante ou digitar nome..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Oportunidade</label>
            <select
              value={form.oportunidadeId ? String(form.oportunidadeId) : ""}
              onChange={e => {
                setField("oportunidadeId", e.target.value ? parseInt(e.target.value) : null)
                setField("propostaId", null)
                setField("propostaTitulo", null)
              }}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Sem oportunidade</option>
              {listaOportunidades
                .filter((o: any) =>
                  form.empresaId
                    ? String(o.empresaId) === String(form.empresaId)
                    : String(o.clienteId) === String(form.clienteId)
                )
                .map((o: any) => (
                  <option key={o.id} value={String(o.id)}>{o.titulo}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Proposta Vinculada</label>
            <CreatableSelect
              valueId={form.propostaId ? parseInt(form.propostaId) : null}
              valueNome={form.propostaTitulo || null}
              onChange={(id, nome) => {
                setField("propostaId", id || null)
                setField("propostaTitulo", nome || null)
              }}
              onSelect={(opt) => {
                if (opt.oportunidadeId) setField("oportunidadeId", String(opt.oportunidadeId))
              }}
              fetchUrl={form.oportunidadeId ? `/api/crm/propostas?oportunidadeId=${form.oportunidadeId}` : "/api/crm/propostas"}
              labelField="titulo"
              placeholder="Buscar proposta..."
              className="w-full"
            />
          </div>
          {form.status === "CANCELADA" && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Motivo do Cancelamento</label>
              <textarea
                value={form.motivoCancelamento || ""}
                onChange={e => setField("motivoCancelamento", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={e => setField("tipo", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {TIPO_OPTIONS.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data da Visita</label>
            <input
              type="date"
              value={form.dataVisita ? form.dataVisita.split("T")[0] : ""}
              onChange={e => setField("dataVisita", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
            <input
              type="time"
              value={form.hora || ""}
              onChange={e => setField("hora", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
            {conflictos.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-medium">{conflictos.length} visita(s) ja agendada(s) neste horario:</p>
                  <ul className="mt-1 space-y-0.5">
                    {conflictos.map((c: any) => (
                      <li key={c.id}>⬢ {c.empresaNome || c.clienteNome || "Visita"} ({c.tipo})</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Duracao Estimada</label>
            <select
              value={form.duracaoEstimada || ""}
              onChange={e => setField("duracaoEstimada", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Nao definida</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h30</option>
              <option value="120">2 horas</option>
              <option value="180">3 horas</option>
              <option value="240">4 horas</option>
              <option value="480">Dia inteiro</option>
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Endereço</h2>
          <button
            type="button"
            onClick={onCopiarEndereco}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Copiar endereço do negócio
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Logradouro</label>
            <input type="text" value={form.endereco || ""} onChange={e => setField("endereco", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Número</label>
              <input type="text" value={form.numero || ""} onChange={e => setField("numero", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Complemento</label>
              <input type="text" value={form.complemento || ""} onChange={e => setField("complemento", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Bairro</label>
              <input type="text" value={form.bairro || ""} onChange={e => setField("bairro", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CEP</label>
              <input type="text" value={form.cep || ""} onChange={e => setField("cep", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">UF</label>
              <SelectUf value={form.uf || ""} onChange={v => setField("uf", v)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Cidade</label>
              <SelectCidade value={form.cidade || ""} onChange={v => setField("cidade", v)} estadoId={estadoId} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
