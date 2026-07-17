"use client"

import { useEffect } from "react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Root Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Algo deu errado
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
