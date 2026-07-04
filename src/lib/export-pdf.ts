import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

type ExportPdfOptions = {
  element: HTMLElement
  filename: string
  onProgress?: (current: number, total: number) => void
}

export async function exportElementToPdf({ element, filename, onProgress }: ExportPdfOptions) {
  const elementHeight = element.scrollHeight
  const elementWidth = element.scrollWidth

  const pdf = new jsPDF("p", "mm", "a4")
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  const scale = 2
  const canvasWidth = pdfWidth * (96 / 25.4)
  const canvasHeight = pdfHeight * (96 / 25.4)

  const totalPages = Math.ceil(elementHeight / canvasHeight)

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    onProgress?.(page + 1, totalPages)

    const canvas = await html2canvas(element, {
      scale,
      width: elementWidth,
      height: canvasHeight,
      y: page * canvasHeight,
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
  }

  pdf.save(filename)
}
