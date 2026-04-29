# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Pass the Build ID argument from docker-compose
ARG NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID

COPY . .
RUN npm run build

# --- Stage 2: Run ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy what is strictly needed to run the app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]