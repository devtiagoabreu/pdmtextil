import { AlertTriangle, Building2, Repeat, User, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { QuickCreatePessoa } from "@/components/crm/quick-create-pessoa"
import { QuickCreateCliente } from "@/components/crm/quick-create-cliente"
import { QuickCreateContato } from "@/components/crm/quick-create-contato"
import { QuickCreateOportunidade } from "@/components/crm/quick-create-oportunidade"
import { ViagemSelect } from "@/components/crm/viagem-select"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { TIPO_OPTIONS } from "./constants"

interface FormFieldsProps {
  form: any
  setField: (field: string, value: string) => void
  conflictos: any[]
  tipoEntidade: "CLIENTE" | "PESSOA" | "AVULSA" | ""
  empresas: any[]
  clientesList: any[]
  oportunidades: any[]
  contatos: any[]
  recorrencia: string
  setRecorrencia: (v: string) => void
  recorrenciaFim: string
  setRecorrenciaFim: (v: string) => void
  onEmpresaCreated: (id: number, razaoSocial: string) => void
  onClienteCreated: (id: number, nome: string) => void
  onContatoCreated: (id: number) => void
  onOportunidadeCreated: (id: number) => void
  onTrocar: () => void
}

export function FormFields({
  form,
  setField,
  conflictos,
  tipoEntidade,
  empresas,
  clientesList,
  oportunidades,
  contatos,
  recorrencia,
  setRecorrencia,
  recorrenciaFim,
  setRecorrenciaFim,
  onEmpresaCreated,
  onClienteCreated,
  onContatoCreated,
  onOportunidadeCreated,
  onTrocar,
}: FormFieldsProps) {
  const entidadeIcone =
    tipoEntidade === "CLIENTE" ? (
      <Building2 size={18} className="text-emerald-600" />
    ) : tipoEntidade === "AVULSA" ? (
      <User size={18} className="text-orange-600" />
    ) : (
      <UserCheck size={18} className="text-blue-600" />
    )

  const entidadeLabel =
    tipoEntidade === "CLIENTE"
      ? "Visitando Cliente"
      : tipoEntidade === "AVULSA"
        ? "Visita Avulsa"
        : "Visitando Pessoa (Negócio)"

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {entidadeIcone}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {entidadeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onTrocar}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
        >
          Trocar
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
      {tipoEntidade === "AVULSA" ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nome/Razão Social *
          </label>
          <input
            type="text"
            value={form.nomeAvulso}
            onChange={e => setField("nomeAvulso", e.target.value)}
            placeholder="Ex: José da Silva ou Árbora Têxtil"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
      ) : tipoEntidade === "CLIENTE" ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Cliente *
            <QuickCreateCliente onCreated={onClienteCreated} />
          </label>
          <select
            value={form.clienteId}
            onChange={e => {
              setField("clienteId", e.target.value)
              setField("contatoId", "")
              setField("oportunidadeId", "")
              setField("propostaId", "")
              setField("propostaTitulo", "")
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione...</option>
            {clientesList.map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.nome}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Pessoa (Negócio) *
            <QuickCreatePessoa onCreated={onEmpresaCreated} />
          </label>
          <select
            value={form.empresaId}
            onChange={e => {
              setField("empresaId", e.target.value)
              setField("oportunidadeId", "")
              setField("contatoId", "")
              setField("propostaId", "")
              setField("propostaTitulo", "")
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione...</option>
            {empresas.map((e: any) => (
              <option key={e.id} value={String(e.id)}>{e.razaoSocial || e.nomeFantasia}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Visita</label>
        <input
          type="date"
          value={form.dataVisita}
          onChange={e => setField("dataVisita", e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
        <input
          type="time"
          value={form.hora}
          onChange={e => setField("hora", e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
        <select
          value={form.tipo}
          onChange={e => setField("tipo", e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIPO_OPTIONS.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duracao Estimada</label>
        <select
          value={form.duracaoEstimada}
          onChange={e => setField("duracaoEstimada", e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat size={16} className="text-slate-500" />
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recorrencia</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Frequencia</label>
            <select
              value={recorrencia}
              onChange={e => setRecorrencia(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nenhuma">Nenhuma (visita unica)</option>
              <option value="semanal">Semanal (a cada 7 dias)</option>
              <option value="quinzenal">Quinzenal (a cada 14 dias)</option>
              <option value="mensal">Mensal (a cada 30 dias)</option>
            </select>
          </div>
          {recorrencia !== "nenhuma" && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Repetir ate</label>
              <input
                type="date"
                value={recorrenciaFim}
                onChange={e => setRecorrenciaFim(e.target.value)}
                min={form.dataVisita}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
        </div>
        {recorrencia !== "nenhuma" && recorrenciaFim && form.dataVisita && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {(() => {
              const start = new Date(form.dataVisita + "T12:00:00")
              const end = new Date(recorrenciaFim + "T12:00:00")
              const diffMs = end.getTime() - start.getTime()
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
              const interval = recorrencia === "semanal" ? 7 : recorrencia === "quinzenal" ? 14 : 30
              const count = Math.floor(days / interval) + 1
              return `${count} visita(s) serao criadas`
            })()}
          </p>
        )}
      </div>
      {tipoEntidade !== "AVULSA" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Oportunidade
            {tipoEntidade === "PESSOA" && (
              <QuickCreateOportunidade empresaId={form.empresaId} onCreated={onOportunidadeCreated} />
            )}
          </label>
          <select
            value={form.oportunidadeId}
            onChange={e => {
              setField("oportunidadeId", e.target.value)
              setField("propostaId", "")
              setField("propostaTitulo", "")
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {oportunidades
              .filter((o: any) =>
                tipoEntidade === "PESSOA"
                  ? !form.empresaId || String(o.empresaId) === form.empresaId
                  : !form.clienteId || String(o.clienteId) === form.clienteId
              )
              .map((o: any) => (
                <option key={o.id} value={String(o.id)}>{o.titulo}</option>
              ))}
          </select>
        </div>
      )}
      {tipoEntidade !== "AVULSA" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Contato
            <QuickCreateContato
              empresaId={tipoEntidade === "PESSOA" ? form.empresaId : ""}
              clienteId={tipoEntidade === "CLIENTE" ? form.clienteId : ""}
              clienteNome={tipoEntidade === "CLIENTE" ? clientesList.find((c: any) => String(c.id) === form.clienteId)?.nome || "" : ""}
              onClickGuard={() => {
                if (!form.empresaId && !form.clienteId) {
                  toast.error("Selecione uma pessoa ou cliente primeiro")
                  return false
                }
                return true
              }}
              onCreated={onContatoCreated}
            />
          </label>
          <select
            value={form.contatoId}
            onChange={e => setField("contatoId", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {contatos.map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.nome}{c.cargo ? ` (${c.cargo})` : ""}</option>
            ))}
          </select>
        </div>
      )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Representante</label>
        <CreatableSelect
          valueId={form.representanteId ? parseInt(form.representanteId) : null}
          valueNome={form.representanteNome || null}
          onChange={(id, nome) => {
            setField("representanteId", id ? String(id) : "")
            setField("representanteNome", nome || "")
          }}
          fetchUrl="/api/representantes"
          placeholder="Buscar representante ou digitar nome..."
          className="w-full"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Opcional. Selecione um representante cadastrado ou digite um nome avulso.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proposta Vinculada</label>
        <CreatableSelect
          valueId={form.propostaId ? parseInt(form.propostaId) : null}
          valueNome={form.propostaTitulo || null}
          onChange={(id, nome) => {
            setField("propostaId", id ? String(id) : "")
            setField("propostaTitulo", nome || "")
          }}
          onSelect={(opt) => {
            if (opt.oportunidadeId) setField("oportunidadeId", String(opt.oportunidadeId))
          }}
          fetchUrl={form.oportunidadeId ? `/api/crm/propostas?oportunidadeId=${form.oportunidadeId}` : "/api/crm/propostas"}
          labelField="titulo"
          placeholder="Buscar proposta..."
          className="w-full"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Opcional. Vincule esta visita a uma proposta existente. Ao selecionar, a oportunidade da proposta é preenchida automaticamente.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Viagem</label>
        <ViagemSelect
          value={form.viagemId || ""}
          onChange={v => setField("viagemId", v)}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Opcional. Vincule esta visita a uma viagem planejada.
        </p>
      </div>
    </>
  )
}
