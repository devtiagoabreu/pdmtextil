import { Zap, X, Clock, Code } from "lucide-react"

interface TestResultModalProps {
  testResult: any
  onClose: () => void
}

export function TestResultModal({ testResult, onClose }: TestResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap size={18} className={testResult.success ? "text-green-500" : "text-red-500"} />
            Resultado do Teste
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {testResult.error && !testResult.status && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">Erro</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{testResult.error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
              <p className={`text-lg font-bold mt-1 ${testResult.status >= 200 && testResult.status < 300 ? "text-green-600" : testResult.status === 0 ? "text-red-500" : "text-amber-600"}`}>
                {testResult.status || "—"}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Tempo</p>
              <p className="text-lg font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                <Clock size={14} />
                {testResult.time}ms
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Resultado</p>
              <p className={`text-lg font-bold mt-1 ${testResult.success ? "text-green-600" : "text-red-500"}`}>
                {testResult.success ? "Sucesso" : "Falha"}
              </p>
            </div>
          </div>

          {testResult.responseBody && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Resposta</p>
              </div>
              <pre className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
                {typeof testResult.responseBody === "string" ? testResult.responseBody : JSON.stringify(testResult.responseBody, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
