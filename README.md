# Sleep & Fitness Tracker

Uma aplicação web SaaS para rastreamento de sono, fitness, nutrição e metas. Desenvolvida para usuários e treinadores monitorarem atividades diárias e desempenho.

## Funcionalidades

- Cadastro e autenticação de usuários
- Painel administrativo
- Rastreamento de sono com relatórios
- Definição e acompanhamento de metas
- Registro de nutrição com dicas
- Rastreamento de treinos (futsal, musculação, corrida, etc.)
- Análises e relatórios

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL com TypeORM
- **Autenticação:** JWT
- **Containerização:** Docker

## Configuração

1. Clone o repositório
2. Instale as dependências do frontend e backend
3. Inicie o PostgreSQL com Docker Compose
4. Execute o backend e frontend

## Primeiros Passos

### Pré-requisitos

- Node.js
- Docker

### Instalação

1. `cd frontend && npm install`
2. `cd ../backend && npm install`
3. `docker-compose up -d` para iniciar o PostgreSQL
4. `cd backend && npm run dev` para iniciar o backend
5. `cd frontend && npm run dev` para iniciar o frontend

## Contribuição

Use GitHub para controle de versão.