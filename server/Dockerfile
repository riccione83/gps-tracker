# Stage 1 - the build process
FROM node:18.12.1 as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn set version 1.22.17
RUN yarn install --frozen-lockfile --no-cache
COPY package.json tsconfig.json ./
COPY src ./src

ARG COMMIT_SHA
ENV SOURCE_VERSION ${COMMIT_SHA}
ENV DISABLE_ESLINT_PLUGIN=true
ENV PORT 4000
RUN yarn build

EXPOSE 4000

CMD [ "yarn", "prod" ]