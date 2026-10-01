"use client"

import { useCallback, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ModalCtes } from "./modal-ctes"
import {
  FRETE_PCT_MAXIMO,
  FRETE_PCT_MINIMO,
  classificarFaixaFrete,
  contarFaixas,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  resumirFretePorRegiao,
  resumirFretePorTransportadora,
} from "./utils"
import type { ContagemFaixas, FaixaFrete, GrupoCte, Resumo, ResumoFrete } from "./types"

interface CardProps {
  rotulo: string
  valor: React.ReactNode
  sufixo?: React.ReactNode
  /** Quando presente, o card vira drill-down para a lista de CT-es do recorte. */
  onDetalhe?: (titulo: string) => void
}

function Card({ rotulo, valor, sufixo, onDetalhe }: CardProps) {
  const conteudo = (
    <>
      <p className="text-xs text-slate-500 dark:text-slate-400">{rotulo}</p>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {valor}
        {sufixo ? (
          <span className="text-sm font-normal text-slate-400"> {sufixo}</span>
        ) : null}
      </p>
    </>
  )
  if (!onDetalhe) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {conteudo}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onDetalhe(rotulo)}
      aria-label={`Ver os CT-es de ${rotulo}`}
      title={`Ver os CT-es de "${rotulo}"`}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
    >
      {conteudo}
    </button>
  )
}

/** Cores por faixa. A cor nunca é o único sinal: todo selo traz o rótulo. */
const ESTILO_FAIXA: Record<FaixaFrete, { chip: string; barra: string; texto: string }> = {
  abaixo: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    barra: "bg-emerald-500",
    texto: "text-emerald-700 dark:text-emerald-400",
  },
  na_faixa: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    barra: "bg-amber-500",
    texto: "text-amber-700 dark:text-amber-400",
  },
  acima: {
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    barra: "bg-rose-500",
    texto: "text-rose-700 dark:text-rose-400",
  },
  indefinido: {
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    barra: "bg-slate-400",
    texto: "text-slate-600 dark:text-slate-400",
  },
}

const ROTULO_FAIXA: Record<FaixaFrete, string> = {
  abaixo: "até 1,5%",
  na_faixa: "na faixa (1,5% a 2,0%)",
  acima: "acima de 2,0%",
  indefinido: "sem dado",
}

/**
 * Selo de faixa de frete, usado no card-resumo e no cabeçalho de cada CT-e.
 */
export function BadgeFaixaFrete({
  faixa,
  pct,
  compacto = false,
}: {
  faixa: FaixaFrete
  pct: number | null
  compacto?: boolean
}) {
  const estilo = ESTILO_FAIXA[faixa]
  const texto = pct == null ? "—" : formatarPercentual(pct)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${estilo.chip}`}
      aria-label={`Frete sobre a mercadoria: ${texto} — ${ROTULO_FAIXA[faixa]}`}
    >
      {!compacto ? <span>{ROTULO_FAIXA[faixa]}</span> : null}
      <span className="font-semibold">{texto}</span>
    </span>
  )
}

function CardFaixa({
  faixa,
  contagem,
  destaque,
  onDetalhe,
}: {
  faixa: FaixaFrete
  contagem: number
  destaque?: boolean
  onDetalhe?: (titulo: string) => void
}) {
  const estilo = ESTILO_FAIXA[faixa]
  const base = `rounded-xl border p-4 ${
    destaque
      ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
  }`
  const conteudo = (
    <>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${estilo.barra}`} aria-hidden="true" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{ROTULO_FAIXA[faixa]}</p>
      </div>
      <p className={`text-lg font-semibold ${estilo.texto}`}>{formatarNumero(contagem)}</p>
    </>
  )
  if (!onDetalhe) return <div className={base}>{conteudo}</div>
  return (
    <button
      type="button"
      onClick={() => onDetalhe(ROTULO_FAIXA[faixa])}
      aria-label={`Ver os CT-es com frete ${ROTULO_FAIXA[faixa]}`}
      title={`Ver os CT-es com frete ${ROTULO_FAIXA[faixa]}`}
      className={`${base} text-left transition-colors hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:border-blue-600`}
    >
      {conteudo}
    </button>
  )
}

/**
 * Barra empilhada com a proporção de CT-es em cada faixa. Usa `title` para
 * detalhar os números exatos, já que a largura sozinha não é legível.
 */
function BarraDistribuicao({ contagem }: { contagem: ContagemFaixas }) {
  const total = contagem.avaliados
  if (!total) {
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="w-full bg-slate-300 dark:bg-slate-700" />
      </div>
    )
  }
  const partes: Array<[FaixaFrete, number]> = [
    ["abaixo", contagem.abaixo],
    ["na_faixa", contagem.naFaixa],
    ["acima", contagem.acima],
  ]
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      title={`${contagem.abaixo} até 1,5% · ${contagem.naFaixa} na faixa (1,5% a 2,0%) · ${contagem.acima} acima de 2,0%`}
    >
      {partes.map(([faixa, qtd]) =>
        qtd > 0 ? (
          <div
            key={faixa}
            className={ESTILO_FAIXA[faixa].barra}
            style={{ width: `${(qtd / total) * 100}%` }}
          />
        ) : null
      )}
    </div>
  )
}

function TabelaBreakdown({
  linhas,
  coluna,
  onDetalhe,
}: {
  linhas: ResumoFrete[]
  coluna: string
  onDetalhe: (chave: string, titulo: string) => void
}) {
  if (!linhas.length) {
    return (
      <p className="px-1 py-4 text-sm text-slate-500 dark:text-slate-400">
        Sem CT-es para agrupar por {coluna.toLowerCase()}.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th
              scope="col"
              className="py-2 pr-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {coluna}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              CT-es
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Frete médio
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Na faixa
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
              Distribuição
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const pctNaFaixa = l.avaliados ? (l.naFaixa / l.avaliados) * 100 : null
            return (
              <tr
                key={l.chave}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
              >
                <td className="max-w-[240px] py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">
                  <button
                    type="button"
                    onClick={() => onDetalhe(l.chave, `${coluna}: ${l.chave}`)}
                    aria-label={`Ver os ${l.ctes} CT-e de ${l.chave}`}
                    title={`Ver os ${l.ctes} CT-e de ${l.chave}`}
                    className="flex w-full items-center gap-1 truncate text-left hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-blue-400"
                  >
                    {l.chave}
                    <span className="text-xs text-slate-400">({l.ctes})</span>
                  </button>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {formatarNumero(l.ctes)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {formatarPercentual(l.mediaPct)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {l.naFaixa}
                  <span className="text-xs text-slate-400">
                    {" "}
                    ({formatarPercentual(pctNaFaixa)})
                  </span>
                </td>
                <td className="px-3 py-2">
                  <BarraDistribuicao contagem={l} />
                  <p className="mt-1 text-xs tabular-nums text-slate-400">
                    {l.abaixo} / {l.naFaixa} / {l.acima}
                    {l.indefinido > 0 ? ` · ${l.indefinido} sem dado` : ""}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Dashboard({ grupos, resumo }: { grupos: GrupoCte[]; resumo: Resumo }) {
  const [aba, setAba] = useState("transportadora")
  const [detalhe, setDetalhe] = useState<{ titulo: string; grupos: GrupoCte[] } | null>(null)
  const faixas = useMemo(() => contarFaixas(grupos), [grupos])
  const porTransportadora = useMemo(() => resumirFretePorTransportadora(grupos), [grupos])
  const porRegiao = useMemo(() => resumirFretePorRegiao(grupos), [grupos])

  const avaliadosComFaixa = faixas.avaliados
  const pctNaFaixa = avaliadosComFaixa ? (faixas.naFaixa / avaliadosComFaixa) * 100 : null
  const mercadoriaTotal = useMemo(
    () => grupos.reduce((t, g) => t + (g.somaNf ?? g.somaNfCalculada), 0),
    [grupos]
  )
  // Frete total ÷ mercadoria: o peso do frete no período inteiro, que é o número
  // que o dono da empresa reconhece. Nos breakdowns por transportadora e região a
  // métrica é a média por CT-e (seção 23.3 da doc), porque aí o ratio agregado
  // distorce — mas no total do período ele é a leitura natural.
  const percentualTotal = mercadoriaTotal > 0 ? (resumo.totalFrete / mercadoriaTotal) * 100 : null

  /** Cards de agregado: o recorte correspondente é sempre o conjunto todo. */
  const todos = useCallback(() => setDetalhe({ titulo: "Todos os CT-es", grupos }), [grupos])

  const porChave = useCallback(
    (campo: "transportadora" | "regiao", chave: string, titulo: string) =>
      setDetalhe({
        titulo,
        grupos: grupos.filter((g) => g[campo] === chave),
      }),
    [grupos]
  )

  const porFaixa = useCallback(
    (faixa: FaixaFrete) =>
      setDetalhe({
        titulo: `Frete sobre a mercadoria: ${ROTULO_FAIXA[faixa]}`,
        grupos: grupos.filter(
          (g) => classificarFaixaFrete(g.pctSobreNf ?? g.pctCalculado) === faixa
        ),
      }),
    [grupos]
  )

  return (
    <div className="space-y-3">
      {/* Resumo geral */}
      <section aria-label="Resumo do período" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card rotulo="NF-e" valor={formatarNumero(resumo.nfs)} onDetalhe={todos} />
        <Card rotulo="CT-es" valor={formatarNumero(resumo.ctes)} onDetalhe={todos} />
        <Card rotulo="Mercadoria" valor={formatarMoeda(mercadoriaTotal)} onDetalhe={todos} />
        <Card rotulo="Frete total" valor={formatarMoeda(resumo.totalFrete)} onDetalhe={todos} />
        <Card
          rotulo="Percentual total"
          valor={formatarPercentual(percentualTotal)}
          sufixo="frete ÷ mercadoria"
          onDetalhe={todos}
        />
        <Card rotulo="Rateio dos itens" valor={formatarMoeda(resumo.totalRateio)} onDetalhe={todos} />
        <Card
          rotulo="NF-e com valor"
          valor={formatarNumero(resumo.comValorNf)}
          sufixo={`/ ${resumo.linhas}`}
          onDetalhe={() =>
            setDetalhe({
              titulo: "CT-es com NF-e no valor",
              grupos: grupos.filter((g) =>
                g.nfs.some((n) => n.nf_item_valor_total != null)
              ),
            })
          }
        />
        <Card
          rotulo="Rateio divergente"
          valor={formatarNumero(resumo.ctesRateioDivergente)}
          onDetalhe={() =>
            setDetalhe({
              titulo: "CT-es com rateio divergente",
              grupos: grupos.filter((g) => g.rateioDivergente),
            })
          }
        />
      </section>

      {/* Faixa de frete sobre a mercadoria */}
      <section aria-label="Faixa de frete sobre a mercadoria" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CardFaixa faixa="abaixo" contagem={faixas.abaixo} onDetalhe={() => porFaixa("abaixo")} />
        <CardFaixa
          faixa="na_faixa"
          contagem={faixas.naFaixa}
          destaque
          onDetalhe={() => porFaixa("na_faixa")}
        />
        <CardFaixa faixa="acima" contagem={faixas.acima} onDetalhe={() => porFaixa("acima")} />
        <CardFaixa
          faixa="indefinido"
          contagem={faixas.indefinido}
          onDetalhe={() => porFaixa("indefinido")}
        />
      </section>
      <div className="flex items-center gap-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Frete sobre a mercadoria (total do CT-e ÷ soma das NF-e). A regra é ficar entre{" "}
          {formatarPercentual(FRETE_PCT_MINIMO)} e {formatarPercentual(FRETE_PCT_MAXIMO)}:{" "}
          <strong className="font-medium text-slate-600 dark:text-slate-300">
            {formatarNumero(faixas.naFaixa)} de {formatarNumero(avaliadosComFaixa)} CT-es
          </strong>{" "}
          estão na faixa ({formatarPercentual(pctNaFaixa)}).
        </p>
        <InfoButton content={getInfoContent("/ferramentas/nfe-cte")!} />
      </div>

      {/* Breakdowns por transportadora e região */}
      <Tabs value={aba} onValueChange={setAba} className="flex flex-col gap-2">
        <TabsList variant="line" className="border-b">
          <TabsTrigger value="transportadora">Por transportadora</TabsTrigger>
          <TabsTrigger value="regiao">Por região do cliente</TabsTrigger>
        </TabsList>
        <TabsContent value="transportadora" className="m-0 border-0 p-0 shadow-none">
          <TabelaBreakdown
            linhas={porTransportadora}
            coluna="Transportadora"
            onDetalhe={(chave, titulo) => porChave("transportadora", chave, titulo)}
          />
        </TabsContent>
        <TabsContent value="regiao" className="m-0 border-0 p-0 shadow-none">
          <TabelaBreakdown
            linhas={porRegiao}
            coluna="Região"
            onDetalhe={(chave, titulo) => porChave("regiao", chave, titulo)}
          />
        </TabsContent>
      </Tabs>

      {detalhe && (
        <ModalCtes
          titulo={detalhe.titulo}
          grupos={detalhe.grupos}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  )
}