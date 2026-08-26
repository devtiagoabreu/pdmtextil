import { Calendar, ExternalLink, MapPin } from "lucide-react"
import Link from "next/link"
import { TIPO_LABELS } from "./constants"

interface VisualizacaoCardProps {
  visita: any
  statusLabel: string
  statusColor: string
}

export function VisualizacaoCard({ visita, statusLabel, statusColor }: VisualizacaoCardProps) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Informações</h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Status</span>
            <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: statusColor + "20", color: statusColor }}>
              {statusLabel}
            </span>
          </div>
          {visita.status === "CANCELADA" && visita.motivoCancelamento && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Motivo do Cancelamento</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.motivoCancelamento}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Tipo</span>
            <p className="text-slate-900 dark:text-slate-200">{TIPO_LABELS[visita.tipo] || visita.tipo}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-0.5">Data da Visita</span>
            <p className="text-slate-900 dark:text-slate-200">{visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{visita.hora ? ` às ${visita.hora}` : ""}</p>
          </div>
          {visita.duracaoEstimada && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Duracao Estimada</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.duracaoEstimada >= 60 ? `${Math.floor(visita.duracaoEstimada / 60)}h${visita.duracaoEstimada % 60 ? ` ${visita.duracaoEstimada % 60}min` : ""}` : `${visita.duracaoEstimada} min`}</p>
            </div>
          )}
          {!visita.empresaId && !visita.clienteId ? (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Visita Avulsa</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.nomeAvulso || "—"}</p>
            </div>
          ) : (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">{visita.empresaId ? "Pessoa (Negócio)" : "Cliente"}</span>
              {visita.empresaId ? (
                <Link href={`/comercial/crm/pessoas/${visita.empresaId}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  {visita.empresaNome} <ExternalLink size={12} />
                </Link>
              ) : (
                <p className="text-slate-900 dark:text-slate-200">{visita.clienteNome || "—"}</p>
              )}
            </div>
          )}
          {visita.oportunidadeTitulo && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Oportunidade</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.oportunidadeTitulo}</p>
            </div>
          )}
          {visita.contatoNome && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Contato</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.contatoNome}</p>
            </div>
          )}
          {visita.viagemTitulo && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Viagem</span>
              <Link href={`/comercial/crm/viagens/${visita.viagemId}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                {visita.viagemTitulo} <ExternalLink size={12} />
              </Link>
            </div>
          )}
          {visita.representanteNome && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Representante</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.representanteNome}</p>
            </div>
          )}
          {visita.criadoPorNome && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Criado por</span>
              <p className="text-slate-900 dark:text-slate-200">{visita.criadoPorNome}</p>
            </div>
          )}
          {visita.googleEventId && (
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Google Calendar</span>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-medium inline-flex items-center gap-1">
                <Calendar size={12} /> Sincronizado
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Endereço</h2>
        </div>
        {visita.endereco || visita.numero || visita.bairro || visita.cidade ? (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">Logradouro</span>
              <p className="text-sm text-slate-900 dark:text-slate-200">{visita.endereco || "—"}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Número</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.numero || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Complemento</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.complemento || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">Bairro</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.bairro || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">CEP</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.cep || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">UF</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.uf || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-500 block mb-0.5">Cidade</span>
                <p className="text-sm text-slate-900 dark:text-slate-200">{visita.cidade || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nenhum endereço informado</p>
        )}
      </div>
    </>
  )
}
