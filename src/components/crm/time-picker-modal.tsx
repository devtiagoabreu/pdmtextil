"use client"

import { useState } from "react"
import { Clock } from "lucide-react"

interface TimePickerModalProps {
  value: string
  onChange: (time: string) => void
}

export function TimePickerModal({ value, onChange }: TimePickerModalProps) {
  const [open, setOpen] = useState(false)
  const [tempHour, setTempHour] = useState(value ? value.split(":")[0] : "")
  const [tempMin, setTempMin] = useState(value ? value.split(":")[1] : "")

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

  function handleConfirm() {
    if (tempHour && tempMin) {
      onChange(`${tempHour}:${tempMin}`)
    }
    setOpen(false)
  }

  function handleClear() {
    onChange("")
    setTempHour("")
    setTempMin("")
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
      >
        <Clock size={14} className="text-slate-400 shrink-0" />
        <span className={value ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
          {value || "Selecionar hora..."}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-xs p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">Selecionar Hora</h3>

            <div className="flex items-center justify-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 uppercase mb-1 block text-center">Hora</label>
                <div className="max-h-[200px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  {hours.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTempHour(h)}
                      className={`w-full px-3 py-1.5 text-sm text-center transition-colors ${
                        tempHour === h
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-lg font-bold text-slate-400 mt-4">:</span>
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 uppercase mb-1 block text-center">Min</label>
                <div className="max-h-[200px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTempMin(m)}
                      className={`w-full px-3 py-1.5 text-sm text-center transition-colors ${
                        tempMin === m
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!tempHour || !tempMin}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
