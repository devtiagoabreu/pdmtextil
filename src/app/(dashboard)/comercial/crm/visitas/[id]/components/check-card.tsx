import { Loader2, LogIn, LogOut, Navigation, Undo2 } from "lucide-react"

interface CheckCardProps {
  visita: any
  checkLoading: "in" | "out" | null
  onCheck: (tipo: "check_in" | "check_out") => void
  onUndo: (tipo: "undo_check_in" | "undo_check_out") => void
}

export function CheckCard({ visita, checkLoading, onCheck, onUndo }: CheckCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:col-span-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Check-in / Check-out</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <LogIn size={16} className={visita.checkInTime ? "text-emerald-500" : "text-slate-400"} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-in</span>
          </div>
          {visita.checkInTime ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                {new Date(visita.checkInTime).toLocaleString("pt-BR")}
              </p>
              {visita.checkInLat != null && visita.checkInLng != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${visita.checkInLat},${visita.checkInLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Navigation size={12} /> Ver no Maps
                </a>
              )}
              <button
                onClick={() => onUndo("undo_check_in")}
                disabled={!!checkLoading || !!visita.checkOutTime}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1.5 rounded-lg min-h-[36px]"
              >
                <Undo2 size={12} /> Desfazer
              </button>
            </div>
          ) : (
            <button
              onClick={() => onCheck("check_in")}
              disabled={checkLoading === "in" || !!visita.checkOutTime}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkLoading === "in" ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
              {checkLoading === "in" ? "Registrando..." : "Fazer Check-in"}
            </button>
          )}
        </div>

        <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <LogOut size={16} className={visita.checkOutTime ? "text-emerald-500" : "text-slate-400"} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-out</span>
          </div>
          {visita.checkOutTime ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                {new Date(visita.checkOutTime).toLocaleString("pt-BR")}
              </p>
              {visita.checkOutLat != null && visita.checkOutLng != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${visita.checkOutLat},${visita.checkOutLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Navigation size={12} /> Ver no Maps
                </a>
              )}
              <button
                onClick={() => onUndo("undo_check_out")}
                disabled={!!checkLoading}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1.5 rounded-lg min-h-[36px]"
              >
                <Undo2 size={12} /> Desfazer
              </button>
            </div>
          ) : (
            <button
              onClick={() => onCheck("check_out")}
              disabled={checkLoading === "out" || !visita.checkInTime}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkLoading === "out" ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {checkLoading === "out" ? "Registrando..." : "Fazer Check-out"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
