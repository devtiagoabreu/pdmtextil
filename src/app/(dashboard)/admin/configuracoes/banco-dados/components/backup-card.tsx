import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackupCardProps {
  baixando: boolean
  temAtivo: boolean
  onBackup: () => void
}

export function BackupCard({ baixando, temAtivo, onBackup }: BackupCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 space-y-4">
      <div className="flex items-center gap-2">
        <Download size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold">Backup do Banco de Dados</h2>
      </div>
      <p className="text-sm text-slate-500">
        Gera um dump SQL completo (estrutura + dados) de todas as tabelas e faz o download
        para o computador. Usa a conexão ativa cadastrada, ou a variável DATABASE_URL como
        fallback.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onBackup} disabled={baixando} className="gap-2">
          {baixando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {baixando ? "Gerando..." : "Download Backup"}
        </Button>
        {temAtivo && (
          <p className="text-xs text-slate-400 self-center">
            Usando conexão ativa
          </p>
        )}
      </div>
    </div>
  )
}
