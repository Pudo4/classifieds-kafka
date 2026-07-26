# Shared build for every backend service (`services/*` except `web`) --
# selected via the `SERVICE` build arg, e.g. `--build-arg SERVICE=listing`.
# One Dockerfile because they're all the same shape: install the monorepo,
# build just that service's project-reference graph (`tsc -b` walks its
# `references` transitively -- packages/contracts, kafka, outbox, platform,
# idempotency get built along the way, nothing unrelated does), run it.
#
# Debian slim, not alpine: this project's native deps (`@confluentinc/kafka-javascript`
# wraps librdkafka, `sharp` wraps libvips) are far more likely to have a
# prebuilt binary -- or to compile cleanly with build tools installed -- for
# glibc than for musl. Alpine looked appealing for image size but wasn't
# worth the native-module risk for a project whose whole point is these two
# packages actually working.
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
RUN npm ci
ARG SERVICE
RUN npx tsc -b "services/${SERVICE}" --pretty

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE
ENV SERVICE=${SERVICE}
COPY --from=build /app ./
COPY docker/app/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
