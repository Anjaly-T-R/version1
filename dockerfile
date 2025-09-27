# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p data/tmp data/uploads

# Expose the port your app runs on
EXPOSE 4000

# Set default environment variables (will be overridden by runtime env vars)
ENV NODE_ENV=production
ENV PORT=4000

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"]