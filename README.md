## setup

 ```
 npm install
 ```

## development

Use two terminals for backend and frontend. 
The commands will watch file modifications and restart automatically.
For the backend:

```
npm run server
```

For the frontend:

```
npm start
```

The react-script will serve static files while proxying unknown requests to the server frontend. If it does not work see <https://stackoverflow.com/questions/70374005/invalid-options-object-dev-server-has-been-initialized-using-an-options-object>

insert this line in `.env`:

```
DANGEROUSLY_DISABLE_HOST_CHECK=true  
```

## deployment

Build
```
npm run build
node server/server.js`
```
