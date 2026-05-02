"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, Link as LinkIcon, X, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface AnexoDraft {
  id: string
  file?: File
  link?: string
  tipo: string
  nome: string
}

interface AnexosUploadProps {
  anexos: AnexoDraft[]
  onChange: (anexos: AnexoDraft[]) => void
}

export function AnexosUpload({ anexos, onChange }: AnexosUploadProps) {
  const [linkInput, setLinkInput] = useState("")
  const [linkNome, setLinkNome] = useState("")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newAnexos = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      tipo: "ARQUIVO",
      nome: file.name,
    }))
    onChange([...anexos, ...newAnexos])
  }, [anexos, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleAddLink = () => {
    if (!linkInput) return
    const newAnexo: AnexoDraft = {
      id: Math.random().toString(36).substr(2, 9),
      link: linkInput,
      tipo: "LINK",
      nome: linkNome || "Link Externo",
    }
    onChange([...anexos, newAnexo])
    setLinkInput("")
    setLinkNome("")
  }

  const handleRemove = (id: string) => {
    onChange(anexos.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-sm text-muted-foreground mt-1">Imagens, PDFs, documentos (Máx 10MB)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-2 md:col-span-1">
          <Label>Nome do Link</Label>
          <Input 
            placeholder="Ex: Referência Pinterest" 
            value={linkNome} 
            onChange={(e) => setLinkNome(e.target.value)} 
          />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label>URL do Link</Label>
          <Input 
            placeholder="https://..." 
            value={linkInput} 
            onChange={(e) => setLinkInput(e.target.value)} 
          />
        </div>
        <div className="md:col-span-1">
          <Button type="button" variant="secondary" className="w-full" onClick={handleAddLink}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Adicionar Link
          </Button>
        </div>
      </div>

      {anexos.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="font-medium text-sm text-muted-foreground">Anexos Selecionados</h3>
          <ul className="space-y-2">
            {anexos.map((anexo) => (
              <li key={anexo.id} className="flex items-center justify-between p-3 bg-background border rounded-md">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {anexo.tipo === "LINK" ? (
                    <LinkIcon className="h-5 w-5 text-blue-500 shrink-0" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-orange-500 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{anexo.nome}</p>
                    {anexo.tipo === "LINK" && (
                      <p className="text-xs text-muted-foreground truncate">{anexo.link}</p>
                    )}
                    {anexo.file && (
                      <p className="text-xs text-muted-foreground">{(anexo.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(anexo.id)} className="text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
