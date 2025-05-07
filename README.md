# PharmaAI Project

This project consists of two main components:
1. A Python FastAPI backend (agent)
2. A Next.js frontend application (pharma_app)

## Deployment to Render.com

### Option 1: Deploy using the main render.yaml file

The easiest way to deploy both services is by using the Render Blueprint feature:

1. Fork or push this repository to GitHub
2. Create a new Render account if you don't have one already
3. Navigate to the Render dashboard and click "New" > "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the render.yaml file and create both services
6. Add the required environment variables when prompted:
   - For the agent:
     - `OPENAI_API_KEY` 
     - `GROQ_API_KEY` (if using Groq API)
     - `DATABASE_URL`
   - For the web app:
     - `DATABASE_URL` and `DIRECT_URL` (for Postgres/Prisma)
     - `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_WEBHOOK_SECRET` (for authentication)
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (for client-side auth)
     - `NEXTAUTH_URL` and `NEXTAUTH_SECRET` (for authentication)
     - `JWT_SECRET` (for token management)
     - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` (for payment integration)
7. Review and click "Apply" to start the deployment

### Option 2: Deploy services individually

You can also deploy each service separately:

#### Deploying the Agent (Python backend)

1. Navigate to the Render dashboard and click "New" > "Web Service"
2. Connect your GitHub account and select this repository
3. Configure the service:
   - Name: pharma-ai-agent
   - Root Directory: agent
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
4. Add the required environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`: https://api.groq.com/openai/v1
   - `GROQ_API_KEY` (if using Groq API)
   - `GROQ_BASE_URL`: https://api.groq.com/openai/v1
   - `LLM_MODEL`: llama3-8b-8192
   - `DATABASE_URL`
5. Click "Create Web Service"

#### Deploying the Web App (Next.js frontend)

1. Navigate to the Render dashboard and click "New" > "Web Service"
2. Connect your GitHub account and select this repository
3. Configure the service:
   - Name: pharma-ai-webapp
   - Root Directory: pharma_app
   - Runtime: Node
   - Build Command: `npm ci --legacy-peer-deps && npx prisma generate && npm run build`
   - Start Command: `npm start`
4. Add the required environment variables:
   - `NODE_ENV`: production
   - `NEXT_PHASE`: production
   - `PYTHON_API_URL`: URL of your agent service (e.g., https://pharma-ai-agent.onrender.com)
   - `NEXT_PUBLIC_API_URL`: Same as PYTHON_API_URL
   - `NEXTAUTH_URL`: URL where the web app will be hosted
   - `NEXTAUTH_SECRET`: Generate a random string
   - `JWT_SECRET`: Generate a random string for JWT token signing
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: /sign-in
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: /sign-up
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: /dashboard
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: /dashboard
   - `DATABASE_URL`
   - `DIRECT_URL` (for Prisma direct connection)
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
5. Click "Create Web Service"

## Local Development

### Running the Agent

```bash
cd agent
pip install -r requirements.txt
uvicorn api_server:app --reload
```

### Running the Web App

```bash
cd pharma_app
npm install --legacy-peer-deps
npx prisma generate
npm run dev
```

## Environment Variables

### Agent Environment Variables

Create a `.env` file in the `agent` directory with:

```
# OpenAI or Groq API credentials
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-8b-8192

# Database connection
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### Web App Environment Variables

Create a `.env` file in the `pharma_app` directory with:

```
# Node environment
NODE_ENV=development
NEXT_PHASE=development

# API connection
PYTHON_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication - JWT
JWT_SECRET=your_jwt_secret_key

# Authentication - Clerk
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://username:password@hostname:port/database
DIRECT_URL=postgresql://username:password@hostname:port/database

# Payment
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
``` 