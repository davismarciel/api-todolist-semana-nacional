FROM node:20-bullseye AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

FROM node:20-bullseye AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm prisma generate
RUN pnpm run build

FROM node:20-bullseye AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --prod

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder   /app/dist         ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/package.json ./package.json
COPY --from=builder   /app/prisma       ./prisma
COPY --from=builder   /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder   /app/public       ./public
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/src/main"]
