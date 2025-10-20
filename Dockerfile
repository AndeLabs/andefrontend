# =============================================================================
# AndeChain Frontend - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Supports Next.js 15 with Turbopack and production optimizations

# =============================================================================
# STAGE 1: Base Dependencies
# =============================================================================
FROM node:20-alpine AS base

# Install system dependencies and build tools
RUN apk add --no-cache libc6-compat curl python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# =============================================================================
# STAGE 2: Dependencies Installation  
# =============================================================================
FROM base AS deps

# Install dependencies with npm ci for faster, reliable builds
# Skip prepare scripts (husky) in Docker build
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# =============================================================================
# STAGE 3: Build Stage
# =============================================================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true

# Build the application
ENV HUSKY=0
RUN npm run build

# =============================================================================
# STAGE 4: Production Runtime
# =============================================================================
FROM node:20-alpine AS production

# Install runtime dependencies only (no build tools needed)
RUN apk add --no-cache wget dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy package.json for metadata
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# =============================================================================
# STAGE 5: Development (Optional - for local development)
# =============================================================================
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose dev port
EXPOSE 3000
EXPOSE 9002

# Set development environment
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]

# =============================================================================
# Build Arguments and Labels
# =============================================================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=0.1.0

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="AndeChain Frontend" \
      org.label-schema.description="Next.js frontend for AndeChain dApp" \
      org.label-schema.url="https://andechain.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/andelabs/andechain" \
      org.label-schema.vendor="Ande Labs" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"

# =============================================================================
# Usage Examples:
# =============================================================================
#
# Build for production:
# docker build --target production -t andechain-frontend:latest .
#
# Build for development:
# docker build --target development -t andechain-frontend:dev .
#
# Run production:
# docker run -p 3002:3000 \
#   -e NEXT_PUBLIC_RPC_URL=http://localhost:8545 \
#   -e NEXT_PUBLIC_CHAIN_ID=2019 \
#   andechain-frontend:latest
#
# Run development:
# docker run -p 3002:3000 -v $(pwd):/app andechain-frontend:dev
#