"use client"

import { FileText } from "lucide-react"

const RELATO_TEMPLATES = [
  { label: "Reuniao de apresentacao", texto: "<p><strong>Objetivo:</strong> Apresentacao da empresa e produtos.</p><p><strong>Pontos abordados:</strong></p><ul><li></li></ul><p><strong>Proximos passos:</strong></p><ul><li></li></ul>" },
  { label: "Follow-up comercial", texto: "<p><strong>Assunto:</strong> Acompanhamento de proposta.</p><p><strong>Status:</strong></p><ul><li></li></ul><p><strong>Decisoes:</strong></p><ul><li></li></ul>" },
  { label: "Visita tecnica", texto: "<p><strong>Motivo:</strong> Visita tecnica para levantamento de necessidades.</p><p><strong>Achados:</strong></p><ul><li></li></ul><p><strong>Recomendacoes:</strong></p><ul><li></li></ul>" },
  { label: "Apresentacao de amostra", texto: "<p><strong>Amostras apresentadas:</strong></p><ul><li></li></ul><p><strong>Feedback do cliente:</strong></p><ul><li></li></ul><p><strong>Proximos passos:</strong></p><ul><li></li></ul>" },
  { label: "Pos-venda / Suporte", texto: "<p><strong>Motivo:</strong> Acompanhamento pos-venda.</p><p><strong>Questoes reportadas:</strong></p><ul><li></li></ul><p><strong>Solucao aplicada:</strong></p><ul><li></li></ul>" },
  { label: "Proposta comercial", texto: "<p><strong>Itens apresentados:</strong></p><ul><li></li></ul><p><strong>Condicoes:</strong></p><ul><li></li></ul><p><strong>Validade:</strong></p><p><strong>Observacoes:</strong></p>" },
  { label: "Reuniao de status", texto: "<p><strong>Pedidos em andamento:</strong></p><ul><li></li></ul><p><strong>Pendencias:</strong></p><ul><li></li></ul><p><strong>Compromissos:</strong></p><ul><li></li></ul>" },
]

interface RelatoTemplateSelectorProps {
  onSelect: (html: string) => void
}

export function RelatoTemplateSelector({ onSelect }: RelatoTemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {RELATO_TEMPLATES.map(t => (
        <button
          key={t.label}
          type="button"
          onClick={() => onSelect(t.texto)}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <FileText size={11} />
          {t.label}
        </button>
      ))}
    </div>
  )
}
