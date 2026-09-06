export type PontoRota = {
  id: number
  latitude: number
  longitude: number
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const raio = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const latA = (a.latitude * Math.PI) / 180
  const latB = (b.latitude * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) ** 2
  return 2 * raio * Math.asin(Math.sqrt(h))
}

export function calcularTrajeto(pontos: PontoRota[]) {
  const kmEntrePontos: number[] = []
  let totalKm = 0
  for (let i = 1; i < pontos.length; i++) {
    const km = haversineKm(pontos[i - 1], pontos[i])
    kmEntrePontos.push(km)
    totalKm += km
  }
  return { kmEntrePontos, totalKm }
}