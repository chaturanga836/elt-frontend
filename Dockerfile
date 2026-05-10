# --- Stage 1: Build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Update NPM inside the container first
RUN npm install -g npm@10.8.2

# 2. Copy the files
COPY package.json package-lock.json ./

# 3. Try npm ci again (it will work now with updated npm)
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