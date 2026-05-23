"use client"

import { useState } from "react"
import { X, Info } from "lucide-react"
import type { InfoContent } from "@/lib/info-content"

interface InfoButtonProps {
  content: InfoContent
}

export function InfoButton({ content }: InfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-400 text-blue-500 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors ml-2"
        title="Informações da tela"
      >
        <Info size={12} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{content.title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{content.description}</p>
              </div>

              {content.rules && content.rules.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Regras de Negócio</h3>
                  <ul className="space-y-2">
                    {content.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {content.fields && content.fields.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Campos</h3>
                  <div className="space-y-2">
                    {content.fields.map((field, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0 min-w-[100px]">{field.name}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{field.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
