FROM node:16-alpine3.12

# create destination directory
RUN mkdir -p /usr/src/next-app
WORKDIR /usr/src/next-app

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git

RUN apk add redis

# run the Redis server
# RUN redis-server

# copy the app, note .dockerignore
COPY . /usr/src/next-app/
RUN yarn

# build necessary, even if no static files are needed,
# since it builds the server as well
RUN yarn build

# set app port
ENV PORT=5000

# expose 5000 on container
EXPOSE $PORT

# start the app
RUN chmod +x start.sh
ENTRYPOINT ["./start.sh"]
