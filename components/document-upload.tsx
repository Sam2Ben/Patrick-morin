"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, FileSpreadsheet, Loader2, CheckCircle, XCircle, Wifi } from "lucide-react"

type Environment = "test" | "production"
type DocumentType = "facture" | "bon de reception"
type UploadStatus = "idle" | "uploading" | "success" | "error"
type TestStatus = "idle" | "testing" | "success" | "error"

interface FileInfo {
  file: File
  name: string
  size: number
  type: DocumentType
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

export default function DocumentUpload() {
  const [environment, setEnvironment] = useState<Environment>("test")
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>("idle")
  const [testMessage, setTestMessage] = useState("")

  const getDocumentType = (fileName: string): DocumentType | null => {
    const extension = fileName.toLowerCase().split(".").pop()
    if (extension === "pdf") return "facture"
    if (extension === "xlsx") return "bon de reception"
    return null
  }

  const validateFile = (file: File): string | null => {
    const docType = getDocumentType(file.name)
    if (!docType) {
      return "Type de fichier non autorisé. Seuls les fichiers PDF et XLSX sont acceptés."
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Le fichier est trop volumineux. Taille maximale : 15 Mo."
    }
    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setStatusMessage(error)
      setUploadStatus("error")
      setSelectedFile(null)
      return
    }

    const docType = getDocumentType(file.name)!
    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      type: docType,
    })
    setUploadStatus("idle")
    setStatusMessage("")
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 1) {
        setStatusMessage("Un seul fichier à la fois.")
        setUploadStatus("error")
        return
      }

      if (files.length === 1) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadStatus("uploading")
    setStatusMessage("Envoi en cours...")

    const formData = new FormData()
    formData.append("file", selectedFile.file)
    formData.append("documentType", selectedFile.type)
    formData.append("environment", environment)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUploadStatus("success")
        const isMatchFound = Math.random() > 0.5 // Simulation
        if (isMatchFound) {
          setStatusMessage(
            "Traitement en cours. Si le document correspondant est déjà présent, vous recevrez un email sous peu.",
          )
        } else {
          setStatusMessage(
            "Document enregistré. Déposez le document correspondant (facture ou bon de réception) pour recevoir l'email de rapprochement.",
          )
        }
      } else {
        throw new Error(result.error || "Erreur inconnue")
      }
    } catch (error) {
      setUploadStatus("error")
      setStatusMessage(`Impossible d'envoyer le fichier: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  const handleTestConnectivity = async () => {
    setTestStatus("testing")
    setTestMessage("Test de connectivité en cours...")

    try {
      const response = await fetch(`/api/upload?environment=${environment}`, {
        method: "GET",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTestStatus("success")
        setTestMessage(`Connectivité ${environment} : OK`)
      } else {
        throw new Error(result.error || "Erreur de connectivité")
      }
    } catch (error) {
      setTestStatus("error")
      setTestMessage(`Erreur de connectivité : ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadStatus("idle")
    setStatusMessage("")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-card-foreground text-center">Déposer un document</CardTitle>
          <div className="text-center space-y-1 text-muted-foreground">
            <p>PDF = Facture, XLSX = Bon de réception.</p>
            <p>Un seul fichier à la fois (max 15 Mo).</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Environment Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-card-foreground">Environnement</Label>
            <RadioGroup
              value={environment}
              onValueChange={(value) => setEnvironment(value as Environment)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="test" id="test" />
                <Label htmlFor="test">Test</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production">Production</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Test Connectivity Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleTestConnectivity}
              disabled={testStatus === "testing"}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              {testStatus === "testing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Tester la connectivité
                </>
              )}
            </Button>
          </div>

          {/* Test Status Message */}
          {testMessage && (
            <Alert
              className={
                testStatus === "error" ? "border-destructive" : testStatus === "success" ? "border-green-500" : ""
              }
            >
              <div className="flex items-center gap-2">
                {testStatus === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                {testStatus === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                <AlertDescription
                  className={
                    testStatus === "error" ? "text-destructive" : testStatus === "success" ? "text-green-600" : ""
                  }
                >
                  {testMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-card-foreground">Glissez-déposez votre fichier ici</p>
              <p className="text-muted-foreground">ou</p>
              <Button variant="outline" asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Choisir un fichier
                </label>
              </Button>
              <input id="file-input" type="file" accept=".pdf,.xlsx" onChange={handleFileInput} className="hidden" />
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                {selectedFile.type === "facture" ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-green-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">Type détecté :</span>
                <span className="text-sm text-primary font-medium">
                  {selectedFile.type === "facture" ? "Facture" : "Bon de réception"}
                </span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === "uploading"}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {uploadStatus === "uploading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              "Traiter"
            )}
          </Button>

          {/* Status Messages */}
          {statusMessage && (
            <Alert
              className={
                uploadStatus === "error" ? "border-destructive" : uploadStatus === "success" ? "border-secondary" : ""
              }
            >
              <div className="flex items-center gap-2">
                {uploadStatus === "success" && <CheckCircle className="h-4 w-4 text-secondary" />}
                {uploadStatus === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                <AlertDescription
                  className={
                    uploadStatus === "error" ? "text-destructive" : uploadStatus === "success" ? "text-secondary" : ""
                  }
                >
                  {statusMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Reset Button */}
          {uploadStatus === "success" && (
            <Button onClick={resetUpload} variant="outline" className="w-full bg-transparent">
              Déposer un autre document
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
