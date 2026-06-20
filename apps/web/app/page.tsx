"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Mail, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (!email || !senha) {
      setErro("Preencha todos os campos")
      return
    }

    if (!email.includes("@")) {
      setErro("E-mail inválido")
      return
    }

    setLoading(true)

    try {
      await login(email, senha)
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Credenciais inválidas. Tente novamente."
      setErro(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Projeto Anjos Inocentes"
              width={180}
              height={180}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse o sistema de gestão acadêmica
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading || authLoading}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10"
                    disabled={loading || authLoading}
                  />
                </div>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading || authLoading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                onClick={() => alert("Funcionalidade de recuperação de senha em desenvolvimento")}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
