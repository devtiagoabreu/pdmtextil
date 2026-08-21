"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, ClipboardList, Paperclip, CheckCircle, Search, Loader2 } from "lucide-react"
import Link from "next/link"

import { dadosComerciaisSchema, DadosComerciais, BriefingTecelagem } from "@/types/briefing"
import { BriefingTecelagemForm } from "@/components/forms/BriefingTecelagemForm"
import { AnexosUpload, AnexoDraft } from "@/components/forms/AnexosUpload"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ClienteAutocomplete } from "@/components/forms/ClienteAutocomplete"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const STEPS = [
  { id: 1, title: "Dados Comerciais", icon: FileText },
  { id: 2, title: "Briefing Técnico", icon: ClipboardList },
  { id: 3, title: "Anexos & Envio", icon: Paperclip },
]

export default function NovaSolicitacaoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [comercialData, setComercialData] = useState<DadosComerciais>({
    tipo: undefined,
    cliente: "",
    cnpj: "",
    projeto: "",
    prazoDesejado: "",
  } as any)
  const [briefingData, setBriefingData] = useState<Partial<BriefingTecelagem>>({})
  const [anexosData, setAnexosData] = useState<AnexoDraft[]>([])
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoClienteData, setNovoClienteData] = useState({
    nome: "",
    cnpj: "",
    razaoSocial: "",
    email: "",
    emailNf: "",
    telefone: "",
    celular: "",
    contato: "",
    segmento: "",
    endereco: "",
    cidade: "",
    uf: "",
  })
  const [isCriandoCliente, setIsCriandoCliente] = useState(false)
  const [isConsultandoCnpj, setIsConsultandoCnpj] = useState(false)

  // STEP 1 FORM
  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<DadosComerciais>({
    resolver: zodResolver(dadosComerciaisSchema),
    defaultValues: comercialData as any,
  })

  // Sincroniza RHF -> comercialData em tempo real
  useEffect(() => {
    const subscription = watch((value) => {
      setComercialData(prev => ({ ...prev, ...value }))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const onStep1Submit = (data: DadosComerciais) => {
    setComercialData(data)
    setStep(2)
  }

  const onStep2Submit = (data: BriefingTecelagem) => {
    setBriefingData(data)
    setStep(3)
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
      setNovoClienteData({ nome: "", cnpj: "", razaoSocial: "", email: "", emailNf: "", telefone: "", celular: "", contato: "", segmento: "", endereco: "", cidade: "", uf: "" })
      toast.success("Cliente criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente.")
    } finally {
      setIsCriandoCliente(false)
    }
  }

  const handleConsultarCnpj = async () => {
    const digits = novoClienteData.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setIsConsultandoCnpj(true)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        toast.error("CNPJ não encontrado na Receita Federal")
        return
      }
      setNovoClienteData((prev) => ({
        ...prev,
        nome: api.nome_fantasia || prev.nome,
        cnpj: api.cnpj || prev.cnpj,
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro].filter(Boolean).join(", ") || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
        segmento: api.cnae_principal_descricao || prev.segmento,
      }))
      toast.success("Dados preenchidos pela Receita Federal")
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CNPJ")
    } finally {
      setIsConsultandoCnpj(false)
    }
  }

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Usa getValues() do RHF como fonte primária (mais confiável), com fallback para comercialData
      const rhfValues = getValues()
      
      const payload = {
        tipo: rhfValues.tipo || comercialData.tipo,
        cliente: rhfValues.cliente || comercialData.cliente,
        cnpj: rhfValues.cnpj || comercialData.cnpj || null,
        projeto: rhfValues.projeto || comercialData.projeto || null,
        prazoDesejado: (rhfValues.prazoDesejado || comercialData.prazoDesejado) 
          ? `${rhfValues.prazoDesejado || comercialData.prazoDesejado}T12:00:00Z` 
          : null,
        briefing: briefingData,
        anexos: anexosData,
      }

      // Validação final antes do envio
      if (!payload.tipo) {
        throw new Error("Tipo de solicitação é obrigatório")
      }
      if (!payload.cliente) {
        throw new Error("Cliente é obrigatório")
      }

      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar solicitação")
      }

      toast.success("Solicitação criada com sucesso! 🎉")
      router.push("/comercial/solicitacoes")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar solicitação.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação{info && <InfoButton content={info} />}</h1>
          <p className="text-muted-foreground mt-2">Crie uma nova solicitação de desenvolvimento têxtil.</p>
        </div>
        <Link
          href="/comercial/solicitacoes"
          className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 text-sm"
        >
          Cancelar
        </Link>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-muted -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {STEPS.map((s: any) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isCompleted = step > s.id
          
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isActive ? "bg-primary text-primary-foreground" :
                isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
        <div className={step === 1 ? "block" : "hidden"}>
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-100">
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo usando Select do shadcn */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo de Solicitação <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(val: string | null) => {
                        if (val) field.onChange(val)
                        setComercialData(prev => ({ ...prev, tipo: val as any }))
                      }} 
                      defaultValue={field.value}
                    >
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
                      onChange={(val) => {
                        field.onChange(val)
                        setComercialData(prev => ({ ...prev, cliente: val }))
                      }}
                      onSelect={(cliente) => {
                        setValue("cnpj", cliente.cnpj)
                        setComercialData(prev => ({ ...prev, cnpj: cliente.cnpj }))
                      }}
                      onNovoCliente={() => setShowNovoCliente(true)}
                      error={errors.cliente?.message}
                      cnpjError={errors.cnpj?.message}
                      cnpjValue={comercialData.cnpj}
                      onCnpjChange={(val) => {
                        setValue("cnpj", val)
                        setComercialData((prev) => ({ ...prev, cnpj: val }))
                      }}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Projeto</Label>
                <Controller
                  name="projeto"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      placeholder="Ex: Coleção Inverno 2027" 
                      onChange={(e) => {
                        field.onChange(e)
                        setComercialData(prev => ({ ...prev, projeto: e.target.value }))
                      }}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prazo Desejado</Label>
                <Controller
                  name="prazoDesejado"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      type="date" 
                      {...field} 
                      className="max-w-xs" 
                      onChange={(e) => {
                        field.onChange(e)
                        setComercialData(prev => ({ ...prev, prazoDesejado: e.target.value }))
                      }}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Continuar para Briefing →
              </Button>
            </div>
          </form>
        </div>

        <div className={step === 2 ? "block" : "hidden"}>
          <BriefingTecelagemForm 
            initialData={briefingData as any}
            onNext={onStep2Submit} 
            onBack={() => setStep(1)} 
          />
        </div>

        <div className={step === 3 ? "block" : "hidden"}>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Anexos e Referências</h2>
            <p className="text-sm text-muted-foreground">
              Adicione arquivos de modelagem, referências visuais (Pinterest) ou documentos de especificação.
            </p>
            
            <AnexosUpload 
              anexos={anexosData} 
              onChange={setAnexosData} 
            />

            <div className="bg-muted/50 p-4 rounded-lg mt-8 border border-border">
              <h3 className="font-semibold mb-2">Resumo da Solicitação</h3>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Cliente:</span> {watch("cliente") || comercialData.cliente || "—"}</li>
                <li><span className="font-medium">Projeto:</span> {watch("projeto") || comercialData.projeto || "N/A"}</li>
                <li><span className="font-medium">Tipo:</span> {(watch("tipo") || comercialData.tipo)?.replace("DESENVOLVIMENTO_", "") || "—"}</li>
                <li><span className="font-medium">Total de Anexos:</span> {anexosData.length}</li>
              </ul>
            </div>

            <div className="flex justify-between items-center pt-8 border-t">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Voltar para Briefing
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Finalizar Solicitação"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showNovoCliente} onOpenChange={setShowNovoCliente}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Digite o CNPJ e clique em Consultar para preencher automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="novo-cnpj">CNPJ *</Label>
              <div className="flex gap-2">
                <Input
                  id="novo-cnpj"
                  value={novoClienteData.cnpj}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="font-mono flex-1"
                  maxLength={18}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleConsultarCnpj}
                  disabled={isConsultandoCnpj || novoClienteData.cnpj.replace(/\D/g, "").length !== 14}
                  className="gap-1 shrink-0"
                >
                  {isConsultandoCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Consultar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-nome">Nome / Fantasia *</Label>
              <Input
                id="novo-nome"
                value={novoClienteData.nome}
                onChange={(e) => setNovoClienteData((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Moda Fitness SA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-razao">Razão Social</Label>
              <Input
                id="novo-razao"
                value={novoClienteData.razaoSocial}
                onChange={(e) => setNovoClienteData((p) => ({ ...p, razaoSocial: e.target.value }))}
                placeholder="Razão Social completa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-email">Email</Label>
                <Input
                  id="novo-email"
                  type="email"
                  value={novoClienteData.email}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="contato@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-emailNf">Email NF</Label>
                <Input
                  id="novo-emailNf"
                  type="email"
                  value={novoClienteData.emailNf}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, emailNf: e.target.value }))}
                  placeholder="nf@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-telefone">Telefone</Label>
                <Input
                  id="novo-telefone"
                  value={novoClienteData.telefone}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 3333-4444"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-celular">Celular</Label>
                <Input
                  id="novo-celular"
                  value={novoClienteData.celular}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, celular: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novo-contato">Contato</Label>
                <Input
                  id="novo-contato"
                  value={novoClienteData.contato}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, contato: e.target.value }))}
                  placeholder="Nome do contato"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-segmento">Segmento</Label>
                <Input
                  id="novo-segmento"
                  value={novoClienteData.segmento}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, segmento: e.target.value }))}
                  placeholder="Ex: Têxtil"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-endereco">Endereço</Label>
              <Input
                id="novo-endereco"
                value={novoClienteData.endereco}
                onChange={(e) => setNovoClienteData((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="novo-cidade">Cidade</Label>
                <Input
                  id="novo-cidade"
                  value={novoClienteData.cidade}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, cidade: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novo-uf">UF</Label>
                <Input
                  id="novo-uf"
                  value={novoClienteData.uf}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoCliente(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleNovoCliente}
              disabled={isCriandoCliente || !novoClienteData.nome.trim() || !novoClienteData.cnpj.trim()}
            >
              {isCriandoCliente ? "Criando..." : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
