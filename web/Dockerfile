# Stage 1 - the build process
FROM node:18.17.0 as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn set version 1.22.17
RUN yarn install --frozen-lockfile --no-cache
COPY package.json tsconfig.json ./
COPY src ./src

ARG COMMIT_SHA
ENV SOURCE_VERSION ${COMMIT_SHA}
ENV DISABLE_ESLINT_PLUGIN=true
ENV PORT 3000
RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start" ]