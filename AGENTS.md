# AGENTS.md

Guidance for coding agents working on **dm-manager**, the management application
of the Department of Mathematics, University of Pisa (people, staff, rooms,
visits, grants, seminars, conferences, PhD courses, theses, timesheets, ...).

## Repository layout

| Path | What it is |
|------|------------|
| `server/` | Express 5 + Mongoose 9 backend (CommonJS). Serves the REST API under `/api/v0`, auth, and the built frontend. |
| `frontend/` | React 18 admin SPA built with Vite (ESM, `.jsx`). Dev server on port 3000, proxies `/api`, `/login`, `/config`, ... to port 8000. |
| `widgets/` | Embeddable public React widgets for the department website, built as a single IIFE bundle `widgets/public/dmwidgets.js`, plus a gallery page. Dev server on port 8001. |
| `tools/` | One-off scripts (data import/upload). |
| `Makefile`, `Dockerfile`, `entrypoint.sh`, `deploy.sh` | Production build and Docker image. |
| `dev.sh` | Starts MongoDB (via docker compose, if not running), backend and frontend together. |

Untracked/generated directories you should ignore and never commit: `database/`
(local MongoDB data), `build/`, `nextjs/`, `uploads/`, root `node_modules/` and
`package-lock.json`, `frontend/public`, `widgets/public`, `server/public/static`,
`server/widgets-gallery`, `.env`.

There is no root `package.json`: always use `npm --prefix <server|frontend|widgets> ...`.

## Setup and running

```sh
npm --prefix server ci
npm --prefix frontend ci
npm --prefix widgets ci        # only if touching widgets / running the full test suite
./dev.sh                       # MongoDB + backend (:8000) + frontend (:3000)
```

- Node.js **26** is the reference version (CI and Docker image).
- Configuration comes from environment variables or `.env`; every option and its
  default is listed in `server/config.js`. Set `ADMIN_USER` / `ADMIN_PASSWORD`
  to create (or reset) the first admin user on startup.
- Background notification worker: `npm --prefix server run worker`.
- Maintenance CLI (sessions, migrations, notifications, logs):
  `npm --prefix server run command -- <command>` (no command prints the usage).

## Tests

Run before finishing any backend change (this is what CI runs):

```sh
npm --prefix widgets run build   # the widgets-gallery tests need the build
npm --prefix server test         # node --test server/test/*.node-test.cjs
```

- Tests use Node's built-in runner (`node:test`, `node:assert/strict`) and live
  in `server/test/*.node-test.cjs`. They need no external MongoDB, credentials
  or network. There are two kinds:
  - **Unit tests**: mock Mongoose model methods with
    `t.mock.method(Model, 'method', ...)` and upstream HTTP calls. See
    `server/test/requestRoles.node-test.cjs` and
    `server/test/userCreationAuthorization.node-test.cjs` for the style.
  - **Client contract tests** (`server/test/clientContracts.node-test.cjs`):
    the real app (`createApp`) runs against an in-memory MongoDB
    (`mongodb-memory-server`, version pinned in `server/package.json` to match
    `docker-compose.yml`), seeded by `server/test/support/contractFixtures.cjs`.
    Each file in `server/test/contracts/` lists the exact requests of one
    external client (WordPress theme, widgets, dm-calendar, dm-monitor,
    dm-planimetrie, listsync, tools/upload-documents.js), the **minimal token
    roles** it needs, and the response fields it reads. Every protected
    contract is also checked to be denied without those roles. The widget
    contracts render the real widgets (`server/test/support/widgetHarness.cjs`)
    with the shortcode attributes used in the published pages, so their
    requests are built by the widget code. The WordPress contracts list only
    the shortcodes actually published on the site.
- **Never break a client contract.** When refactoring or removing endpoints
  (the generic CRUD controllers in particular), the contract tests must keep
  passing; change a contract only together with the client that uses it.
  When a client starts using a new endpoint or field, add it to its contract.
  Known incompatibilities are marked `todo` in the contract files.
- New tests go in a new `*.node-test.cjs` file so they are picked up automatically.
- The older Jest files (`server/test/*.test.js`) are legacy: they are not run by
  `npm test` and some **drop the test database**. Do not run or extend them.
- Frontend has a small node test suite: `npm --prefix frontend test`
  (`frontend/src/*.node-test.js`).
- When touching the frontend or widgets, at least check that
  `npm --prefix frontend run build` / `npm --prefix widgets run build` succeed.

## Backend architecture

Request pipeline (`server/server.js`): CORS → static files → JSON body →
session (stored in MongoDB) → passport (local password + optional UniPi OAuth2,
`server/unipiAuth.js`) → `server/middleware/requestRoles.js` → `/api/v0` router
(`server/api.js`) → SPA fallback (`index.html`).

### Authorization

- `requestRoles` populates `req.person`, `req.staffs` (currently active staff
  records), `req.roles` and `req.log_who`. Roles are the user's stored roles plus
  **path roles** (e.g. `/process/seminars`, `/process/my/visits`) derived from
  the qualification of internal staff. A `Authorization: Bearer <token>` header
  replaces roles with those of the `Token` document.
- `server/controllers/middleware.js` provides `requireUser`, `requireSomeRole(...)`,
  `requirePathPermissions` (role prefix must match the URL; used for every
  `/process/*` route), `allowAnonymous`, and `log(req, was, will)` for the audit log.
- `admin` passes every check. Typical role names: `<model>-manager` (write),
  `<model>-supervisor` (read), `notify/<topic>` (email notifications),
  `disguised-admin` (admin impersonating a role via `POST /impersonate`).
- Authorization is security-sensitive: when changing it, add tests covering
  both allowed and denied cases.

### Models (`server/models/`)

- Always import `Schema`, `model`, `ObjectId` and shared field definitions
  (`notes`, `startDate`, `endDate`, `SSD`, `createdBy`, `updatedBy`, ...) from
  `server/models/Model.js`, and register models with its `model()` helper, not
  `mongoose.model` directly. It builds the JSON schema (`Model._schema_info`)
  exposed at `/api/v0/Models` and used by the frontend to render forms.
- Extra field options understood by the app: `label` (Italian, shown in the UI),
  `widget`, `help`, `hidden`, `can_sort`, `can_filter`, `can_edit_in_profile`,
  `match_ids`, `accept`, `href`.
- Most schemas use `timestamps: true` plus `createdBy` / `updatedBy`.
- `Model.relatedModels` declares back-references shown on view pages.

### Generic CRUD controllers (`server/controllers/*Controller.js`)

- Subclass `server/controllers/Controller.js`, set `this.path`, and adjust
  `managerRoles` (write), `supervisorRoles` (read), `searchRoles`, `createRoles`,
  `searchFields`, `queryPipeline` / `indexPipeline` as needed. Then add the
  controller to the list in `server/api.js`.
- The base class registers `GET /<path>/Model`, `GET /<path>/search/`,
  `GET /<path>/:id`, `GET /<path>` (filter/sort/paginate via query params),
  `PUT /<path>` (create), `PATCH /<path>/:id`, `DELETE /<path>/:id`, logging
  every mutation. Note that by default `searchRoles` may also create objects
  (`PUT`); set `createRoles` to restrict it (see `UserController`).
- `$lookup` stages for `ref: 'Person' | 'Grant' | 'Institution' | 'User' | 'Room' | ...`
  fields are added automatically from the schema.
- Whitelist writable fields when a model contains sensitive data (see
  `UserController.validateUserPayload`).
- These controllers are meant for the admin frontend only: do not make new
  external clients depend on them (see "Planned restructuring" below).

### Processes (`server/controllers/processes/`)

Self-service workflows for end users (seminars, conferences, visits, courses,
timesheets, room labels, ...). Each is an Express router mounted in
`processes/router.js` under `/api/v0/process/<name>` behind
`requirePathPermissions`. They typically scope data to the current user
(`req.user`, `req.person`) and must not leak other users' records. Personal
variants live under `/process/my/...`.

### Public API (`server/controllers/public/`)

Anonymous read-only endpoints under `/api/v0/public/*` consumed by the widgets
and the department website. Wired explicitly in `server/api.js`. Only project
fields that are meant to be public; some support `_format=shortcode`,
`_sort`, `_limit` (`public/common-filters.js`).

### Migrations (`server/migrations.js`)

- Applied automatically at server startup; applied names are stored in the DB.
- Name them `DYYYYMMDD_description` and append at the end of the object.
- Return `true` when done (recorded, never re-run), `false` to abort startup,
  `undefined` to run again at every start.
- Use the raw driver (`db.collection(...)`), **never the Mongoose models**: they
  may not match the historical shape of the data. Larger migrations can live in
  `server/migrations/` (see `ssd-math-codes.js`).

### Other

- `server/worker.js`: cron jobs (Europe/Rome timezone) that send email
  notifications (`server/email.js`, `models/Notification.js`).
- `server/controllers/widgetsGallery.js`: admin-only endpoint serving the built
  widgets gallery from `server/widgets-gallery/`.
- MRBS (room booking) integration: `processes/mrbsRoomsBookings.js`, configured by
  `MRBS_API_URL` / `MRBS_API_SECRET_TOKEN`.

## Frontend (`frontend/src/`)

- `App.jsx`: routes. `Engine.js`: session/user state. `api.js` + `apiPath.js`:
  HTTP helpers (react-query); build URLs with `apiPath(...)`.
- `models/`: one class per backend model extending `models/Model.jsx`
  (`code` = backend `path`, Italian names/articles, table `columns`,
  `managerRoles`, optional custom `ViewPage`/`EditPage`), registered in
  `models/Models.js`. Generic pages in `pages/` (`ModelsPage`, `ModelViewPage`,
  `ModelEditPage`) render any model from its schema.
- `processes/`: UI of the self-service processes, routed under `/process/...`
  matching the backend paths.
- UI: React Bootstrap. Adding a backend model usually means adding the frontend
  model class too.

## Widgets (`widgets/src/`)

- Entry `index.js` exposes `window.dmwidgets`; components in `components/`,
  query helpers in `*-query.js`, gallery in `gallery/` and `index.html`.
- `.js` files contain JSX. CSS is inlined into the bundle at build time.
- Widgets only call `/api/v0/public/*`. Keep the bundle self-contained: it is
  embedded in external pages (`/static/dmwidgets.js`).

## Planned restructuring

### Move external clients off the generic CRUD

The application started as a collection of models, each with read/write
permissions, served by the generic CRUD controllers. It then turned out that
permissions are better given per process (`/process/...`), with data scoped
to the task. The generic CRUD remains, and external clients still use some
of it. This is a liability:

- **Permissions cover a whole model, not a need.** A token that can read
  `/staff` reads every staff record, current and past, with `matricola`,
  `notes` and the linked person, while listsync only needs some emails. Roles
  are so coarse that tokens tend to get `admin`. The `supervisor` role ("read
  any model") exposed password hashes until the user pipeline excluded them.
- **The response is the database schema.** Renaming a field or changing an
  automatic `$lookup` silently changes the API seen by external clients
  (hence inconsistencies such as `roomAssignment` vs `roomAssignments`, or
  `chair` populated by `/group/:id` but not by `/group`).
- **The query language becomes public API.** Clients build Mongo-like filters
  (`qualification__in=...`, `startDate__lt_or_null=today`, `notes__regex=...`)
  that must keep working, and regex filters on fields one cannot read leak
  their content.

**Target:** external clients use only dedicated endpoints with an explicit
contract: anonymous `/api/v0/public/*` endpoints for public data, or
processes for authenticated tasks. Each one whitelists its filterable fields
and ends with an explicit `$project` of what it returns. The model to follow
is `controllers/public/staff-list.js`: it reuses `performQuery`, so the same
filter syntax, on six fields only, and projects only public fields.
The generic CRUD then serves only the admin frontend, and can later be
restricted to sessions (no bearer tokens) or replaced by processes.

**Remaining external uses** (from the published WordPress pages, November
2026; see `server/test/contracts/`):

| Generic endpoint | Client | Replacement |
|---|---|---|
| `GET /staff` | WordPress `[staff_manager]` (6 pages) | widget `StaffList` (`public/staff-list`) |
| `GET /staff` | listsync (`collaboratori`) | `public/staff-list?qualification=Collaboratore&...`, no token |
| `GET /visit` | WordPress `[visit_manager]` (3 pages, `year` + `grants`) | widget `VisitList` (`public/visit-list`) |
| `GET /group/:id` | WordPress `[dm_manager_group_cards]` (34 pages) | widget `PeopleCards group_id=...` (`public/group/:id`) |
| `GET /person/:id` | WordPress `[dm_manager_person_card]` (11 pages) | widget `PeopleCards person_id=...` (`public/person/:id`) |
| `GET /event-phd-course/:id` | WordPress `[phd_course_detail]` (`/phd-hpsc/`) | widget `Course` (`public/course/:id`) |
| `GET`, `PUT /document` | `tools/upload-documents.js` | a document import process, or keep with the `document-manager` token |

Once the WordPress shortcodes are replaced in the pages, the theme no longer
needs `DM_MANAGER_TOKEN`, and the unused shortcodes can be removed from it.

**Rules while this is in progress:**
- Do not add new external uses of the generic CRUD; add or extend a
  `public/*` endpoint (or a process) with a whitelist and a `$project`.
- When a client moves to a dedicated endpoint, update its contract file in
  the same change, and remove contracts of endpoints no client uses any more.
- Give tokens the minimal roles listed in their contract files, never `admin`.

## Conventions

- Language: code, identifiers, comments, commit messages and docs in English;
  **user-facing strings and field labels are in Italian**. Some legacy comments
  are in Italian; leave them as they are.
- Style: mostly 4-space indentation (2 in `server.js` and a few others) and no
  semicolons; follow the surrounding code. There is no linter or formatter configured.
- Error responses are JSON `{ error: "message" }` with an appropriate status
  (400 validation, 401 not logged in/unauthorized, 403 missing role, 404).
- Commit messages: short imperative sentence in English
  (e.g. "Restrict user creation to admins and validate writable fields").
  Never add AI co-author trailers or attributions.
- Branches: work on `develop`; `main` is production. Pushes to either build and
  publish a Docker image after tests pass. The version lives in both
  `server/package.json` and `frontend/package.json`; bump only when asked.
- Keep `README.md` in sync when changing setup, test or build commands.
- Never commit secrets, `.env` files, local database data or build outputs.
