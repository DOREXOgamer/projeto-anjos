"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, ArrowLeft } from "lucide-react"

export default function NotasPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard")
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 bg-card/50 text-center">
        <CardContent className="p-8 space-y-4">
          <div className="p-4 rounded-full bg-muted/60 w-16 h-16 mx-auto flex items-center justify-center text-muted-foreground">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Módulo Desativado</h2>
          <p className="text-sm text-muted-foreground">
            O módulo de Notas foi removido do sistema conforme solicitação. Você será redirecionado para o Dashboard em instantes.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mt-4 border-border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
