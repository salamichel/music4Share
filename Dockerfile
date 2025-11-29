# Multi-stage build for Music4Share
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm install

# Copy frontend source
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js postcss.config.js ./

# Build React app
RUN npm run build

# Stage 2: Setup backend server
FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/build ../build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start server (serves both API and React app)
CMD ["npm", "start"]
