FROM node:8.9.4

MAINTAINER Rahul Islam <rahulislam@acm.org>

ENV NODE_ENV=production
ENV PORT=3000

# Set a working directory
WORKDIR /usr/src/app

COPY ./package.json .
COPY ./yarn.lock .

# Install Node.js dependencies
RUN yarn install --production --no-progress

# Copy application files
COPY ./build .

CMD [ "node", "server.js" ]
