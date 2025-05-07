FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# First install the specific missing dependencies
RUN npm install --legacy-peer-deps jspdf jspdf-autotable p-retry node-cache idb html2canvas

# Then install all other dependencies
RUN npm ci --legacy-peer-deps --ignore-engines

# Fix Paystack version compatibility issue
RUN npm uninstall react-paystack && npm install react-paystack@2.0.3 --save --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma client
RUN npx prisma generate

# Create dummy .env file with DATABASE_URL for build only
RUN echo "DATABASE_URL=\"postgresql://dummy:dummy@localhost:5432/dummy?schema=public\"" > .env

# Build the Next.js application with the --no-lint flag
RUN npm run build -- --no-lint

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"] 