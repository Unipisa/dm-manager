FROM node:23-slim
# Before building the docker image, you need to build the server 
# and the widgets packages:
#
# $ npm run build
# $ cd widgets
# $ npm run build
# $ cd ..
#
# Then:
# $ docker build . -t dm-manager

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If you are building your code for production
RUN npm ci --omit=dev

# Bundle app source
COPY build ./build
COPY server ./server
COPY entrypoint.sh ./

# Copy the dmwidgets script inside the assets folder
COPY widgets/dist/dmwidgets.js ./build/static/
COPY widgets/dist/dmwidgets.js.LICENSE.txt ./build/static/

EXPOSE 8000

CMD [ "./entrypoint.sh", "server" ]
#ENTRYPOINT "tail -f /dev/null"

# To build the image:
#
# $ npm run build
# $ VERSION=$( node -e "console.log(require('./package.json').version)" )
# $ docker build . -t paolini/dm-manager:$VERSION
# $ docker tag paolini/dm-manager:$VERSION paolini/dm-manager:latest
#
# To run the image:
# $ docker-compose -f docker-compose-production.yml up
#
# To push the image:
# $ docker push paolini/dm-manager
