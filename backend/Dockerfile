# ── Build stage ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Prisma's query/schema engines need OpenSSL (libssl) present on Alpine.
RUN apk add --no-cache openssl libc6-compat

# Install deps (cached unless lockfile changes).
COPY package*.json ./
RUN npm ci

# Generate Prisma client + compile TypeScript.
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for a lean runtime node_modules.
RUN npm prune --omit=dev

# ── Runtime stage ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma engines need OpenSSL (libssl) at runtime too.
RUN apk add --no-cache openssl libc6-compat

# argon2 is a native addon — its prebuilt binary is carried in node_modules.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Local media storage mount point, owned by the non-root runtime user.
RUN mkdir -p /app/uploads && chown -R node:node /app

# Drop root privileges.
USER node

EXPOSE 4000

CMD ["node", "dist/main"]
