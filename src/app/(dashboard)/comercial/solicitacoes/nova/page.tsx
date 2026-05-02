"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, ClipboardList, Paperclip, CheckCircle } from "lucide-react"

import { dadosComerciaisSchema, DadosComerciais, BriefingTecelagem } from "@/types/briefing"
import { BriefingTecelagemForm } from "@/components/forms/BriefingTecelagemForm"
import { AnexosUpload, AnexoDraft } from "@/components/forms/AnexosUpload"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  
  const [comercialData, setComercialData] = useState<Partial<DadosComerciais>>({})
  const [briefingData, setBriefingData] = useState<Partial<BriefingTecelagem>>({})
  const [anexosData, setAnexosData] = useState<AnexoDraft[]>([])

  // STEP 1 FORM
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DadosComerciais>({
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

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true)

      const payload = {
        tipo: comercialData.tipo,
        cliente: comercialData.cliente,
        cnpj: comercialData.cnpj || null,
        projeto: comercialData.projeto || null,
        prazoDesejado: comercialData.prazoDesejado || null,
        briefing: briefingData,
        anexos: anexosData,
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

      <div className="bg-card border rounded-lg shadow-sm p-6 md:p-8">
        {step === 1 && (
          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Dados do Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Tipo de Solicitação *</Label>
                <Select 
                  defaultValue={watch("tipo")} 
                  onValueChange={(val) => setValue("tipo", val as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESENVOLVIMENTO_TECELAGEM">Desenvolvimento de Tecido</SelectItem>
                    <SelectItem value="DESENVOLVIMENTO_BENEFICIAMENTO">Desenvolvimento de Beneficiamento</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo && <p className="text-sm text-destructive">{errors.tipo.message}</p>}
              </div>

              <div className="space-y-3">
                <Label>Cliente *</Label>
                <Input {...register("cliente")} placeholder="Nome da empresa ou marca" />
                {errors.cliente && <p className="text-sm text-destructive">{errors.cliente.message}</p>}
              </div>

              <div className="space-y-3">
                <Label>CNPJ</Label>
                <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
              </div>

              <div className="space-y-3">
                <Label>Nome do Projeto</Label>
                <Input {...register("projeto")} placeholder="Ex: Coleção Inverno 2027" />
              </div>

              <div className="space-y-3">
                <Label>Prazo Desejado</Label>
                <Input type="date" {...register("prazoDesejado")} />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-8">
              <Button type="submit">Continuar para Briefing →</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <BriefingTecelagemForm 
            initialData={briefingData as any}
            onNext={onStep2Submit} 
            onBack={() => setStep(1)} 
          />
        )}

        {step === 3 && (
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
                <li><span className="font-medium">Cliente:</span> {comercialData.cliente}</li>
                <li><span className="font-medium">Projeto:</span> {comercialData.projeto || "N/A"}</li>
                <li><span className="font-medium">Tipo:</span> {comercialData.tipo?.replace("DESENVOLVIMENTO_", "")}</li>
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
        )}
      </div>
    </div>
  )
}
