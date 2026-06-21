# Projeto Anjos

Sistema de gestão escolar desenvolvido para facilitar a administração de instituições de ensino. O projeto é composto por uma API backend em Node.js com Express e o driver oficial do MongoDB, e um frontend em Next.js com interface moderna utilizando componentes Radix UI e Tailwind CSS.

## Funcionalidades

### Autenticação, Cargos e Permissões
- Login e autenticação segura via JWT
- Cargos estruturados com permissões predefinidas:
  - **ADMIN** (Administrador): Super-usuário com controle total, livre de restrições de permissão.
  - **DIRECTOR** (Diretor): Acesso completo de gestão.
  - **COORDINATOR** (Coordenador): Gerenciamento pedagógico de alunos, turmas e notas.
  - **SECRETARY** (Secretário): Gestão de alunos, turmas e comunicados.
  - **TEACHER** (Professor): Lançamento de notas, presenças, planos de aula e calendário.
- As permissões associadas a cada cargo são:
  - `alunos`: Cadastrar e gerenciar alunos.
  - `turmas`: Criar e gerenciar turmas.
  - `presenca`: Registrar chamadas e presenças.
  - `plano_aula`: Planejar aulas por turma.
  - `calendario`: Visualizar e gerenciar eventos no calendário.
  - `comunicacao`: Gerenciar avisos e comunicados.
  - `notas`: Lançar e gerenciar notas.

### Gestão de Equipe (Colaboradores)
- Cadastro completo de colaboradores (professores, coordenadores, secretários e diretores) contendo:
  - Nome, E-mail e Cargo
  - CPF, Telefone, Data de Nascimento e Endereço
- Histórico completo de colaboradores ativos e inativos
- Exportação da lista de colaboradores para CSV com todos os dados pessoais inclusos

### Gestão de Alunos
- Cadastro completo de alunos (Nome, CPF, Data de Nascimento, Email, Telefone, Endereço e Curso)
- Matrícula em múltiplas turmas
- Importação em massa de alunos via planilha CSV

### Gestão de Turmas
- Criação e administração de turmas ligadas a cursos, horários, salas, capacidade e professor responsável
- Indicação de turmas sem professor associado para rápida alocação

### Auditoria e Segurança
- Histórico de auditoria completo para administradores e diretores
- Registro cronológico de ações sensíveis (criar, atualizar, excluir registros ou redefinir senhas)

---

## Tecnologias Utilizadas

### Backend (API)
- **Node.js** com **Express.js** e **TypeScript**
- **Driver MongoDB Nativo** (`mongodb`) para persistência de dados
- **JWT** para autenticação e **bcryptjs** para hashing de senhas
- **Zod** para validação robusta de esquemas de dados

### Frontend (Web)
- **Next.js 16** com App Router e **TypeScript**
- **Tailwind CSS** para estilização flexível e moderna
- **Radix UI** para componentes acessíveis e elegantes
- **Recharts** para relatórios e estatísticas da equipe
- **React Hook Form** e **Zod** para validação de formulários

---

## Estrutura do Projeto

```
projeto-anjos/
├── apps/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── lib/         # Conexão com BD, auditoria e utilitários
│   │   │   ├── middleware/  # Autenticação e controle de acesso
│   │   │   ├── routes/      # Rotas da API (usuários, turmas, notas, etc.)
│   │   │   └── scripts/     # Scripts adicionais (seed)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # Frontend Next.js
│       ├── app/             # Rotas do Next.js (dashboard, equipe, etc.)
│       ├── components/      # Componentes UI reusáveis
│       ├── lib/             # API client, permissões e autenticação
│       └── styles/          # Estilos globais
├── package.json             # Configuração do monorepo
└── README.md
```

---

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MongoDB instalado localmente ou instância no MongoDB Atlas

### Instalação

1. **Clone o repositório e acesse a pasta**
   ```bash
   git clone <url-do-repositorio>
   cd projeto-anjos
   ```

2. **Instale as dependências gerais do monorepo**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente**
   - No diretório `apps/api`, crie um arquivo `.env` com a seguinte configuração:
     ```env
     PORT=4000
     DATABASE_URL="mongodb://localhost:27017/projeto_anjos"
     JWT_SECRET="sua_chave_secreta_jwt"
     ```

4. **Popular Banco com Administrador Padrão (Seed)**
   Execute o script para criar o super-administrador padrão (`admin@anjosinocentes.org.br` / senha: `admin123`):
   ```bash
   npm run seed:admin
   ```

---

## Executando o Projeto

### Modo de Desenvolvimento
```bash
# Inicia a API e a aplicação Web simultaneamente
npm run dev

# Para executar apenas uma parte específica:
npm run dev:api    # API rodando em http://localhost:4000
npm run dev:web    # Web rodando em http://localhost:3000
```

### Produção
```bash
npm run build
npm run start
```

---

## Licença
Este projeto está sob a licença MIT.
