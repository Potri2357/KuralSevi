FROM node:20-slim

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Create and grant read/write permissions for WhatsApp auth state
RUN mkdir -p /app/auth_info_baileys && chmod -R 777 /app/auth_info_baileys

# Port configuration (overridden automatically by Render/cloud providers)
ENV PORT=5005
EXPOSE 5005

CMD ["node", "server.js"]
