"use client"

import { useForm, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { briefingTecelagemSchema, BriefingTecelagem } from "@/types/briefing"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SecaoDadosProduto, SecaoAplicacao, SecaoRequisitosTecnicos, SecaoTecnologias, SecaoPerformance, SecaoAcabamento, SecaoCores, SecaoComercial } from "@/components/forms/briefing/sections"

interface BriefingTecelagemFormProps {
  initialData?: Partial<BriefingTecelagem>
  onNext: (data: BriefingTecelagem) => void
  onBack: () => void
}

export function BriefingTecelagemForm({ initialData, onNext, onBack }: BriefingTecelagemFormProps) {
  const { control, handleSubmit, formState: { errors }, getValues, setValue } = useForm<BriefingTecelagem>({
    resolver: zodResolver(briefingTecelagemSchema),
    defaultValues: initialData || {
      produtoBase: "",
      codProduto: "",
      nomeCor: "",
      pantone: "",
      amostraDesenvolver: "",
      observacoes: "",
      aplicacao: { segmentos: [] },
      tecnologias: { requeridas: [] },
      performance: {},
      acabamento: { tipos: [] },
      cores: {},
      comercial: {},
    } as any,
  })

  useEffect(() => {
    if (!initialData) return
    if (initialData.produtoBase !== undefined) setValue("produtoBase", initialData.produtoBase)
    if (initialData.codProduto !== undefined) setValue("codProduto", initialData.codProduto)
    if (initialData.nomeCor !== undefined) setValue("nomeCor", initialData.nomeCor)
    if (initialData.pantone !== undefined) setValue("pantone", initialData.pantone)
    if (initialData.amostraDesenvolver !== undefined) setValue("amostraDesenvolver", initialData.amostraDesenvolver)
    if (initialData.observacoes !== undefined) setValue("observacoes", initialData.observacoes)
    if (initialData.aplicacao) {
      if (initialData.aplicacao.descricaoAplicacao !== undefined) setValue("aplicacao.descricaoAplicacao", initialData.aplicacao.descricaoAplicacao)
      if (initialData.aplicacao.outrosSegmentos !== undefined) setValue("aplicacao.outrosSegmentos", initialData.aplicacao.outrosSegmentos)
    }
    if (initialData.requisitosTecnicos) {
      const rt = initialData.requisitosTecnicos as any
      if (rt.composicao !== undefined) setValue("requisitosTecnicos.composicao", rt.composicao)
      if (rt.larguraMinima !== undefined) setValue("requisitosTecnicos.larguraMinima", rt.larguraMinima)
      if (rt.larguraMaxima !== undefined) setValue("requisitosTecnicos.larguraMaxima", rt.larguraMaxima)
      if (rt.gramaturaMinima !== undefined) setValue("requisitosTecnicos.gramaturaMinima", rt.gramaturaMinima)
      if (rt.gramaturaMaxima !== undefined) setValue("requisitosTecnicos.gramaturaMaxima", rt.gramaturaMaxima)
      if (rt.densidadeUrdume !== undefined) setValue("requisitosTecnicos.densidadeUrdume", rt.densidadeUrdume)
      if (rt.densidadeTrama !== undefined) setValue("requisitosTecnicos.densidadeTrama", rt.densidadeTrama)
    }
    if (initialData.tecnologias) {
      if (initialData.tecnologias.outrasTecnologias !== undefined) setValue("tecnologias.outrasTecnologias", initialData.tecnologias.outrasTecnologias)
    }
    if (initialData.performance) {
      if (initialData.performance.outrasPerformances !== undefined) setValue("performance.outrasPerformances", initialData.performance.outrasPerformances)
    }
    if (initialData.acabamento) {
      if (initialData.acabamento.textura !== undefined) setValue("acabamento.textura", initialData.acabamento.textura)
    }
    if (initialData.cores) {
      const c = initialData.cores as any
      if (c.paletaPreferencial !== undefined) setValue("cores.paletaPreferencial", c.paletaPreferencial)
      if (c.coresEspecificas !== undefined) setValue("cores.coresEspecificas", c.coresEspecificas)
      if (c.lavabilidadeCores !== undefined) setValue("cores.lavabilidadeCores", c.lavabilidadeCores)
    }
    if (initialData.comercial) {
      const com = initialData.comercial as any
      if (com.quantidadeEstimada !== undefined) setValue("comercial.quantidadeEstimada", com.quantidadeEstimada)
      if (com.prazoEntrega !== undefined) setValue("comercial.prazoEntrega", com.prazoEntrega)
      if (com.observacoes !== undefined) setValue("comercial.observacoes", com.observacoes)
    }
  }, [initialData, setValue])

  const watch_descricaoApp = useWatch({ control, name: "aplicacao.descricaoAplicacao" })
  const watch_outrosSegmentos = useWatch({ control, name: "aplicacao.outrosSegmentos" })
  const watch_composicao = useWatch({ control, name: "requisitosTecnicos.composicao" })
  const watch_larguraMin = useWatch({ control, name: "requisitosTecnicos.larguraMinima" })
  const watch_larguraMax = useWatch({ control, name: "requisitosTecnicos.larguraMaxima" })
  const watch_gramaturaMin = useWatch({ control, name: "requisitosTecnicos.gramaturaMinima" })
  const watch_gramaturaMax = useWatch({ control, name: "requisitosTecnicos.gramaturaMaxima" })
  const watch_densidadeUrdume = useWatch({ control, name: "requisitosTecnicos.densidadeUrdume" })
  const watch_densidadeTrama = useWatch({ control, name: "requisitosTecnicos.densidadeTrama" })
  const watch_outrasTecnologias = useWatch({ control, name: "tecnologias.outrasTecnologias" })
  const watch_outrasPerformances = useWatch({ control, name: "performance.outrasPerformances" })
  const watch_textura = useWatch({ control, name: "acabamento.textura" })
  const watch_paleta = useWatch({ control, name: "cores.paletaPreferencial" })
  const watch_coresEspecificas = useWatch({ control, name: "cores.coresEspecificas" })
  const watch_lavabilidade = useWatch({ control, name: "cores.lavabilidadeCores" })
  const watch_quantidade = useWatch({ control, name: "comercial.quantidadeEstimada" })
  const watch_prazoEntrega = useWatch({ control, name: "comercial.prazoEntrega" })
  const watch_observacoes = useWatch({ control, name: "comercial.observacoes" })
  const watch_produtoBase = useWatch({ control, name: "produtoBase" })
  const watch_codProduto = useWatch({ control, name: "codProduto" })
  const watch_nomeCor = useWatch({ control, name: "nomeCor" })
  const watch_pantone = useWatch({ control, name: "pantone" })
  const watch_amostraDesenvolver = useWatch({ control, name: "amostraDesenvolver" })
  const watch_observacoesGerais = useWatch({ control, name: "observacoes" })

  const onSubmitDebug = (data: BriefingTecelagem) => {
    const currentValues = getValues()
    const completeData: BriefingTecelagem = {
      produtoBase: watch_produtoBase,
      codProduto: watch_codProduto,
      nomeCor: watch_nomeCor,
      pantone: watch_pantone,
      amostraDesenvolver: watch_amostraDesenvolver,
      observacoes: watch_observacoesGerais,
      aplicacao: {
        segmentos: currentValues.aplicacao?.segmentos || data.aplicacao?.segmentos || [],
        descricaoAplicacao: watch_descricaoApp,
        outrosSegmentos: watch_outrosSegmentos,
      },
      requisitosTecnicos: {
        tipoTecido: currentValues.requisitosTecnicos?.tipoTecido || data.requisitosTecnicos?.tipoTecido,
        ligamento: currentValues.requisitosTecnicos?.ligamento || data.requisitosTecnicos?.ligamento,
        composicao: watch_composicao,
        tipoFibra: currentValues.requisitosTecnicos?.tipoFibra || data.requisitosTecnicos?.tipoFibra || [],
        larguraMinima: watch_larguraMin !== undefined ? watch_larguraMin : (currentValues.requisitosTecnicos?.larguraMinima || data.requisitosTecnicos?.larguraMinima),
        larguraMaxima: watch_larguraMax !== undefined ? watch_larguraMax : (currentValues.requisitosTecnicos?.larguraMaxima || data.requisitosTecnicos?.larguraMaxima),
        gramaturaMinima: watch_gramaturaMin !== undefined ? watch_gramaturaMin : (currentValues.requisitosTecnicos?.gramaturaMinima || data.requisitosTecnicos?.gramaturaMinima),
        gramaturaMaxima: watch_gramaturaMax !== undefined ? watch_gramaturaMax : (currentValues.requisitosTecnicos?.gramaturaMaxima || data.requisitosTecnicos?.gramaturaMaxima),
        densidadeUrdume: watch_densidadeUrdume,
        densidadeTrama: watch_densidadeTrama,
      },
      tecnologias: {
        requeridas: currentValues.tecnologias?.requeridas || data.tecnologias?.requeridas || [],
        outrasTecnologias: watch_outrasTecnologias,
      },
      performance: {
        resistenciaAbrasao: currentValues.performance?.resistenciaAbrasao || data.performance?.resistenciaAbrasao,
        resistenciaLavagem: currentValues.performance?.resistenciaLavagem || data.performance?.resistenciaLavagem,
        resistenciaSecagem: currentValues.performance?.resistenciaSecagem || data.performance?.resistenciaSecagem,
        resistenciaPassagem: currentValues.performance?.resistenciaPassagem || data.performance?.resistenciaPassagem,
        outrasPerformances: watch_outrasPerformances,
      },
      acabamento: {
        tipos: currentValues.acabamento?.tipos || data.acabamento?.tipos || [],
        nivelBrilho: currentValues.acabamento?.nivelBrilho || data.acabamento?.nivelBrilho,
        toque: currentValues.acabamento?.toque || data.acabamento?.toque,
        textura: watch_textura,
      },
      cores: {
        tipo: currentValues.cores?.tipo || data.cores?.tipo,
        paletaPreferencial: watch_paleta,
        coresEspecificas: watch_coresEspecificas,
        lavabilidadeCores: watch_lavabilidade,
      },
      comercial: {
        targetPreco: currentValues.comercial?.targetPreco || data.comercial?.targetPreco,
        quantidadeEstimada: watch_quantidade,
        prazoEntrega: watch_prazoEntrega,
        observacoes: watch_observacoes,
      },
    }
    onNext(completeData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitDebug)} className="space-y-8 mt-6 pb-24">
      <SecaoDadosProduto control={control} />

      <Separator />
      <SecaoAplicacao control={control} errors={errors} />

      <Separator />
      <SecaoRequisitosTecnicos control={control} errors={errors} />

      <Separator />
      <SecaoTecnologias control={control} />

      <Separator />
      <SecaoPerformance control={control} errors={errors} />

      <Separator />
      <SecaoAcabamento control={control} errors={errors} />

      <Separator />
      <SecaoCores control={control} errors={errors} />

      <Separator />
      <SecaoComercial control={control} errors={errors} />

      <div className="flex justify-between items-center pt-8 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Voltar para Dados Comerciais
        </Button>
        <Button type="submit">
          Salvar Briefing e Continuar →
        </Button>
      </div>
    </form>
  )
}
