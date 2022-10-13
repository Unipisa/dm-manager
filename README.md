## setup

 ```
 npm install
 ```

## development

Use two terminals for backend and frontend. 

For the backend you have to start a mongodb instance once. You can use 
docker:
```
docker-compose up -d
```

If the database is empty you need to instruct the server to create the first user (if the user already exists the password for that user is set):
```
export ADMIN_USER=admin
export ADMIN_PASSWORD=secret
```

Then start the server:
```
npm run server
```

Finally, in another terminal, start the frontend:
```
npm start
```

The react-script will serve static files while proxying unknown requests to the server frontend. If it does not work see <https://stackoverflow.com/questions/70374005/invalid-options-object-dev-server-has-been-initialized-using-an-options-object>

insert this line in `.env`:
```
DANGEROUSLY_DISABLE_HOST_CHECK=true  
```
or give a correct value to the configuration 
variable `SERVER_URL`.

Configuration is being read from `.env` and by environment variables. See `server/config.js` to see a list of available configuration variables.

Alternative configuration:
```
SERVER_URL="http://localhost:3000"
REACT_APP_SERVER_URL="http://localhost:8000"
```

## deployment

Build
```
REACT_APP_SERVER_URL="" npm run build
STATIC_FILES_PATH=build node server/server.js
```

Build docker image:
```
VERSION=$( node -e "console.log(require('./package.json').version)" )
docker build . -t paolini/dm-manager:$VERSION
docker tag paolini/dm-manager:$VERSION paolini/dm-manager:latest
docker tag paolini/dm-manager:$VERSION register.cs.dm.unipi.it/dm/dm-manager:$VERSION
docker tag paolini/dm-manager:$VERSION register.cs.dm.unipi.it/dm/dm-manager/:latest
```
 
To run the image:
```
docker-compose -f docker-compose-production.yml up
```

To push the image:
```
docker push paolini/dm-manager
docker push paolini/dm-manager:$VERSION
docker push register.cs.dm.unipi.it/dm/dm-manager:$VERSION
docker push register.cs.dm.unipi.it/dm/dm-manager
```