# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port 4200 (default Angular port)
EXPOSE 4200

# Start the application, binding to 0.0.0.0 so it's accessible outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]
