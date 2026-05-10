# --- Stage 1: Build ---
FROM node:20-alpine AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
# Use 'npm ci' for faster, more reliable builds in Docker
RUN npm ci

# Pass Build Arguments
ARG NEXT_PUBLIC_BUILD_ID
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during the build for a small speed boost
ENV NEXT_TELEMETRY_DISABLED 1

COPY . .
RUN npm run build

# --- Stage 2: Run ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security (Standard Senior Practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size 
# (Optional: can reduce image size by up to 80%)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]