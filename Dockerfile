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

# Remove dev dependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
