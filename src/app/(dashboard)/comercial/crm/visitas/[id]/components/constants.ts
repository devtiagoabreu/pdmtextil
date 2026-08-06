export const TIPO_OPTIONS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "TELEFONE", label: "Telefone" },
]

export const TIPO_LABELS: Record<string, string> = Object.fromEntries(
  TIPO_OPTIONS.map((o: any) => [o.value, o.label]),
)

export const STATUS_OPTIONS = ["AGENDADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"]
