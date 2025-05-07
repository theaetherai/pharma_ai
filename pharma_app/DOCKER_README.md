# PharmaAI Containerized Application

This document provides instructions for running the complete PharmaAI application stack using Docker.

## Architecture

The PharmaAI application consists of three main services:
1. **Next.js Frontend** - The user interface for PharmaAI
2. **Python API Backend** - FastAPI server that runs the AI agent for diagnosis
3. **PostgreSQL Database** - Stores user data, medical history, etc.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/pharmaai

# Clerk Authentication (if using Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Python API (GROQ API key for the AI agent)
GROQ_API_KEY=your_groq_api_key

# Other environment variables as needed
```

## Building and Running with Docker Compose

1. Build and start all containers:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Python API on port 8000
- Next.js application on port 3000

2. Initialize the database (first time only):

```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

3. Access the applications:
   - Frontend: http://localhost:3000
   - API documentation: http://localhost:8000/docs

## Service Communication

The services communicate with each other as follows:
- Next.js frontend → Python API: via HTTP requests to `http://api:8000`
- Next.js frontend → Database: via Prisma client
- Python API → Database: via direct database connection (if needed)

## Stopping the Containers

```bash
docker-compose down
```

To remove volumes when stopping:

```bash
docker-compose down -v
```

## Rebuilding Services

If you make changes to the code and need to rebuild:

```bash
# Rebuild all services
docker-compose build

# Rebuild a specific service
docker-compose build api
docker-compose build app

# Restart after rebuilding
docker-compose up -d
```

## Viewing Logs

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f api
docker-compose logs -f app
docker-compose logs -f db
```

## Troubleshooting

- If the API can't connect to the Groq API, ensure your GROQ_API_KEY is valid and properly set in the .env file.
- If the Next.js app can't connect to the API, check that the Python API is running and the PYTHON_API_URL is set correctly.
- For database issues, try running migrations manually:
  ```bash
  docker-compose exec app npx prisma migrate deploy
  ```
- To access the database directly:
  ```bash
  docker-compose exec db psql -U postgres -d pharmaai
  ``` 