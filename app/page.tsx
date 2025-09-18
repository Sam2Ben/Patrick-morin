import DocumentUpload from "@/components/document-upload"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold text-card-foreground">Upload de documents</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <DocumentUpload />
      </main>
    </div>
  )
}
