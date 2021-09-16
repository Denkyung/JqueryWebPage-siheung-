ARG NODE_VERSION=14.17.6
FROM node:${NODE_VERSION} AS Base

RUN apt-get update -yq \
    && apt-get install -yq git curl ca-certificates \
    && rm -rf /var/lib/apt