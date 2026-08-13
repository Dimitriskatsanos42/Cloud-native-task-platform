# Multi-stage build keeps the final image small: build deps are not shipped.
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
# Non-root user - required by Phase 7 security SecurityContext
# (runAsNonRoot: true will refuse to start the container otherwise).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
USER appuser
EXPOSE 3000
CMD ["node", "src/index.js"]
