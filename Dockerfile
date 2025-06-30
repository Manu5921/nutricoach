# Coolify Dockerfile - Optimisé pour build
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies nécessaires
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files pour layer caching
COPY package*.json ./

# Install ALL dependencies (dev needed for build)
RUN npm ci --include=dev && npm cache clean --force

# Copy source code
COPY . .

# Set environment variables par défaut
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe fallbacks pour build
ENV STRIPE_SECRET_KEY=sk_test_build_fallback
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_build_fallback
ENV STRIPE_WEBHOOK_SECRET=whsec_build_fallback
ENV STRIPE_PRICE_MONTHLY=price_build_fallback

# Skip validations pour build
ENV SKIP_ENV_VALIDATION=true

# Build the application avec variables par défaut
RUN npm run build

# Remove dev dependencies après build
RUN npm ci --omit=dev && npm cache clean --force

# Create non-root user pour sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
