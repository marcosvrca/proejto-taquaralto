FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY runtime-config.js.template /usr/share/nginx/html/runtime-config.js.template

ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/runtime-config.js.template > /usr/share/nginx/html/runtime-config.js && nginx -g 'daemon off;'"]
