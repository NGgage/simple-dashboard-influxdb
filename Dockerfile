FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY public ./public/

# Create settings file with defaults
RUN echo '{"panels":[],"dashboard":{"refreshInterval":30000}}' > settings.json

EXPOSE 3000

CMD ["node", "server.js"]
