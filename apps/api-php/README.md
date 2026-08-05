# API PHP - Projeto Anjos Inocentes

API REST completa em **PHP 8.1+** com **MongoDB Atlas**, espelhando 100% dos endpoints da API TypeScript/Express.

## Requisitos

- PHP 8.1 ou superior
- Extensão `mongodb` do PHP (`pecl install mongodb`)
- Composer

## Instalação

```bash
cd apps/api-php

# Instalar dependências
composer install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do MongoDB Atlas
```

## Executar

```bash
# Servidor embutido do PHP na porta 4000
php -S localhost:4000 -t public public/index.php
```

## Estrutura de Arquivos

```
apps/api-php/
├── composer.json              # Dependências: mongodb, php-jwt, phpdotenv
├── .env.example               # Template de variáveis de ambiente
├── public/
│   └── index.php              # Front Controller (ponto de entrada)
└── src/
    ├── Core/
    │   ├── Auth.php            # Autenticação JWT, bcrypt, RBAC
    │   ├── AuditLog.php        # Serviço de log de auditoria
    │   ├── Database.php        # Conexão MongoDB Atlas + normalização
    │   ├── Response.php        # Helper de respostas JSON
    │   └── Router.php          # Roteador REST simples
    └── Routes/
        ├── health.php          # GET /health
        ├── auth.php            # POST /auth/login, /auth/register, GET /auth/me
        ├── students.php        # CRUD /students
        ├── classes.php         # CRUD /classes
        ├── users.php           # CRUD /users/teachers, perfil, senha
        ├── attendance.php      # GET/POST /attendance
        ├── courses.php         # CRUD /courses
        ├── lessons.php         # CRUD /lessons
        ├── events.php          # CRUD /events
        ├── announcements.php   # CRUD /announcements
        ├── grades.php          # CRUD /grades
        ├── stats.php           # GET /stats, /stats/students, /stats/reports
        └── audit.php           # GET /audit-logs
```

## Endpoints (Paridade total com a API TypeScript)

| Módulo          | Endpoint                           | Métodos                          |
| :-------------- | :--------------------------------- | :------------------------------- |
| Autenticação    | `/auth/login`, `/auth/register`, `/auth/me` | POST, POST, GET         |
| Alunos          | `/students`, `/students/:id`       | GET, POST, PUT, DELETE           |
| Turmas          | `/classes`, `/classes/:id`         | GET, POST, PUT, DELETE           |
| Equipe          | `/users/teachers`, `/users/teachers/:id` | GET, POST, PUT, DELETE     |
| Presença        | `/attendance`                      | GET, POST                        |
| Cursos          | `/courses`, `/courses/:id`         | GET, POST, PUT, DELETE           |
| Planos de Aula  | `/lessons`, `/lessons/:id`         | GET, POST, PUT, DELETE           |
| Eventos         | `/events`, `/events/:id`           | GET, POST, PUT, DELETE           |
| Comunicação     | `/announcements`, `/announcements/:id` | GET, POST, PUT, DELETE       |
| Notas           | `/grades`, `/grades/:id`           | GET, POST, PUT, DELETE           |
| Dashboard       | `/stats`, `/stats/students`, `/stats/reports` | GET                    |
| Auditoria       | `/audit-logs`                      | GET                              |
| Perfil          | `/users/profile`                   | PUT                              |
| Senha           | `/users/change-password`           | POST                             |
| Reset Senha     | `/users/teachers/:id/reset-password` | POST                           |

## Autenticação

Todas as rotas (exceto `/health`, `/auth/login` e `/auth/register`) exigem o header:

```
Authorization: Bearer <token_jwt>
```

## Banco de Dados

Conecta ao **mesmo MongoDB Atlas** da API TypeScript, compartilhando as coleções:
`users`, `students`, `classes`, `attendances`, `lessons`, `events`, `announcements`, `courses`, `grades`, `audit_logs`
