"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { ProdutoCru, Solicitacao, StatusOption } from "./types"

interface Props {
  produto: ProdutoCru
  handleChange: (field: keyof ProdutoCru, value: string | boolean | number | null) => void
  handleStatusChange: (newStatus: string) => void
  solicitacoes: Solicitacao[]
  statusOptionsProd: StatusOption[]
  saving: boolean
  isEditing: boolean
}

export function CapaTab({
  produto,
  handleChange,
  handleStatusChange,
  solicitacoes,
  statusOptionsProd,
  saving,
  isEditing,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoPdm">Código PDM *</Label>
            <Input
              id="codigoPdm"
              value={produto.codigoPdm}
              onChange={e => handleChange("codigoPdm", e.target.value)}
              placeholder="D28"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={produto.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            >
              {statusOptionsProd.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            value={produto.descricao}
            onChange={e => handleChange("descricao", e.target.value)}
            placeholder="Tecido Sarja Algodão 30/1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solicitacao">Solicitação de Desenvolvimento</Label>
          <select
            id="solicitacao"
            value={produto.solicitacaoDesenvolvimentoId || ""}
            onChange={e => handleChange("solicitacaoDesenvolvimentoId", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <option value="">Nenhuma</option>
            {solicitacoes.map((s) => (
              <option key={s.id} value={s.id}>#{s.id} - {s.cliente}{s.projeto ? ` (${s.projeto})` : ""}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idIntegracaoErpCru">ID Integração ERP (Cru)</Label>
            <Input id="idIntegracaoErpCru" value={produto.idIntegracaoErpCru || ""} onChange={e => handleChange("idIntegracaoErpCru", e.target.value)} placeholder="2.K1820.CRU.000CRU" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idIntegracao">ID Integração (Sistema Externo)</Label>
            <Input id="idIntegracao" value={produto.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={produto.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEditing ? "Atualizar" : "Criar"}
        </Button>
        <Link href="/cadastros/produto-cru">
          <Button variant="outline" type="button">Cancelar</Button>
        </Link>
      </div>
    </div>
  )
}
