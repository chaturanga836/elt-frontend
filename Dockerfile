# 1. Base image with shared environment
FROM node:22.13.1-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 2. Dependencies - Only re-run if package.json or lockfile changes
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# Use BuildKit cache for npm to speed up downloads
RUN npm ci --legacy-peer-deps

# 3. Builder - Optimized for Next.js caching
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .

# ARGs must be declared in the stage they are used
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID

# Use BuildKit cache for the .next/cache directory. 
# This is the single biggest time-saver for Next.js builds.
RUN npm ci --legacy-peer-deps

# 4. Runner - Minimal footprint
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Re-declare for runtime visibility
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]