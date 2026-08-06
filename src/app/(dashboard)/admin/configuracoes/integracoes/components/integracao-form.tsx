import { Loader2, Eye, EyeOff, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TIPO_AUTH_LABEL, getPdmCampos, getAuthPlaceholder } from "./constants"
import type { Integracao, TipoAuth } from "./types"

interface IntegracaoFormProps {
  editItem: Integracao | null
  nome: string
  setNome: (v: string) => void
  baseUrl: string
  setBaseUrl: (v: string) => void
  tipoAuth: TipoAuth
  setTipoAuth: (v: TipoAuth) => void
  authConfigJson: string
  setAuthConfigJson: (v: string) => void
  showJson: boolean
  setShowJson: (v: boolean) => void
  telas: string
  setTelas: (v: string) => void
  mappingJson: string
  setMappingJson: (v: string) => void
  apiFields: string[]
  fieldMappings: Record<string, string>
  setFieldMappings: (v: Record<string, string>) => void
  uniqueKeyField: string
  setUniqueKeyField: (v: string) => void
  loadingFields: boolean
  saving: boolean
  onLoadFields: () => void
  onSave: () => void
  onReset: () => void
}

export function IntegracaoForm(props: IntegracaoFormProps) {
  const {
    editItem,
    nome,
    setNome,
    baseUrl,
    setBaseUrl,
    tipoAuth,
    setTipoAuth,
    authConfigJson,
    setAuthConfigJson,
    showJson,
    setShowJson,
    telas,
    setTelas,
    mappingJson,
    setMappingJson,
    apiFields,
    fieldMappings,
    setFieldMappings,
    uniqueKeyField,
    setUniqueKeyField,
    loadingFields,
    saving,
    onLoadFields,
    onSave,
    onReset,
  } = props

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{editItem ? "Editar Integração" : "Nova Integração"}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: ERP Systêxtil" />
        </div>
        <div className="space-y-2">
          <Label>Base URL *</Label>
          <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.sistema.com" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Autenticação</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TIPO_AUTH_LABEL) as TipoAuth[]).map((tipo: any) => (
            <button
              key={tipo}
              type="button"
              onClick={() => { setTipoAuth(tipo); setAuthConfigJson(getAuthPlaceholder(tipo)) }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                tipoAuth === tipo
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              {TIPO_AUTH_LABEL[tipo]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Configuração de Autenticação (JSON)</Label>
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {showJson ? <EyeOff size={12} /> : <Eye size={12} />}
            {showJson ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {showJson && (
          <p className="text-xs text-slate-400">
            Exemplo: {getAuthPlaceholder(tipoAuth)}
          </p>
        )}
        <textarea
          value={authConfigJson}
          onChange={e => setAuthConfigJson(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder='{}'
        />
      </div>

      <div className="space-y-2">
        <Label>Telas (separadas por vírgula)</Label>
        <Input value={telas} onChange={e => setTelas(e.target.value)} placeholder="clientes, fios, bases-urdume" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Mapeamento de Campos</Label>
          <Button size="sm" variant="outline" onClick={onLoadFields} disabled={!editItem || loadingFields} className="gap-1 text-xs">
            {loadingFields ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Carregar campos da API
          </Button>
        </div>

        {apiFields.length > 0 ? (
          <div className="space-y-3">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-slate-500 uppercase w-1/2">Campo da API</th>
                    <th className="p-2 text-left text-xs font-medium text-slate-500 uppercase w-1/2">Campo PDM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiFields.map((f: any) => (
                    <tr key={f}>
                      <td className="p-2 text-xs font-mono text-slate-700 dark:text-slate-300">{f}</td>
                      <td className="p-2">
                        <select
                          value={fieldMappings[f] || ""}
                          onChange={e => {
                            const newMappings = { ...fieldMappings, [f]: e.target.value }
                            setFieldMappings(newMappings)
                            setMappingJson(JSON.stringify({ fields: newMappings, uniqueKey: uniqueKeyField }, null, 2))
                          }}
                          className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {getPdmCampos(telas).map((p: any) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm">Chave única (dedup):</Label>
              <select
                value={uniqueKeyField}
                onChange={e => {
                  setUniqueKeyField(e.target.value)
                  setMappingJson(JSON.stringify({ fields: fieldMappings, uniqueKey: e.target.value }, null, 2))
                }}
                className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {apiFields.map((f: any) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center">
            <p className="text-xs text-slate-400">
              Clique em &quot;Carregar campos da API&quot; para ver os campos do retorno e configurar o mapeamento.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {editItem ? "Salvar" : "Adicionar"}
        </Button>
        <Button variant="outline" onClick={onReset}>Cancelar</Button>
      </div>
    </div>
  )
}
