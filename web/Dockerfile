# Runs Vite's own dev server inside the container (not a production build
# behind nginx) -- this project's whole `web` is a dev-mode SPA by design
# (no SSR, no build pipeline of its own beyond Vite), and matching that here
# keeps one fewer moving part than adding a static file server just for this
# image. `--host 0.0.0.0` is required -- Vite binds to localhost only by
# default, which is unreachable from outside the container.
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services ./services
COPY web ./web
RUN npm ci
WORKDIR /app/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
