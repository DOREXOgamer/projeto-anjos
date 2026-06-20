"use client"

import { useState } from "react"
import { 
  HelpCircle, 
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ExternalLink,
  PlayCircle,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
  {
    pergunta: "Como cadastrar um novo aluno?",
    resposta: "Para cadastrar um novo aluno, acesse o menu 'Alunos' no painel lateral, clique no botão 'Novo Aluno' e preencha o formulário com os dados do aluno. Certifique-se de preencher todos os campos obrigatórios antes de salvar."
  },
  {
    pergunta: "Como registrar a presença dos alunos?",
    resposta: "Acesse o menu 'Presença', selecione a data e a turma desejada. Uma lista de alunos será exibida onde você pode marcar cada aluno como presente ou ausente clicando no toggle correspondente."
  },
  {
    pergunta: "Como criar um plano de aula?",
    resposta: "No menu 'Plano de Aula', clique em 'Novo Plano'. Preencha a data, turma, disciplina, conteúdo programático e observações. O plano ficará salvo e poderá ser editado ou excluído posteriormente."
  },
  {
    pergunta: "Como visualizar relatórios?",
    resposta: "Acesse o menu 'Relatórios' para ver gráficos de presença, matrículas e distribuição por curso. Você também pode exportar relatórios em PDF ou Excel clicando nos botões correspondentes."
  },
  {
    pergunta: "Como gerenciar turmas?",
    resposta: "No menu 'Turmas', você pode criar, editar e excluir turmas. Cada turma possui informações como nome, curso, horário, professor responsável, capacidade e sala."
  },
  {
    pergunta: "Como usar o calendário?",
    resposta: "O calendário permite visualizar e gerenciar eventos, aulas e reuniões. Clique em uma data para ver os eventos do dia ou clique em 'Novo Evento' para adicionar um novo compromisso."
  },
  {
    pergunta: "Como alterar minha senha?",
    resposta: "Acesse 'Configurações' > 'Perfil' e role até a seção 'Segurança'. Digite sua senha atual e a nova senha desejada, depois clique em 'Alterar Senha'."
  },
  {
    pergunta: "O sistema funciona offline?",
    resposta: "Não, o sistema requer conexão com a internet para funcionar corretamente. Todas as informações são sincronizadas em tempo real com o servidor."
  },
]

const guiasRapidos = [
  {
    titulo: "Primeiros Passos",
    descricao: "Aprenda o básico do sistema",
    icon: Book,
    link: "#"
  },
  {
    titulo: "Vídeos Tutoriais",
    descricao: "Assista demonstrações em vídeo",
    icon: PlayCircle,
    link: "#"
  },
  {
    titulo: "Manual Completo",
    descricao: "Documentação detalhada",
    icon: FileText,
    link: "#"
  },
]

export default function AjudaPage() {
  const [busca, setBusca] = useState('')

  const faqFiltrado = faqItems.filter(item =>
    item.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
    item.resposta.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
        <p className="text-muted-foreground mt-2">
          Encontre respostas para suas dúvidas ou entre em contato conosco
        </p>
      </div>

      {/* Busca */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nas perguntas frequentes..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Guias Rápidos */}
      <div className="grid sm:grid-cols-3 gap-4">
        {guiasRapidos.map((guia) => {
          const Icon = guia.icon
          return (
            <Card key={guia.titulo} className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{guia.titulo}</h3>
                <p className="text-sm text-muted-foreground">{guia.descricao}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
          <CardDescription>
            {busca ? `${faqFiltrado.length} resultado(s) encontrado(s)` : 'As dúvidas mais comuns dos usuários'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faqFiltrado.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma pergunta encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos ou entre em contato conosco
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqFiltrado.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.pergunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.resposta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Contato */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Suporte Online
            </CardTitle>
            <CardDescription>
              Tire suas dúvidas em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nossa equipe de suporte está disponível de segunda a sexta, das 8h às 18h.
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90">
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar Conversa
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outros Canais</CardTitle>
            <CardDescription>
              Entre em contato por e-mail ou telefone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">E-mail</p>
                <p className="text-sm text-muted-foreground">suporte@anjosinocentes.org.br</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">(11) 1234-5678</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Não encontrou o que procurava?</h3>
              <p className="text-sm text-muted-foreground">
                Envie sua sugestão ou dúvida e ajude-nos a melhorar o sistema
              </p>
            </div>
            <Button variant="outline">
              Enviar Feedback
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
