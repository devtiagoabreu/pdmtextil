import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold text-slate-200 dark:text-slate-700">404</h1>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Página não encontrada
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
