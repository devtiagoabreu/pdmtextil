export function Historico({ historico }: { historico: any[] }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Histórico
      </h2>
      {historico && historico.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {historico.map((h: any) => (
            <div key={h.id} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              <p className="text-sm font-medium">{h.acao}</p>
              {h.mensagens && h.mensagens.length > 0 && (
                <ul className="text-xs text-slate-600 mt-1">
                  {h.mensagens.map((m: string) => (
                    <li key={m}>⬢ {m}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {h.usuario} - {h.data ? new Date(h.data).toLocaleString("pt-BR") : ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sem histórico</p>
      )}
    </div>
  )
}
