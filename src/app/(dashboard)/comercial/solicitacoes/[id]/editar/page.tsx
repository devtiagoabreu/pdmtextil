"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, ClipboardList, CheckCircle, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { dadosComerciaisSchema, DadosComerciais, BriefingTecelagem } from "@/types/briefing"
import { BriefingTecelagemForm } from "@/components/forms/BriefingTecelagemForm"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClienteAutocomplete } from "@/components/forms/ClienteAutocomplete"
import { toast } from "sonner"

export default function EditarSolicitacaoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [comercialData, setComercialData] = useState<DadosComerciais>({
    tipo: undefined,
    cliente: "",
    cnpj: "",
    projeto: "",
    prazoDesejado: "",
  } as any)
  const [briefingData, setBriefingData] = useState<Partial<BriefingTecelagem>>({})
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoClienteData, setNovoClienteData] = useState({
    nome: "",
    cnpj: "",
    razaoSocial: "",
    email: "",
    telefone: "",
    contato: "",
  })
  const [isCriandoCliente, setIsCriandoCliente] = useState(false)

  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<DadosComerciais>({
    resolver: zodResolver(dadosComerciaisSchema),
    defaultValues: comercialData as any,
  })

  useEffect(() => {
    async function loadSolicitacao() {
      try {
        const res = await fetch(`/api/solicitacoes/${id}`)
        if (!res.ok) throw new Error("Não encontrado")
        
        const data = await res.json()
        
        setComercialData({
          tipo: data.tipo,
          cliente: data.cliente,
          cnpj: data.cnpj || "",
          projeto: data.projeto || "",
          prazoDesejado: data.prazoDesejado ? new Date(data.prazoDesejado).toISOString().split('T')[0] : "",
        })
        
        if (data.briefing) {
          setBriefingData(data.briefing)
        }
      } catch (err) {
        toast.error("Erro ao carregar solicitação")
        router.push("/comercial/solicitacoes")
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      loadSolicitacao()
    }
  }, [id, router])

  const onStep1Submit = (data: DadosComerciais) => {
    setComercialData(data)
  }

  const onStep2Submit = (data: BriefingTecelagem) => {
    setBriefingData(data)
    handleSalvar(data)
  }

  const handleSalvar = async (briefing?: BriefingTecelagem) => {
    setIsSubmitting(true)
    try {
      const payload = {
        tipo: comercialData.tipo,
        cliente: comercialData.cliente,
        cnpj: comercialData.cnpj || null,
        projeto: comercialData.projeto || null,
        prazoDesejado: comercialData.prazoDesejado ? new Date(comercialData.prazoDesejado) : null,
        briefing: briefing || briefingData,
      }

      const res = await fetch(`/api/solicitacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast.success("Solicitação salva com sucesso!")
      router.push(`/comercial/solicitacoes/${id}`)
    } catch (err) {
      toast.error("Erro ao salvar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNovoCliente = async () => {
    try {
      setIsCriandoCliente(true)
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoClienteData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar cliente")
      }
      const cliente = await res.json()
      setComercialData((prev) => ({ ...prev, cliente: cliente.nome, cnpj: cliente.cnpj }))
      setShowNovoCliente(false)
      setNovoClienteData({ nome: "", cnpj: "", razaoSocial: "",email: "", telefone: "", contato: "" })
      toast.success("Cliente criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente.")
    } finally {
      setIsCriandoCliente(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <Link
          href={`/comercial/solicitacoes/${id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Voltar para Detalhes
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Editar Solicitação #{id}</h1>
        <p className="text-muted-foreground mt-2">Altere os dados da solicitação.</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-6">
          <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-100">
            Dados do Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tipo de Solicitação <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESENVOLVIMENTO_TECELAGEM">Desenvolvimento de Tecido (Tecelagem)</SelectItem>
                      <SelectItem value="DESENVOLVIMENTO_BENEFICIAMENTO">Desenvolvimento de Beneficiamento</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo && (
                <p className="text-xs text-red-500 mt-1">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="cliente"
                control={control}
                render={({ field }) => (
                  <ClienteAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    onSelect={(cliente) => setValue("cnpj", cliente.cnpj)}
                    onNovoCliente={() => setShowNovoCliente(true)}
                    error={errors.cliente?.message}
                    cnpjValue={comercialData.cnpj}
                    onCnpjChange={(val) => setComercialData((prev) => ({ ...prev, cnpj: val }))}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Projeto</Label>
              <Input {...register("projeto")} placeholder="Ex: Coleção Inverno 2027" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prazo Desejado</Label>
              <Input type="date" {...register("prazoDesejado")} className="max-w-xs" />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Continuar para Briefing →
            </Button>
          </div>
        </form>

        <BriefingTecelagemForm 
          initialData={briefingData as any}
          onNext={onStep2Submit} 
          onBack={() => {}}
        />
      </div>
    </div>
  )
}