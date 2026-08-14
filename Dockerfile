# ============================================
# 本番用 Dockerfile（マルチステージビルド）
# Vercelを使わず、自前サーバー/コンテナで動かしたい場合に使う。
# Vercelでデプロイするなら、このファイルは使わない。
# ============================================

# --- ステージ1: 依存インストール ---
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# --- ステージ2: ビルド ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# standalone出力を有効にするため next.config で output:'standalone' が必要
RUN npm run build

# --- ステージ3: 実行 ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone出力をコピー（最小限のファイルだけで動く）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
