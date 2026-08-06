"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { ReceitaDialog } from "@/components/receita/acabamento-receita-dialog"
import type { Amostra, DeleteTarget, MotivoModalState } from "./types"

interface Props {
  motivoModal: MotivoModalState
  onFecharMotivo: () => void
  motivoText: string
  setMotivoText: (v: string) => void
  onConfirmarMotivo: () => Promise<void>
  editAmostra: Amostra | null
  editAmostraDescricao: string
  setEditAmostraDescricao: (v: string) => void
  editAmostraObs: string
  setEditAmostraObs: (v: string) => void
  editAmostraQtd: string
  setEditAmostraQtd: (v: string) => void
  editAmostraErp: string
  setEditAmostraErp: (v: string) => void
  editAmostraTear: string
  setEditAmostraTear: (v: string) => void
  onFecharEdicao: () => void
  onSalvarEdicao: () => void
  receitaDialog: { amostraId: number; acabamentoId: number } | null
  onFecharReceita: () => void
  produtoCruId: number | null
  deleteTarget: DeleteTarget | null
  onCancelarExclusao: () => void
  onConfirmarExclusao: () => void
}

export function ProdutoCruModais({
  motivoModal,
  onFecharMotivo,
  motivoText,
  setMotivoText,
  onConfirmarMotivo,
  editAmostra,
  editAmostraDescricao,
  setEditAmostraDescricao,
  editAmostraObs,
  setEditAmostraObs,
  editAmostraQtd,
  setEditAmostraQtd,
  editAmostraErp,
  setEditAmostraErp,
  editAmostraTear,
  setEditAmostraTear,
  onFecharEdicao,
  onSalvarEdicao,
  receitaDialog,
  onFecharReceita,
  produtoCruId,
  deleteTarget,
  onCancelarExclusao,
  onConfirmarExclusao,
}: Props) {
  return (
    <>
      {motivoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {motivoModal.novoStatus.startsWith("APROVADA") ? "Aprovar" : "Reprovar"} Amostra
            </h3>
            <p className="text-sm text-slate-500">
              {motivoModal.novoStatus.startsWith("APROVADA")
                ? "Informe o motivo da aprovação"
                : "Informe o motivo da reprovação"}
            </p>
            <textarea
              value={motivoText}
              onChange={e => setMotivoText(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 min-h-[100px] resize-y"
              placeholder="Motivo / Observação *"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onFecharMotivo}>
                Cancelar
              </Button>
              <Button
                disabled={!motivoText.trim()}
                onClick={async () => {
                  await onConfirmarMotivo()
                }}
                className={motivoModal.novoStatus.startsWith("APROVADA") ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {motivoModal.novoStatus.startsWith("APROVADA") ? "Aprovar" : "Reprovar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editAmostra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Editar Amostra</h3>
            <div className="space-y-3">
              <div>
                <Label>Descrição</Label>
                <Input value={editAmostraDescricao} onChange={e => setEditAmostraDescricao(e.target.value)} placeholder="AMOSTRA - PILOTAGEM 001" />
              </div>
              <div>
                <Label>Observações</Label>
                <Input value={editAmostraObs} onChange={e => setEditAmostraObs(e.target.value)} placeholder="Observações" />
              </div>
              <div>
                <Label>Qtd Produzida</Label>
                <Input value={editAmostraQtd} onChange={e => setEditAmostraQtd(e.target.value)} placeholder="10 M" />
              </div>
              <div>
                <Label>ERP (Cru)</Label>
                <Input value={editAmostraErp} onChange={e => setEditAmostraErp(e.target.value)} placeholder="ERP.00001" />
              </div>
              <div>
                <Label>Tear</Label>
                <Input value={editAmostraTear} onChange={e => setEditAmostraTear(e.target.value)} placeholder="Tear 01" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onFecharEdicao}>Cancelar</Button>
              <Button onClick={onSalvarEdicao}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {receitaDialog && produtoCruId && (
        <ReceitaDialog
          produtoCruId={produtoCruId}
          acabamentoId={receitaDialog.acabamentoId}
          amostraId={receitaDialog.amostraId}
          open={!!receitaDialog}
          onClose={onFecharReceita}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Confirmar exclusão"
        message={`Deseja remover ${deleteTarget?.label}?`}
        variant="danger"
        confirmLabel="Remover"
        onConfirm={onConfirmarExclusao}
        onCancel={onCancelarExclusao}
      />
    </>
  )
}
