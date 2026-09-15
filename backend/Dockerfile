FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs package*.json ./
COPY --chown=nodeuser:nodejs src ./src
COPY --chown=nodeuser:nodejs .eslintrc.js ./
COPY --chown=nodeuser:nodejs jest.config.js ./

RUN mkdir -p uploads logs && chown -R nodeuser:nodejs uploads logs

USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
