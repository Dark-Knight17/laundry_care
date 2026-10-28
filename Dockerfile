FROM oven/bun:1

WORKDIR /app

# Copy dependency specifications and install packages
COPY package.json bun.lock ./
RUN bun install

# Copy application source code (backend and shared)
COPY . .

# Expose backend HTTP port
EXPOSE 3000

# Start backend server
CMD ["bun", "backend/server.ts"]
