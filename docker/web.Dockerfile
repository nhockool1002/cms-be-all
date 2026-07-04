# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @cms-be-all/web... --filter @cms-be-all/shared
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @cms-be-all/web build

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
USER app
EXPOSE 3000
CMD ["pnpm", "start"]
