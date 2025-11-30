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

# Accept build arguments for Firebase config
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_GEMINI_API_KEY

# Set environment variables for build
ENV REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY
ENV REACT_APP_FIREBASE_AUTH_DOMAIN=$REACT_APP_FIREBASE_AUTH_DOMAIN
ENV REACT_APP_FIREBASE_PROJECT_ID=$REACT_APP_FIREBASE_PROJECT_ID
ENV REACT_APP_FIREBASE_STORAGE_BUCKET=$REACT_APP_FIREBASE_STORAGE_BUCKET
ENV REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ENV REACT_APP_FIREBASE_APP_ID=$REACT_APP_FIREBASE_APP_ID
ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY

# Build React app with Firebase config
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
