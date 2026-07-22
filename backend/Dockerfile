FROM node:22-alpine AS builder
WORKDIR /app
# Tanpa ini Prisma gagal deteksi versi openssl, fallback ke 1.1.x, dan
# men-download engine linux-musl yang linking ke libssl.so.1.1 (nggak ada di Alpine).
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
# Runner butuh libssl.so.3 juga — engine di-dlopen saat runtime, bukan saat build.
RUN apk add --no-cache openssl
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
# Migrations and seeding are separate one-shot compose services (profile
# "tools"). Booting them here meant a bad migration crash-looped the API, and
# the seed — which truncates every table — ran on every single restart.
CMD ["node", "dist/main.js"]
