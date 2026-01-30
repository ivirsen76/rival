# ==========================================
# Creating temp image
# ==========================================
FROM node:20.19.4-alpine AS base

WORKDIR /app

RUN npm i -g pnpm

COPY . .

RUN pnpm --legacy --filter=@rival/club.backend --prod deploy /prod
COPY apps/ladder/backend/dist /prod/dist
COPY apps/ladder/backend/build /prod/build
COPY gitcommit /prod

# Remove src folder
RUN rm -rf /prod/src


# ==========================================
# Creating actual image
# ==========================================
FROM node:20.19.4-alpine

WORKDIR /app

RUN npm i -g pnpm

COPY --from=base /prod .

CMD ["pnpm", "run", "start:prod"]

EXPOSE 3030