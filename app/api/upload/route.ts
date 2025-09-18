import { type NextRequest, NextResponse } from "next/server"

const ENDPOINTS = {
  test: "https://n8n.aicrafterslab.com/webhook-test/996e3677-02f2-495f-b496-943ebcec3b24",
  production: "https://n8n.aicrafterslab.com/webhook/996e3677-02f2-495f-b496-943ebcec3b24",
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const environment = url.searchParams.get("environment") as "test" | "production"

    if (!environment || !ENDPOINTS[environment]) {
      return NextResponse.json({ error: "Environment invalide" }, { status: 400 })
    }

    const response = await fetch(ENDPOINTS[environment], {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Erreur n8n: ${response.status} - ${errorText}` }, { status: response.status })
    }

    const result = await response.text()
    return NextResponse.json({ success: true, data: result, message: "Test de connectivité réussi" })
  } catch (error) {
    console.error("API Test Error:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const environment = formData.get("environment") as "test" | "production"

    if (!environment || !ENDPOINTS[environment]) {
      return NextResponse.json({ error: "Environment invalide" }, { status: 400 })
    }

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

    const response = await fetch(ENDPOINTS[environment], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Erreur n8n: ${response.status} - ${errorText}` }, { status: response.status })
    }

    const result = await response.text()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("API Upload Error:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
