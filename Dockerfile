FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (production + dev for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Don't prune dev dependencies - Vite is needed at runtime
# RUN npm prune --production

# Expose port (Railway will set PORT env var)
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
