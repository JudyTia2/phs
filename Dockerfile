# ---- Base Stage ----
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage ----
FROM base AS dependencies
RUN npm install

# ---- Build Stage ----
FROM dependencies AS build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:1.25-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
# The nginx.conf file will be added in the next step
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
