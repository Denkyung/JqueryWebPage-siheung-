ARG NODE_VERSION=14.17.6
#
# ---- Base ----
FROM node:${NODE_VERSION} AS Base

RUN apt-get update -yq \
    && apt-get install -yq git curl ca-certificates \
    && rm -rf /var/lib/apt

WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package*.json ./


#
# ---- Dependencies ----
FROM Base AS Dependencies
RUN npm install --only=production --loglevel verbose
# copy production node_modules aside
RUN cp -R node_modules prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install --loglevel verbose


#
# ---- Runtime Release ----
FROM node:${NODE_VERSION}-alpine AS release
WORKDIR /usr/src/app
COPY . .
COPY --from=Dependencies /usr/src/app/prod_node_modules ./node_modules

RUN apk update \
    && apk --no-cache add git curl ca-certificates

ENV ADDRESS 5001
EXPOSE $ADDRESS

CMD [ "npm", "run", "serve" ]
