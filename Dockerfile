# Build source environment
FROM node:14-slim AS builder
WORKDIR /tmp
COPY . ./frontend/
WORKDIR /tmp/frontend
RUN npm ci --prod --silent
RUN npm run build


# Production container creation
FROM node:14-slim
RUN npm install -g serve
WORKDIR /usr/src/app
COPY --from=builder /tmp/frontend/build .
EXPOSE 3000
CMD ["serve", "-s",  "-l", "3000"]
