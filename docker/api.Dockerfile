# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @cms-be-all/api... --filter @cms-be-all/shared
RUN pnpm --filter @cms-be-all/api prisma:generate
RUN pnpm --filter @cms-be-all/api build

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
USER app
EXPOSE 3001
CMD ["pnpm", "start"]
