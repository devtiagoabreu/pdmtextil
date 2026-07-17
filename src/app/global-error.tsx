"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Algo deu errado
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
