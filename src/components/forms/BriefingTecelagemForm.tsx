"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { briefingTecelagemSchema, BriefingTecelagem } from "@/types/briefing"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface BriefingTecelagemFormProps {
  initialData?: Partial<BriefingTecelagem>
  onNext: (data: BriefingTecelagem) => void
  onBack: () => void
}

const CARACTERISTICAS_OPCOES = [
  { id: "respiravel", label: "Respirável" },
  { id: "secagem_rapida", label: "Secagem Rápida" },
  { id: "antiodor", label: "Antiodor" },
  { id: "anti_pilling", label: "Anti-pilling" },
]

export function BriefingTecelagemForm({ initialData, onNext, onBack }: BriefingTecelagemFormProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<BriefingTecelagem>({
    resolver: zodResolver(briefingTecelagemSchema),
    defaultValues: initialData || {
      usoFinal: {
        ambiente: [],
        condicoesEspeciais: [],
      },
      performance: {
        caracteristicas: [],
      },
      composicao: {
        elastano: false,
      }
    } as any,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8 mt-6 pb-24">
      {/* SEÇÃO 1: USO FINAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">1. Uso Final</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Tipo de Uniforme *</Label>
            <Controller
              name="usoFinal.tipoUniforme"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OPERACIONAL_PESADO" id="t_op" />
                    <Label htmlFor="t_op">Operacional Pesado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PROFISSIONAL_TECNICO" id="t_pt" />
                    <Label htmlFor="t_pt">Profissional Técnico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CORPORATIVO" id="t_corp" />
                    <Label htmlFor="t_corp">Corporativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESPORTIVO_ATIVO" id="t_esp" />
                    <Label htmlFor="t_esp">Esportivo / Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SAUDE_HOSPITALAR" id="t_sau" />
                    <Label htmlFor="t_sau">Saúde / Hospitalar</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.usoFinal?.tipoUniforme && <p className="text-sm text-destructive">{errors.usoFinal.tipoUniforme.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Temperatura *</Label>
            <Controller
              name="usoFinal.temperatura"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CALOR_INTENSO" id="temp_calor" />
                    <Label htmlFor="temp_calor">Calor Intenso</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AMBIENTE_CONTROLADO" id="temp_ac" />
                    <Label htmlFor="temp_ac">Ambiente Controlado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FRIO" id="temp_frio" />
                    <Label htmlFor="temp_frio">Frio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="VARIADO" id="temp_var" />
                    <Label htmlFor="temp_var">Variado</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.usoFinal?.temperatura && <p className="text-sm text-destructive">{errors.usoFinal.temperatura.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Ambiente *</Label>
            <Controller
              name="usoFinal.ambiente"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="amb_int" 
                      checked={field.value?.includes("INTERNO")}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), "INTERNO"])
                          : field.onChange(field.value?.filter((val) => val !== "INTERNO"))
                      }}
                    />
                    <Label htmlFor="amb_int">Interno</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="amb_ext" 
                      checked={field.value?.includes("EXTERNO")}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), "EXTERNO"])
                          : field.onChange(field.value?.filter((val) => val !== "EXTERNO"))
                      }}
                    />
                    <Label htmlFor="amb_ext">Externo</Label>
                  </div>
                </div>
              )}
            />
            {errors.usoFinal?.ambiente && <p className="text-sm text-destructive">{errors.usoFinal.ambiente.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Abrasão *</Label>
            <Controller
              name="usoFinal.abrasao"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BAIXA" id="abr_b" />
                    <Label htmlFor="abr_b">Baixa (Escritório)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEDIA" id="abr_m" />
                    <Label htmlFor="abr_m">Média (Logística)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALTA" id="abr_a" />
                    <Label htmlFor="abr_a">Alta (Indústria)</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.usoFinal?.abrasao && <p className="text-sm text-destructive">{errors.usoFinal.abrasao.message}</p>}
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: PERFORMANCE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">2. Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Características * (mínimo 1)</Label>
            <Controller
              name="performance.caracteristicas"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {CARACTERISTICAS_OPCOES.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox id={item.id} 
                        checked={field.value?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), item.id])
                            : field.onChange(field.value?.filter((val) => val !== item.id))
                        }}
                      />
                      <Label htmlFor={item.id}>{item.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.performance?.caracteristicas && <p className="text-sm text-destructive">{errors.performance.caracteristicas.message}</p>}
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 & 4 & 5: GRAMATURA, TOQUE, VISUAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">3, 4 e 5. Propriedades Físicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label>Gramatura *</Label>
            <Controller
              name="gramatura"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LEVE" id="g_leve" />
                    <Label htmlFor="g_leve">Leve</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEDIO" id="g_medio" />
                    <Label htmlFor="g_medio">Médio (180-250 g/m²)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PESADO" id="g_pesado" />
                    <Label htmlFor="g_pesado">Pesado</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.gramatura && <p className="text-sm text-destructive">{errors.gramatura.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Toque *</Label>
            <Controller
              name="toque"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TECNICO_SECO" id="tq_tec" />
                    <Label htmlFor="tq_tec">Técnico / Seco</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MACIO_CONFORTO" id="tq_mac" />
                    <Label htmlFor="tq_mac">Macio / Conforto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESTRUTURADO" id="tq_est" />
                    <Label htmlFor="tq_est">Estruturado</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.toque && <p className="text-sm text-destructive">{errors.toque.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Acabamento Visual *</Label>
            <Controller
              name="visual.acabamento"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FOSCO" id="v_fos" />
                    <Label htmlFor="v_fos">Fosco</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LEVEMENTE_BRILHANTE" id="v_lb" />
                    <Label htmlFor="v_lb">Levemente Brilhante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALTO_BRILHO" id="v_ab" />
                    <Label htmlFor="v_ab">Alto Brilho</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.visual?.acabamento && <p className="text-sm text-destructive">{errors.visual.acabamento.message}</p>}
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <Label>Estilo do Visual *</Label>
          <Controller
            name="visual.estilo"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 flex-wrap">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ESPORTIVO" id="e_esp" />
                  <Label htmlFor="e_esp">Esportivo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SOCIAL" id="e_soc" />
                  <Label htmlFor="e_soc">Social</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TECNICO" id="e_tec" />
                  <Label htmlFor="e_tec">Técnico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CASUAL" id="e_cas" />
                  <Label htmlFor="e_cas">Casual</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.visual?.estilo && <p className="text-sm text-destructive">{errors.visual.estilo.message}</p>}
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 6, 7, 8: COMPOSIÇÃO, CORES E PREÇO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">6. Composição</h2>
          <div className="space-y-3">
            <Label>Sugestão Urdume</Label>
            <Input {...register("composicao.urdume")} placeholder="Ex: Poliéster 100%" />
          </div>
          <div className="space-y-3">
            <Label>Sugestão Trama</Label>
            <Input {...register("composicao.trama")} placeholder="Ex: Algodão 20/1" />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="composicao.elastano"
              control={control}
              render={({ field }) => (
                <Checkbox id="c_el" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="c_el">Com Elastano</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">7. Cores</h2>
          <Controller
            name="cores.tipo"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SOLIDAS" id="c_sol" />
                  <Label htmlFor="c_sol">Cores Sólidas (Padrão)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DESENVOLVIMENTO_EXCLUSIVO" id="c_exc" />
                  <Label htmlFor="c_exc">Desenvolvimento Exclusivo</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.cores?.tipo && <p className="text-sm text-destructive">{errors.cores.tipo.message}</p>}
          <div className="space-y-2 mt-4">
            <Label>Observações sobre cores</Label>
            <Textarea {...register("cores.observacoes")} placeholder="Ex: Tons pastéis..." />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">8. Preço</h2>
          <Controller
            name="preco"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ECONOMICO" id="p_eco" />
                  <Label htmlFor="p_eco">Econômico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INTERMEDIARIO" id="p_int" />
                  <Label htmlFor="p_int">Intermediário</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PREMIUM" id="p_pre" />
                  <Label htmlFor="p_pre">Premium</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.preco && <p className="text-sm text-destructive">{errors.preco.message}</p>}
        </div>
      </section>

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
