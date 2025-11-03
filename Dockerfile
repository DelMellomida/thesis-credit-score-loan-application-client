FROM node:20-bullseye

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Verify .next exists
RUN ls -la .next

EXPOSE 3000

# Start directly without entrypoint script
CMD ["npm", "start"]