"use client"

import { useState, useEffect } from "react"
import { Loader2, FileText } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { toast } from "sonner"

type Amostra = {
  id: number
  produtoCruId?: number | null
  acabamentoId?: number | null
  descricao?: string | null
  status: string
  motivoAprovacao?: string | null
  observacoes?: string | null
  data: string
  createdAt: string
  links?: { url: string; descricao: string }[] | null
  produtoCodigo: string
  produtoDescricao: string
  tipoAmostra: string
  acabamentoDescricao?: string | null
  solicitacaoDesenvolvimentoId?: number | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROVADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REPROVADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function AmostrasPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [aba, setAba] = useState<"tecidoCru" | "acabamento">("tecidoCru")
  const [tecidoCru, setTecidoCru] = useState<Amostra[]>([])
  const [acabamento, setAcabamento] = useState<Amostra[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch("/api/amostras")
      .then(r => r.json())
      .then(data => {
        setTecidoCru(data.tecidoCru || [])
        setAcabamento(data.acabamento || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const lista = aba === "tecidoCru" ? tecidoCru : acabamento

  async function gerarPdf(a: Amostra) {
    setGerando(a.id)
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      const [solRes, prodRes] = await Promise.all([
        a.solicitacaoDesenvolvimentoId
          ? fetch(`/api/solicitacoes/${a.solicitacaoDesenvolvimentoId}`).then(r => r.json()).catch(() => null)
          : null,
        a.produtoCruId
          ? fetch(`/api/cadastros/produto-cru/${a.produtoCruId}`).then(r => r.json()).catch(() => null)
          : null,
      ])

      let empresa: Record<string, any> | null = null
      try {
        const res = await fetch("/api/admin/config/empresa")
        const list = await res.json()
        empresa = list.find((e: any) => e.isDefault) || list[0]
      } catch {}

      const doc = new jsPDF("portrait")
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 18
      let y = margin

      const corPrimaria: [number, number, number] = [37, 99, 235]
      const corSecundaria: [number, number, number] = [245, 247, 250]
      const corBorda: [number, number, number] = [200, 200, 200]
      const corTexto: [number, number, number] = [51, 51, 51]
      const corTextoSec: [number, number, number] = [100, 100, 100]
      const colW = (pageWidth - margin * 2 - 16) / 3
      const cx1 = margin + 8
      const cx2 = cx1 + colW + 4
      const cx3 = cx2 + colW + 4

      // ── Header ──
      if (empresa) {
        doc.setFillColor(...corPrimaria)
        doc.rect(0, 0, pageWidth, 42, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16).setFont("helvetica", "bold")
        doc.text("SOLICITAÇÃO DE AMOSTRA", pageWidth / 2, 16, { align: "center" })
        doc.setFontSize(9).setFont("helvetica", "normal")
        doc.text(empresa.nome || "", pageWidth / 2, 26, { align: "center" })
        if (empresa.documento) {
          doc.setFontSize(8)
          doc.text(`CNPJ: ${empresa.documento}`, pageWidth / 2, 34, { align: "center" })
        }
        y = 52
      } else {
        doc.setFillColor(...corPrimaria)
        doc.rect(0, 0, pageWidth, 32, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14).setFont("helvetica", "bold")
        doc.text("SOLICITAÇÃO DE AMOSTRA", pageWidth / 2, 14, { align: "center" })
        y = 42
      }

      doc.setTextColor(...corTexto)

      // ── Seção 1: Solicitação de Desenvolvimento ──
      if (solRes) {
        doc.setFillColor(...corPrimaria)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9).setFont("helvetica", "bold")
        doc.text("  1. DADOS DA SOLICITAÇÃO DE DESENVOLVIMENTO", margin + 2, y + 3)
        const solLabelY = y + 12
        doc.setTextColor(...corTexto)
        doc.setFillColor(...corSecundaria)
        doc.roundedRect(margin, y + 6, pageWidth - margin * 2, 34, 2, 2, "F")
        doc.setDrawColor(...corBorda)
        doc.roundedRect(margin, y + 6, pageWidth - margin * 2, 34, 2, 2, "S")

        doc.setFontSize(7).setFont("helvetica", "bold")
        doc.text("Cliente", cx1, solLabelY)
        doc.text("Projeto", cx2, solLabelY)
        doc.text("Tipo", cx3, solLabelY)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(solRes.cliente || "—", cx1, solLabelY + 4)
        doc.text(solRes.projeto || "—", cx2, solLabelY + 4)
        const tipoLabel =
          solRes.tipo === "DESENVOLVIMENTO_TECELAGEM"
            ? "Desenvolvimento Tecelagem"
            : solRes.tipo === "DESENVOLVIMENTO_BENEFICIAMENTO"
            ? "Desenvolvimento Beneficiamento"
            : solRes.tipo || "—"
        doc.text(tipoLabel, cx3, solLabelY + 4)

        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.text("Status", cx1, solLabelY + 11)
        doc.text("Prazo Desejado", cx2, solLabelY + 11)
        doc.text("CNPJ", cx3, solLabelY + 11)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(solRes.status || "—", cx1, solLabelY + 15)
        doc.text(
          solRes.prazoDesejado
            ? new Date(solRes.prazoDesejado).toLocaleDateString("pt-BR")
            : "—",
          cx2,
          solLabelY + 15
        )
        doc.text(solRes.cnpj || "—", cx3, solLabelY + 15)

        y += 46
      }

      // ── Seção 2: Produto Cru ──
      if (prodRes) {
        doc.setFillColor(...corPrimaria)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9).setFont("helvetica", "bold")
        doc.text("  2. DADOS DO PRODUTO CRU", margin + 2, y + 3)
        doc.setTextColor(...corTexto)
        const prodBoxY = y + 6
        const prodBoxH = 44
        doc.setFillColor(...corSecundaria)
        doc.roundedRect(margin, prodBoxY, pageWidth - margin * 2, prodBoxH, 2, 2, "F")
        doc.setDrawColor(...corBorda)
        doc.roundedRect(margin, prodBoxY, pageWidth - margin * 2, prodBoxH, 2, 2, "S")

        const py1 = prodBoxY + 7
        const py2 = py1 + 13
        const py3 = py2 + 13

        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.text("Código PDM", cx1, py1)
        doc.text("Descrição", cx2, py1)
        doc.text("Status", cx3, py1)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(prodRes.codigoPdm || "—", cx1, py1 + 4)
        doc.text(prodRes.descricao || "—", cx2, py1 + 4)
        doc.text(prodRes.status || "—", cx3, py1 + 4)

        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.text("Gramatura", cx1, py2)
        doc.text("Largura", cx2, py2)
        doc.text("Ligamento", cx3, py2)
        doc.setFont("helvetica", "normal").setFontSize(8)
        doc.text(prodRes.fichaTecnica?.gramatura || "—", cx1, py2 + 4)
        doc.text(prodRes.fichaTecnica?.largura || "—", cx2, py2 + 4)
        doc.text(prodRes.fichaTecnica?.ligamento || "—", cx3, py2 + 4)

        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.text("Composição", cx1, py3)
        doc.setFont("helvetica", "normal").setFontSize(8)
        const compStr =
          prodRes.composicao && prodRes.composicao.length > 0
            ? prodRes.composicao
                .map((c: any) => `${c.material} ${c.percentual}%`)
                .join(" | ")
            : "—"
        doc.text(compStr, cx1, py3 + 4)

        // Links do produto
        if (prodRes.links && prodRes.links.length > 0) {
          doc.setFont("helvetica", "bold").setFontSize(7)
          doc.text("Links", cx2, py3)
          doc.setFont("helvetica", "normal").setFontSize(7)
          doc.setTextColor(37, 99, 235)
          let ly = py3 + 4
          const lw = (pageWidth - margin * 2 - cx2 + margin) - 8
          for (const link of prodRes.links) {
            const txt = link.descricao || link.url
            const fit = doc.splitTextToSize(txt, lw)
            if (fit.length > 0) {
              doc.textWithLink(fit[0], cx2, ly, { url: link.url })
              ly += 4
              if (ly > prodBoxY + prodBoxH - 4) break
            }
          }
          doc.setTextColor(...corTexto)
        }

        y += prodBoxH + 6
      }

      // ── Seção 3: Amostra ──
      doc.setFillColor(...corPrimaria)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9).setFont("helvetica", "bold")
      doc.text("  3. DADOS DA AMOSTRA", margin + 2, y + 3)
      doc.setTextColor(...corTexto)

      const amostraBoxY = y + 6
      const amostraBoxH = a.links && a.links.length > 0 ? 38 : 30
      doc.setFillColor(...corSecundaria)
      doc.roundedRect(margin, amostraBoxY, pageWidth - margin * 2, amostraBoxH, 2, 2, "F")
      doc.setDrawColor(...corBorda)
      doc.roundedRect(margin, amostraBoxY, pageWidth - margin * 2, amostraBoxH, 2, 2, "S")

      const ay1 = amostraBoxY + 7
      const ay2 = ay1 + 13

      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Tipo", cx1, ay1)
      doc.text("Descrição", cx2, ay1)
      doc.text("Status", cx3, ay1)
      doc.setFont("helvetica", "normal").setFontSize(8)
      doc.text(
        a.tipoAmostra === "TECIDO_CRU" ? "Tecido Cru" : a.tipoAmostra === "ACABAMENTO" ? "Acabamento" : a.tipoAmostra,
        cx1,
        ay1 + 4
      )
      doc.text(a.descricao || "—", cx2, ay1 + 4)
      doc.text(STATUS_LABELS[a.status] || a.status, cx3, ay1 + 4)

      doc.setFont("helvetica", "bold").setFontSize(7)
      doc.text("Data", cx1, ay2)
      doc.text("Observações", cx2, ay2)
      doc.setFont("helvetica", "normal").setFontSize(8)
      doc.text(a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—", cx1, ay2 + 4)
      doc.text(a.observacoes || "—", cx2, ay2 + 4)

      // Links da amostra
      if (a.links && a.links.length > 0) {
        doc.setTextColor(37, 99, 235)
        doc.setFont("helvetica", "bold").setFontSize(7)
        doc.text("Links", cx3, ay2)
        doc.setFont("helvetica", "normal").setFontSize(7)
        let ly2 = ay2 + 4
        for (const link of a.links) {
          const txt = link.descricao || link.url
          doc.textWithLink(txt, cx3, ly2, { url: link.url })
          ly2 += 4
        }
        doc.setTextColor(...corTexto)
      }

      y = amostraBoxY + amostraBoxH + 10

      // ── Footer ──
      if (y > pageHeight - 30) {
        doc.addPage()
        y = margin
      }
      doc.setDrawColor(...corBorda)
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
      doc.setTextColor(...corTextoSec)
      doc.setFontSize(7).setFont("helvetica", "normal")
      doc.text(
        `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        margin,
        pageHeight - 12
      )
      doc.text("Solicitação de Amostra", pageWidth - margin, pageHeight - 12, { align: "right" })

      const nomeArquivo = `solicitacao-amostra-${a.produtoCodigo}-${a.id}.pdf`
      doc.save(nomeArquivo)
      toast.success("PDF gerado com sucesso!")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao gerar PDF")
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Amostras{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe todas as amostras do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setAba("tecidoCru")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            aba === "tecidoCru"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Tecido Cru
          {!loading && (
            <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {tecidoCru.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba("acabamento")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            aba === "acabamento"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Acabamento
          {!loading && (
            <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {acabamento.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhuma amostra encontrada</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Produto</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Descrição</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Status</th>
                {aba === "acabamento" && (
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Acabamento</th>
                )}
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Data</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">Motivo</th>
                <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4 w-32">Ação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={`${a.tipoAmostra}-${a.id}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm font-medium">
                    <span className="text-xs text-slate-400">{a.produtoCodigo}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{a.produtoDescricao}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{a.descricao || "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] || "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  {aba === "acabamento" && (
                    <td className="p-4 text-sm text-slate-500">{a.acabamentoDescricao || "—"}</td>
                  )}
                  <td className="p-4 text-sm text-slate-500">{a.data ? new Date(a.data).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate">{a.motivoAprovacao || "—"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => gerarPdf(a)}
                      disabled={gerando === a.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {gerando === a.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileText size={14} />
                      )}
                      {gerando === a.id ? "Gerando..." : "Solic. Amostra"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
