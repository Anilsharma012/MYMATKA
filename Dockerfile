# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps


# Copy the rest of the code
COPY . .

# Build frontend and backend
RUN npm run build

# Expose port (change if you use another)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
