import { type NextRequest, NextResponse } from "next/server"

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL || "https://n8n.aicrafterslab.com/webhook/996e3677-02f2-495f-b496-943ebcec3b24"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64File = Buffer.from(arrayBuffer).toString("base64")

    const payload = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      documentType: documentType,
      fileData: base64File,
      timestamp: new Date().toISOString(),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()

        if (response.status === 504) {
          return NextResponse.json(
            {
              success: true,
              message:
                "Fichier envoyé avec succès. Le traitement peut prendre quelques minutes pour les PDF volumineux.",
              warning: "timeout_but_processing",
            },
            { status: 200 },
          )
        }

        return NextResponse.json(
          { error: `Erreur n8n: ${response.status} - ${errorText}` },
          { status: response.status },
        )
      }

      const result = await response.text()
      return NextResponse.json({ success: true, data: result })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            success: true,
            message: "Fichier envoyé avec succès. Le traitement peut prendre quelques minutes pour les PDF volumineux.",
            warning: "timeout_but_processing",
          },
          { status: 200 },
        )
      }

      throw fetchError
    }
  } catch (error) {
    console.error("API Upload Error:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
