"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { briefingTecelagemSchema, BriefingTecelagem, SEGMENTOS, TECNOLOGIAS, LIGAMENTO, TIPOS_ACABAMENTO, TIPO_FIBRA } from "@/types/briefing"
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

const SEGMENTOS_LABELS: Record<string, string> = {
  UNIFORME_CORPORATIVO: "Uniforme Corporativo",
  LENCOL_HOSPITALAR: "Lençol Hospitalar",
  LENCOL_CAMA_RESIDENCIAL: "Lençol de Cama Residencial",
  ROUPA_INTIMA: "Roupa Íntima",
  ROUPA_BANHO: "Roupa de Banho",
  ROUPA_MODA: "Roupa Moda",
  CALCADO: "Calçado",
  LINHA_MESA: "Linha de Mesa",
  COLCHAO: "Colchão",
  FORRO_MODA: "Forro de Moda",
  ESTOFADO_MOVEIS: "Estofado de Móveis",
  CORTINA: "Cortina",
  BAG: "Bag / Bolsas",
  ACESSORIOS: "Acessórios",
  DECORACAO: "Decoração",
  INDUSTRIAL: "Industrial",
  OUTROS: "Outros",
}

const TECNOLOGIAS_LABELS: Record<string, string> = {
  ANTIBACTERIANO: "Antibacteriano",
  ANTIFLAMAS: "Antiflamas",
  ANTIODOR: "Antiodor",
  ANTI_PILLING: "Anti-pilling",
  PROTECAO_UV: "Proteção UV",
  RESPIRABILIDADE: "Respirabilidade",
  SECAGEM_RAPIDA: "Secagem Rápida",
  TERMOREGULACAO: "Termorregulação",
  IMPERMEAVEL: "Impermeável",
  RESISTENTE_ABRASÃO: "Resistente à Abrasão",
  SOFT_TOUCH: "Soft Touch",
  HYDRARE: "HydraRe",
  OUTROS: "Outros",
}

const LIGAMENTO_LABELS: Record<string, string> = {
  TAFETAN: "Taftan",
  SARJA: "Sarja",
  RIBANA: "Ribana",
  CETIM: "Cetim",
  OXFORD: "Oxford",
  DOBRADINHA: "Dobradinha",
  MALHA: "Malha",
  OUTROS: "Outros",
}

const TIPOS_ACABAMENTO_LABELS: Record<string, string> = {
  SANFORIZADO: "Sanforizado",
  MERCERIZADO: "Mercerizado",
  RESINADO: "Resinado",
  AMACIADO: "Amaciado",
  ESFOLHADO: "Esfoliado",
  BRILHO: "Brilho",
  FOSCO: "Fosco",
  TEXTURIZADO: "Texturizado",
  ESTAMPADO: "Estampado",
  TINGIDO: "Tingido",
  OUTROS: "Outros",
}

const TIPO_FIBRA_LABELS: Record<string, string> = {
  POLIESTER: "Poliéster",
  ALGODAO: "Algodão",
  LINHO: "Linho",
  VISCOSE: "Viscose",
  MODAL: "Modal",
  ACRILICO: "Acrílico",
  NYLON: "Nylon",
  LINHA_RECICLADA: "Linha Reciclada",
  ORGANICO: "Orgânico",
  OUTROS: "Outros",
}

export function BriefingTecelagemForm({ initialData, onNext, onBack }: BriefingTecelagemFormProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<BriefingTecelagem>({
    resolver: zodResolver(briefingTecelagemSchema),
    defaultValues: initialData || {
      aplicacao: { segmentos: [] },
      tecnologias: { requeridas: [] },
      performance: {},
      acabamento: { tipos: [] },
      cores: {},
      comercial: {},
    } as any,
  })

  const onSubmitDebug = (data: BriefingTecelagem) => {
    console.log("=== BRIEFING FORM SUBMIT DATA ===", JSON.stringify(data, null, 2))
    onNext(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitDebug)} className="space-y-8 mt-6 pb-24">
      {/* SEÇÃO 1: APLICAÇÃO / USO FINAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">1. Aplicação / Uso Final</h2>
        
        <div className="space-y-3">
          <Label>Segmento de Uso *</Label>
          <Controller
            name="aplicacao.segmentos"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SEGMENTOS.map((segmento) => (
                  <div key={segmento} className="flex items-center space-x-2">
                    <Checkbox
                      id={segmento}
                      checked={field.value?.includes(segmento)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), segmento])
                          : field.onChange(field.value?.filter((val) => val !== segmento))
                      }}
                    />
                    <Label htmlFor={segmento} className="text-sm font-normal cursor-pointer">
                      {SEGMENTOS_LABELS[segmento]}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
          {errors.aplicacao?.segmentos && (
            <p className="text-sm text-red-500">{errors.aplicacao.segmentos.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Descrição da Aplicação</Label>
          <Textarea
            {...register("aplicacao.descricaoAplicacao")}
            placeholder="Descreva como o tecido será utilizado..."
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label>Outros Segmentos</Label>
          <Input
            {...register("aplicacao.outrosSegmentos")}
            placeholder="Descreva outros segmentos não listados..."
          />
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 2: REQUISITOS TÉCNICOS DO TECIDO */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">2. Requisitos Técnicos do Tecido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Tipo de Tecido *</Label>
            <Controller
              name="requisitosTecnicos.tipoTecido"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PLANO" id="tecido_plano" />
                    <Label htmlFor="tecido_plano" className="cursor-pointer">Tecido Plano</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="JACQUARD" id="tecido_jacquard" />
                    <Label htmlFor="tecido_jacquard" className="cursor-pointer">Jacquard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MALHA" id="tecido_malha" />
                    <Label htmlFor="tecido_malha" className="cursor-pointer">Malha</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.requisitosTecnicos?.tipoTecido && (
              <p className="text-sm text-red-500">{errors.requisitosTecnicos.tipoTecido.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Ligamento</Label>
            <Controller
              name="requisitosTecnicos.ligamento"
              control={control}
              render={({ field }) => (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={field.value || ""}
                  onChange={field.onChange}
                >
                  <option value="">Selecione...</option>
                  {LIGAMENTO.map((l) => (
                    <option key={l} value={l}>{LIGAMENTO_LABELS[l]}</option>
                  ))}
                </select>
              )}
            />
          </div>

          <div className="space-y-3">
            <Label>Composição</Label>
            <Input
              {...register("requisitosTecnicos.composicao")}
              placeholder="Ex: 100% Poliéter, 65% Poliéter / 35% Algodão"
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Fibra</Label>
            <Controller
              name="requisitosTecnicos.tipoFibra"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TIPO_FIBRA.map((fibra) => (
                    <div key={fibra} className="flex items-center space-x-2">
                      <Checkbox
                        id={fibra}
                        checked={field.value?.includes(fibra)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), fibra])
                            : field.onChange(field.value?.filter((val) => val !== fibra))
                        }}
                      />
                      <Label htmlFor={fibra} className="text-sm font-normal cursor-pointer">
                        {TIPO_FIBRA_LABELS[fibra]}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-3">
            <Label>Largura (cm)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                {...register("requisitosTecnicos.larguraMinima")}
                placeholder="Mín"
                className="w-full"
              />
              <Input
                type="number"
                {...register("requisitosTecnicos.larguraMaxima")}
                placeholder="Máx"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Gramatura (g/m²)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                {...register("requisitosTecnicos.gramaturaMinima")}
                placeholder="Mín"
                className="w-full"
              />
              <Input
                type="number"
                {...register("requisitosTecnicos.gramaturaMaxima")}
                placeholder="Máx"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Densidade Urdume</Label>
            <Input
              {...register("requisitosTecnicos.densidadeUrdume")}
              placeholder="Ex: 60 fios/cm"
            />
          </div>

          <div className="space-y-3">
            <Label>Densidade Trama</Label>
            <Input
              {...register("requisitosTecnicos.densidadeTrama")}
              placeholder="Ex: 40 pasadas/cm"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 3: TECNOLOGIAS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">3. Tecnologias</h2>
        
        <div className="space-y-3">
          <Label>Tecnologias Requeridas</Label>
          <Controller
            name="tecnologias.requeridas"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TECNOLOGIAS.map((tec) => (
                  <div key={tec} className="flex items-center space-x-2">
                    <Checkbox
                      id={tec}
                      checked={field.value?.includes(tec)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), tec])
                          : field.onChange(field.value?.filter((val) => val !== tec))
                      }}
                    />
                    <Label htmlFor={tec} className="text-sm font-normal cursor-pointer">
                      {TECNOLOGIAS_LABELS[tec]}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
        </div>

        <div className="space-y-3">
          <Label>Outras Tecnologias</Label>
          <Input
            {...register("tecnologias.outrasTecnologias")}
            placeholder="Descreva outras tecnologias não listadas..."
          />
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 4: PERFORMANCE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">4. Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Resistência à Abrasão *</Label>
            <Controller
              name="performance.resistenciaAbrasao"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BAIXA" id="abr_baixa" />
                    <Label htmlFor="abr_baixa" className="cursor-pointer">Baixa (escritório, uso leve)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEDIA" id="abr_media" />
                    <Label htmlFor="abr_media" className="cursor-pointer">Média (logística, uso moderado)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALTA" id="abr_alta" />
                    <Label htmlFor="abr_alta" className="cursor-pointer">Alta (indústria, uso intenso)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MUITO_ALTA" id="abr_muito_alta" />
                    <Label htmlFor="abr_muito_alta" className="cursor-pointer">Muito Alta (uso extremo)</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.performance?.resistenciaAbrasao && (
              <p className="text-sm text-red-500">{errors.performance.resistenciaAbrasao.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Resistência na Lavagem</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="performance.resistenciaLavagem"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="res_lav"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="res_lav" className="cursor-pointer">Resistência à Lavagem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="performance.resistenciaSecagem"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="res_sec"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="res_sec" className="cursor-pointer">Resistência à Secagem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="performance.resistenciaPassagem"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="res_pass"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="res_pass" className="cursor-pointer">Resistência à Passagem</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Outras Performances</Label>
            <Input
              {...register("performance.outrasPerformances")}
              placeholder="Descreva outras performances especiais..."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 5: ACABAMENTO */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">5. Acabamento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Tipos de Acabamento *</Label>
            <Controller
              name="acabamento.tipos"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_ACABAMENTO.map((tipo) => (
                    <div key={tipo} className="flex items-center space-x-2">
                      <Checkbox
                        id={`acab_${tipo}`}
                        checked={field.value?.includes(tipo)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...(field.value || []), tipo])
                            : field.onChange(field.value?.filter((val) => val !== tipo))
                        }}
                      />
                      <Label htmlFor={`acab_${tipo}`} className="text-sm font-normal cursor-pointer">
                        {TIPOS_ACABAMENTO_LABELS[tipo]}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            />
            {errors.acabamento?.tipos && (
              <p className="text-sm text-red-500">{errors.acabamento.tipos.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Nível de Brilho *</Label>
            <Controller
              name="acabamento.nivelBrilho"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FOSCO" id="brilho_fosco" />
                    <Label htmlFor="brilho_fosco" className="cursor-pointer">Fosco</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SEMI_FOSCO" id="brilho_semi" />
                    <Label htmlFor="brilho_semi" className="cursor-pointer">Semi-Fosco</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BRILHANTE" id="brilho_brilhante" />
                    <Label htmlFor="brilho_brilhante" className="cursor-pointer">Brilhante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALTO_BRILHO" id="brilho_alto" />
                    <Label htmlFor="brilho_alto" className="cursor-pointer">Alto Brilho</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.acabamento?.nivelBrilho && (
              <p className="text-sm text-red-500">{errors.acabamento.nivelBrilho.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Toque *</Label>
            <Controller
              name="acabamento.toque"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SECO" id="toque_seco" />
                    <Label htmlFor="toque_seco" className="cursor-pointer">Seco / Técnico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MACIO" id="toque_macio" />
                    <Label htmlFor="toque_macio" className="cursor-pointer">Macio</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SUAVE" id="toque_suave" />
                    <Label htmlFor="toque_suave" className="cursor-pointer">Suave</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESTRUTURADO" id="toque_estruturado" />
                    <Label htmlFor="toque_estruturado" className="cursor-pointer">Estruturado</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.acabamento?.toque && (
              <p className="text-sm text-red-500">{errors.acabamento.toque.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Textura</Label>
            <Textarea
              {...register("acabamento.textura")}
              placeholder="Descreva texturas especiais..."
              rows={3}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 6: CORES */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">6. Cores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Padrão de Cores *</Label>
            <Controller
              name="cores.tipo"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SOLIDAS" id="cor_solidas" />
                    <Label htmlFor="cor_solidas" className="cursor-pointer">Cores Sólidas (Padrão)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESTAMPADAS" id="cor_estampadas" />
                    <Label htmlFor="cor_estampadas" className="cursor-pointer">Estampadas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FANTASIA" id="cor_fantasia" />
                    <Label htmlFor="cor_fantasia" className="cursor-pointer">Fantasia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DESENVOLVIMENTO_EXCLUSIVO" id="cor_exclusivo" />
                    <Label htmlFor="cor_exclusivo" className="cursor-pointer">Desenvolvimento Exclusivo</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.cores?.tipo && (
              <p className="text-sm text-red-500">{errors.cores.tipo.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Paleta Preferencial</Label>
            <Input
              {...register("cores.paletaPreferencial")}
              placeholder="Ex: Tons pastel, cores frias..."
            />
          </div>

          <div className="space-y-3">
            <Label>Cores Específicas</Label>
            <Textarea
              {...register("cores.coresEspecificas")}
              placeholder="Liste as cores específicas..."
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Lavabilidade das Cores</Label>
            <Input
              {...register("cores.lavabilidadeCores")}
              placeholder="Ex: Resistente à lavação, solidez..."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* SEÇÃO 7: COMERCIAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">7. Comercial</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Target de Preço *</Label>
            <Controller
              name="comercial.targetPreco"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ECONOMICO" id="preco_economico" />
                    <Label htmlFor="preco_economico" className="cursor-pointer">Econômico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTERMEDIARIO" id="preco_intermediario" />
                    <Label htmlFor="preco_intermediario" className="cursor-pointer">Intermediário</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PREMIUM" id="preco_premium" />
                    <Label htmlFor="preco_premium" className="cursor-pointer">Premium</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.comercial?.targetPreco && (
              <p className="text-sm text-red-500">{errors.comercial.targetPreco.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Quantidade Estimada</Label>
            <Input
              {...register("comercial.quantidadeEstimada")}
              placeholder="Ex: 5.000 metros"
            />
          </div>

          <div className="space-y-3">
            <Label>Prazo de Entrega</Label>
            <Input
              {...register("comercial.prazoEntrega")}
              placeholder="Ex: 30 dias"
            />
          </div>

          <div className="space-y-3">
            <Label>Observações</Label>
            <Textarea
              {...register("comercial.observacoes")}
              placeholder="Outras informações relevantes..."
              rows={3}
            />
          </div>
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