FROM node:26-slim
# Before building the docker image, you need to build the server 
# and the widgets packages:
#
# $ cd frontend
# % npm run build
# $ cd ../widgets
# $ npm run build
# $ cd ..
#
# Then:
# $ docker build . -t dm-manager

# Create app directory
WORKDIR /app

# Bundle app source
COPY server ./server
RUN  rm -rf /app/server/node_modules
COPY entrypoint.sh ./

RUN cd server && npm ci --omit=dev

EXPOSE 8000

CMD [ "./entrypoint.sh", "server" ]
