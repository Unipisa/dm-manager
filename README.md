## development

Install the packages with 
 ```
 npm ci
 ```

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

The server should be available at [http://localhost:3000](http://localhost:3000).

To test the notification service you should also start the background worker. In yet another terminal:
```
npm run worker
```

Configuration is being read from `.env` and by environment variables. See `server/config.js` to see a list of available configuration variables.
For security reasons if you don't set the variable `SESSION_SECRET` the session secret is randomly generated.

You can use the `command` module to clear session or show migrations. Check the usage with:
```
npm run command
```

## deployment

Build
```
npm run build
STATIC_FILES_PATH=build node server/server.js
```

Build docker image:
```
VERSION=$( node -e "console.log(require('./package.json').version)" )
docker build . --file Dockerfile --tag harbor.cs.dm.unipi.it/dm-manager/dm-manager
docker tag harbor.cs.dm.unipi.it/dm-manager/dm-manager harbor.cs.dm.unipi.it/dm-manager/dm-manager:${VERSION}
```
 
To run the image:
```
docker-compose -f docker-compose-production.yml up
```

To push the image:
```
docker push harbor.cs.dm.unipi.it/dm-manager/dm-manager:${VERSION}
docker push harbor.cs.dm.unipi.it/dm-manager/dm-manager
```

## API consumption

Assume you have the server running:
```
export SERVER_URL="http://localhost:8000"
export API=${SERVER_URL}/api/v0
```

Then you can check the API is responding with:
```
curl ${API}
```
(you can pipe the command throught `json_pp` to pretty print the resulting json)

Create a Token from the web interface. Then try:
```
export TOKEN_SECRET="my-secret-token"

```

Assume the API server is available
and that a token `$TOKEN_SECRET` has been inserted in the database.
If you start a developmnet server as described above these condition 
are met. 

The api request path has the following form:
* `GET /api/v0/<model>?_sort=[-]<sort_key>&_limit=<n_items>&filter_key=filter_val&...` to obtain a list of objects of the specified `model` filtered with given `filter_key`s sorted by `sort_key` (descending if a `-` is prepended). 
On some supported fields you can append `__lt`, `__gt`, `__lte`, `__gte` to implement an inequality comparison filter. 
On date fields the constant `today` can be used as the value of a filter. 
Otherwise ISO timestamps are expected.
The result json object is something like:
```
{
    data: [<objects>...]
}
```
* `GET /api/v0/<model>/<object_id>` to get a single item
* `PUT /api/v0/<model>` to create e new item
* `PATCH /api/v0/<model>/<object_id>` to update
an existing item
* `DELETE /api/v0/<model>/<object_id>` to delete an existing item

# Descrizione del progetto: dm-manager

**dm-manager** è una piattaforma web per la gestione di dati e processi accademici, sviluppata in Node.js (Express/Mongoose) per il backend e React per il frontend. Il sistema è pensato per la gestione di stanze, assegnazioni, personale, eventi, visite, tesi, gruppi, istituzioni e altro, con autenticazione locale e OAuth2 (Unipi).

## Architettura

- **Backend**: Node.js, Express, Mongoose (MongoDB), sessioni, autenticazione locale e OAuth2, API RESTful.
- **Frontend**: React, React-Router, React-Bootstrap, React-Query.
- **Database**: MongoDB.
- **Deployment**: Docker, docker-compose, script di build e avvio.
- **Configurazione**: tramite file `.env` o variabili ambiente.

## Funzionalità principali

- Gestione CRUD di modelli come: Stanze, Assegnazioni, Persone, Gruppi, Utenti, Eventi, Tesi, Istituzioni, ecc.
- Sistema di ruoli e permessi granulare (admin, supervisor, manager, ecc.).
- API RESTful documentata e accessibile via `/api/v0`.
- Autenticazione tramite password o OAuth2 (Unipi).
- Frontend React con routing e pagine dedicate per ogni processo.
- Worker per notifiche e processi asincroni.
- Logging, gestione sessioni, e strumenti di amministrazione.

## Avvio e sviluppo

1. Installa le dipendenze: `npm ci`
2. Avvia MongoDB (es: `docker-compose up -d`)
3. Crea l’utente admin (se necessario) impostando `ADMIN_USER` e `ADMIN_PASSWORD`
4. Avvia backend: `npm run server`
5. Avvia frontend: `npm start`
6. (Opzionale) Avvia worker: `npm run worker`

## API

- CRUD su tutti i modelli tramite `/api/v0/<model>`
- Filtri, ordinamenti, ricerca full-text, filtri su date e relazioni
- Autenticazione tramite token o sessione

## Modelli principali

- **Room**: Stanze, con attributi come numero, piano, edificio, descrizione, ecc.
- **RoomAssignment**: Assegnazioni di persone alle stanze, con date di inizio/fine.
- **Person**: Persone, anagrafiche e dati di contatto.
- **Staff**: Ruoli e qualifiche del personale.
- **User**: Utenti del sistema, credenziali e ruoli.
- **Group**: Gruppi di persone.
- **Institution**: Istituzioni collegate.
- **Grant**: Progetti e finanziamenti.
- **Thesis**: Tesi gestite.
- **Visit**: Visite e ospiti.
- **EventSeminar, EventConference, EventPhdCourse**: Eventi accademici.
- **RoomLabel, ConferenceRoom**: Etichette e sale conferenze.
- **Form, Log, Token, Url, SeminarCategory**: Altri modelli di supporto.

## Sicurezza

- Gestione sessioni sicura (SESSION_SECRET)
- Ruoli e permessi per ogni endpoint
- Supporto per token API

## Deployment

- Build: `npm run build`
- Docker: `docker build .` e `docker-compose -f docker-compose-production.yml up`

---

Per dettagli su un modello o controller specifico, consultare i file nella cartella `server/models` o `server/controllers`.
