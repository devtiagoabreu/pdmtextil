"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, ClipboardList, Paperclip, CheckCircle } from "lucide-react"

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
    telefone: "",
    contato: "",
  })
  const [isCriandoCliente, setIsCriandoCliente] = useState(false)

  // STEP 1 FORM
  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<DadosComerciais>({
    resolver: zodResolver(dadosComerciaisSchema),
    defaultValues: comercialData as any,
  })

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
      setNovoClienteData({ nome: "", cnpj: "", razaoSocial: "", email: "", telefone: "", contato: "" })
      toast.success("Cliente criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente.")
    } finally {
      setIsCriandoCliente(false)
    }
  }

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Lê valores diretamente do RHF (sempre atualizados, independente do passo atual)
      const rhfValues = getValues()

      // Usa RHF como fonte primária, com fallback para o estado comercialData
      // (garantia caso o campo não tenha sido registrado pelo RHF em algum step)
      const prazo = rhfValues.prazoDesejado || comercialData.prazoDesejado || ""

      const payload = {
        tipo: rhfValues.tipo || comercialData.tipo,
        cliente: rhfValues.cliente || comercialData.cliente,
        cnpj: rhfValues.cnpj || comercialData.cnpj || null,
        projeto: rhfValues.projeto || comercialData.projeto || null,
        prazoDesejado: prazo ? `${prazo}T12:00:00Z` : null,
        briefing: briefingData,
        anexos: anexosData,
      }

      console.log("=== SENDING POST PAYLOAD ===", payload);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação</h1>
        <p className="text-muted-foreground mt-2">Crie uma nova solicitação de desenvolvimento têxtil.</p>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-muted -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {STEPS.map((s) => {
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
                      onCnpjChange={(val) => {
                        setComercialData((prev) => ({ ...prev, cnpj: val }))
                        setValue("cnpj", val)
                      }}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente para usar na solicitação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="novo-cnpj">CNPJ *</Label>
              <Input
                id="novo-cnpj"
                value={novoClienteData.cnpj}
                onChange={(e) => setNovoClienteData((p) => ({ ...p, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
                className="font-mono"
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
                <Label htmlFor="novo-telefone">Telefone</Label>
                <Input
                  id="novo-telefone"
                  value={novoClienteData.telefone}
                  onChange={(e) => setNovoClienteData((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
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
