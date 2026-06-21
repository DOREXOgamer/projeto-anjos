# Projeto Anjos

Sistema de gestão escolar desenvolvido para facilitar a administração de instituições de ensino. O projeto é composto por uma API backend em Node.js com Express e o driver oficial do MongoDB, e um frontend em Next.js com interface moderna utilizando componentes Radix UI.

## Funcionalidades

### Autenticação e Autorização
- Login e registro de usuários
- Sistema de permissões baseado em roles (Diretor, Professor)
- Controle de acesso baseado em permissões específicas

### Gestão de Alunos
- Cadastro e gerenciamento de alunos
- Informações pessoais (nome, email, telefone, CPF, data de nascimento, endereço)

### Gestão de Turmas
- Criação e administração de turmas
- Definição de cursos, horários, salas e capacidade
- Controle de status (Ativa/Inativa)

### Controle de Presença
- Registro de presença por aluno e turma
- Histórico de presenças por data

### Plano de Aula
- Criação de planos de aula por turma
- Definição de assuntos e conteúdos
- Notas adicionais

### Calendário
- Eventos escolares (aulas, eventos, feriados, reuniões)
- Visualização por data

### Anúncios
- Sistema de comunicados para a comunidade escolar
- Autoria e data de publicação

### Relatórios
- Acesso restrito para diretores
- Relatórios administrativos

## Tecnologias Utilizadas

### Backend (API)
- **Node.js** com **Express.js**
- **TypeScript**
- **Driver MongoDB Nativo** (`mongodb`) para persistência
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Zod** para validação de dados
- **CORS** para controle de acesso

### Frontend (Web)
- **Next.js 16** com App Router
- **TypeScript**
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **shadcn/ui** para sistema de design
- **React Hook Form** com resolvers Zod
- **Lucide React** para ícones
- **next-themes** para suporte a temas

### Banco de Dados
- **MongoDB** (Atlas ou Local)

### Ferramentas de Desenvolvimento
- **tsx** para execução TypeScript
- **ESLint** para linting
- **PostCSS** e **Autoprefixer** para CSS

## Estrutura do Projeto

```
projeto-anjos/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── lib/         # Utilitários e conexão com BD
│   │   │   ├── middleware/  # Middlewares de autenticação
│   │   │   ├── routes/      # Rotas da API
│   │   │   └── scripts/     # Scripts adicionais (seed)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # Frontend Next.js
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── public/
│       └── styles/
├── package.json             # Configuração do monorepo
└── README.md
```

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MongoDB (Atlas na nuvem ou instância local)
- npm ou pnpm

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd projeto-anjos
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   - **Opção Local (Recomendado via Docker):** Suba um banco MongoDB local executando o seguinte comando na raiz do projeto:
     ```bash
     docker compose up -d
     ```
     Depois, configure a variável de ambiente `DATABASE_URL` no arquivo `apps/api/.env` para:
     `DATABASE_URL="mongodb://localhost:27017/projeto_anjos"`
   - **Opção Nuvem (Atlas):** Configure a variável `DATABASE_URL` com a string de conexão fornecida pelo MongoDB Atlas (lembre-se de liberar o IP de desenvolvimento no painel do Atlas).

4. **Crie o usuário administrador**
   ```bash
   npm run seed:admin
   ```

## Executando o Projeto

### Desenvolvimento
```bash
# Executa tanto API quanto Web em modo desenvolvimento
npm run dev

# Ou execute separadamente:
npm run dev:api    # API em http://localhost:4000
npm run dev:web    # Web em http://localhost:3000
```

### Produção
```bash
npm run build
npm run start
```

## Scripts Disponíveis

- `npm run dev` - Executa o frontend e o backend simultaneamente em modo desenvolvimento
- `npm run dev:web` - Executa apenas o frontend
- `npm run dev:api` - Executa apenas a API
- `npm run build` - Build do frontend para produção
- `npm run start` - Executa o frontend em produção
- `npm run lint` - Executa o linter no frontend
- `npm run seed:admin` - Cria o usuário administrador padrão no MongoDB

## Estrutura da API

### Endpoints Principais

- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login
- `GET /auth/me` - Informações do usuário logado
- `GET /users/teachers` - Lista professores (Diretor)
- `POST /users/teachers` - Cria professor (Diretor)
- `GET /announcements` - Lista anúncios
- `POST /announcements` - Cria anúncio (Diretor)

## Permissões

O sistema utiliza um sistema de permissões granular:

- **ALUNOS**: Gerenciar alunos
- **TURMAS**: Gerenciar turmas
- **PRESENCA**: Controlar presenças
- **PLANO_AULA**: Gerenciar planos de aula
- **CALENDARIO**: Gerenciar calendário

Diretores têm acesso completo, enquanto professores têm permissões específicas.

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.
