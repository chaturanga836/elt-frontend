# 1. Base image
FROM node:22.13.1-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 2. Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 3. Builder - This is where the "Cooking" happens
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID

# MOVED: The build must happen here so the .next folder exists for the next stage
RUN npm run build

# 4. Runner - This is the "Service" stage (very lightweight)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Re-declare ARGs if needed for runtime, but usually only needed for build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the COMPILED code from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]