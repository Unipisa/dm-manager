## setup

 ```
 npm install
 ```

## development

Use two terminals for backend and frontend. 
The commands will watch file modifications and restart automatically.

For the backend you have to start a mongodb instance once. You can use 
docker:
```
docker-compose up -d
```

If the database is empty you need to let the server create the first user:
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

Configuration is being read from `.env` and by environment variables. See `server/config.js` to see a list of available configuration variables.

## deployment

Build
```
npm run build
node server/server.js`
```
