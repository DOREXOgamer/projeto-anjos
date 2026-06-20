"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"

export function AccessDenied() {
  const router = useRouter()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle>403 - Acesso negado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button onClick={() => router.push("/dashboard")}>Ir para Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
