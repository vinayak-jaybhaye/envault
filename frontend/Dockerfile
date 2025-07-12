FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install


COPY frontend/ .

RUN npm run build

# Use nginx to serve built files
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]