import { renderSegmentos, renderTecnologias, renderListaLabels } from "./utils"
import {
  ABRASAO_LABELS,
  BRILHO_LABELS,
  TOQUE_LABELS,
  CORES_LABELS,
  PRECO_LABELS,
  TIPO_TECIDO_LABELS,
  LIGAMENTO_LABELS,
  TIPO_FIBRA_LABELS,
  TIPOS_ACABAMENTO_LABELS,
} from "./constants"

export function BriefingTecnico({ briefing }: { briefing: any }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4">Briefing Técnico</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">Dados do Produto</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Produto Base:</span> <span className="font-medium">{briefing.produtoBase || "—"}</span></div>
            <div><span className="text-slate-500">Cód. Produto:</span> <span className="font-medium">{briefing.codProduto || "—"}</span></div>
            <div><span className="text-slate-500">Nome da Cor:</span> <span className="font-medium">{briefing.nomeCor || "—"}</span></div>
            <div><span className="text-slate-500">Pantone:</span> <span className="font-medium">{briefing.pantone || "—"}</span></div>
            <div><span className="text-slate-500">Amostra a ser Desenvolvida:</span> <span className="font-medium">{briefing.amostraDesenvolver || "—"}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Observações:</span> <span className="font-medium">{briefing.observacoes || "—"}</span></div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">1. Aplicação / Uso Final</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Segmentos:</span> <span className="font-medium">{renderSegmentos(briefing.aplicacao?.segmentos)}</span></div>
            {briefing.aplicacao?.descricaoAplicacao && <div><span className="text-slate-500">Descrição:</span> <span className="font-medium">{briefing.aplicacao.descricaoAplicacao}</span></div>}
            {briefing.aplicacao?.outrosSegmentos && <div><span className="text-slate-500">Outros Segmentos:</span> <span className="font-medium">{briefing.aplicacao.outrosSegmentos}</span></div>}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">2. Requisitos Técnicos</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Tipo Tecido:</span> <span className="font-medium">{TIPO_TECIDO_LABELS[briefing.requisitosTecnicos?.tipoTecido] || briefing.requisitosTecnicos?.tipoTecido || "—"}</span></div>
            <div><span className="text-slate-500">Ligamento:</span> <span className="font-medium">{LIGAMENTO_LABELS[briefing.requisitosTecnicos?.ligamento] || briefing.requisitosTecnicos?.ligamento || "—"}</span></div>
            <div><span className="text-slate-500">Composição:</span> <span className="font-medium">{briefing.requisitosTecnicos?.composicao || "—"}</span></div>
            <div><span className="text-slate-500">Tipo Fibra:</span> <span className="font-medium">{renderListaLabels(briefing.requisitosTecnicos?.tipoFibra, TIPO_FIBRA_LABELS)}</span></div>
            <div><span className="text-slate-500">Gramatura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.gramaturaMinima || "—"} - {briefing.requisitosTecnicos?.gramaturaMaxima || "—"} g/m²</span></div>
            <div><span className="text-slate-500">Largura:</span> <span className="font-medium">{briefing.requisitosTecnicos?.larguraMinima || "—"} - {briefing.requisitosTecnicos?.larguraMaxima || "—"} cm</span></div>
            <div><span className="text-slate-500">Densidade Urdume:</span> <span className="font-medium">{briefing.requisitosTecnicos?.densidadeUrdume || "—"}</span></div>
            <div><span className="text-slate-500">Densidade Trama:</span> <span className="font-medium">{briefing.requisitosTecnicos?.densidadeTrama || "—"}</span></div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">3. Tecnologias</h3>
          <div className="text-sm space-y-1">
            <div><span className="text-slate-500">Tecnologias:</span> <span className="font-medium">{renderTecnologias(briefing.tecnologias?.requeridas)}</span></div>
            {briefing.tecnologias?.outrasTecnologias && <div><span className="text-slate-500">Outras:</span> <span className="font-medium">{briefing.tecnologias.outrasTecnologias}</span></div>}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">4. Performance</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Resistência Abrasão:</span> <span className="font-medium">{ABRASAO_LABELS[briefing.performance?.resistenciaAbrasao] || briefing.performance?.resistenciaAbrasao || "—"}</span></div>
            {briefing.performance?.resistenciaLavagem !== undefined && <div><span className="text-slate-500">Resist. Lavagem:</span> <span className="font-medium">{briefing.performance.resistenciaLavagem ? "Sim" : "Não"}</span></div>}
            {briefing.performance?.resistenciaSecagem !== undefined && <div><span className="text-slate-500">Resist. Secagem:</span> <span className="font-medium">{briefing.performance.resistenciaSecagem ? "Sim" : "Não"}</span></div>}
            {briefing.performance?.resistenciaPassagem !== undefined && <div><span className="text-slate-500">Resist. Passagem:</span> <span className="font-medium">{briefing.performance.resistenciaPassagem ? "Sim" : "Não"}</span></div>}
            {briefing.performance?.outrasPerformances && <div><span className="text-slate-500">Outras:</span> <span className="font-medium">{briefing.performance.outrasPerformances}</span></div>}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">5. Acabamento</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Tipos:</span> <span className="font-medium">{renderListaLabels(briefing.acabamento?.tipos, TIPOS_ACABAMENTO_LABELS)}</span></div>
            <div><span className="text-slate-500">Brilho:</span> <span className="font-medium">{BRILHO_LABELS[briefing.acabamento?.nivelBrilho] || briefing.acabamento?.nivelBrilho || "—"}</span></div>
            <div><span className="text-slate-500">Toque:</span> <span className="font-medium">{TOQUE_LABELS[briefing.acabamento?.toque] || briefing.acabamento?.toque || "—"}</span></div>
            {briefing.acabamento?.textura && <div><span className="text-slate-500">Textura:</span> <span className="font-medium">{briefing.acabamento.textura}</span></div>}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">6. Cores</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Tipo:</span> <span className="font-medium">{CORES_LABELS[briefing.cores?.tipo] || briefing.cores?.tipo || "—"}</span></div>
            {briefing.cores?.paletaPreferencial && <div><span className="text-slate-500">Paleta:</span> <span className="font-medium">{briefing.cores.paletaPreferencial}</span></div>}
            {briefing.cores?.coresEspecificas && <div><span className="text-slate-500">Cores Específicas:</span> <span className="font-medium">{briefing.cores.coresEspecificas}</span></div>}
            {briefing.cores?.lavabilidadeCores && <div><span className="text-slate-500">Lavabilidade:</span> <span className="font-medium">{briefing.cores.lavabilidadeCores}</span></div>}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate-700 dark:text-slate-300 border-b pb-1 mb-2">7. Comercial</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Target Preço:</span> <span className="font-medium">{PRECO_LABELS[briefing.comercial?.targetPreco] || briefing.comercial?.targetPreco || "—"}</span></div>
            {briefing.comercial?.quantidadeEstimada && <div><span className="text-slate-500">Quantidade:</span> <span className="font-medium">{briefing.comercial.quantidadeEstimada}</span></div>}
            {briefing.comercial?.prazoEntrega && <div><span className="text-slate-500">Prazo Entrega:</span> <span className="font-medium">{briefing.comercial.prazoEntrega}</span></div>}
            {briefing.comercial?.observacoes && <div className="col-span-2"><span className="text-slate-500">Observações:</span> <span className="font-medium">{briefing.comercial.observacoes}</span></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
