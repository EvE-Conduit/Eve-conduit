FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY caddy-entrypoint.sh /usr/local/bin/caddy-entrypoint.sh
COPY --from=build /app/dist /srv
ENTRYPOINT ["/bin/sh", "/usr/local/bin/caddy-entrypoint.sh"]
# Setting ENTRYPOINT clears the base image's CMD, so repeat it.
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
