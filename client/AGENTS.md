# AGENTS.md — Agrolify Client

Guidance for AI coding agents working in `client/`. The companion app under `server/` is a Rails 8 API; this document covers only the frontend.

## Stack

- React.js 19 + Vite 8 (ES modules, `"type": "module"`)
- Redux Toolkit + react-redux for state
- React Router 7 (`createBrowserRouter`, lazy routes)
- Ant Design 6 for UI, dayjs (with `localizedFormat`) for dates
- i18next + react-i18next (`en`, `el`)
- axios for HTTP, native `WebSocket` for Rails ActionCable
- recharts for charts, `@react-google-maps/api` for maps
- ESLint 9 flat config (`eslint.config.js`)

## Commands

Run from `client/`:

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the built bundle
- `npm run lint` — ESLint over `**/*.{js,jsx}`

There is no test runner configured. Do not invent one — verify changes by running `lint`, `build`, and exercising the UI in the dev server.

## Environment

- `VITE_API_BASE_URL` — Rails API origin. Defaults to `http://localhost:3000` if unset (see [shared/api/axiosInstance.js](src/shared/api/axiosInstance.js)).
- The same base is reused to derive the ActionCable URL (`/cable`, with `ws://` or `wss://` chosen from the protocol).

## Directory layout

```
client/src/
  app/          # composition root: store, router, providers, realtime
  features/     # feature slices (auth, devices, measurements, water, air, ...)
  shared/       # cross-feature code: api, layout, components, theme, i18n, utils, storage
  main.jsx      # entry — calls Boot() then renders <AppProvider/>
  index.css
```

### `app/`

- `AppProvider.jsx` — wires Redux `<Provider>`, `HelmetProvider`, antd `ConfigProvider`, theme tokens, locale, `<RouterProvider>`, and `<Realtime/>`.
- `store.js` — single `configureStore` with named reducers (one slice per feature).
- `router/` — route tree, `ProtectedLayout`, `PublicOnlyRoute`, `lazyRoute` helper, and `routePaths.json` (use this — never hardcode paths).
- `realtime/index.jsx` — opens one ActionCable WebSocket while authenticated; auto-reconnects after 2s on close. Subscribes to `NotificationsChannel` always and `MeasurementsChannel` for the selected device.
- `Boot.js` — runs once before render; currently dispatches `checkAuth()`.

### `features/<name>/`

Each feature follows the same shape:

```
components/   # feature-specific components
pages/        # route-level components (lazy-loaded by the router)
store/        # <name>Slice.js, <name>Selectors.js, <name>Requests.js
utils/        # optional, feature-local helpers
```

Slices are Redux Toolkit (`createSlice` + `createAsyncThunk`). Async work lives in thunks that call request modules (axios) and reduce into the slice via `extraReducers`.

### `shared/`

- `api/axiosInstance.js` — preconfigured `API` axios instance with `withCredentials: true` and a response interceptor that surfaces errors via `Alert.show` (suppressible per-request with `{ silent: true }`). Always import this rather than calling `axios` directly. Use `buildApiUrl(path)` for non-axios URLs (e.g. `<img src>`).
- `api/apiMessages.js` — error code → human message lookup used by the interceptor.
- `components/` — shared UI (`Alert`, `Notifications`, `PageHelmet`, `deviceSelector/`, `deviceSettings/`, `workspace/`).
- `layout/` — `Layout`, `Header`, `Footer`, `Sidebar`, `PublicHeader`.
- `theme/appThemeConfig.js` — antd theme tokens, viewport-aware (`mobile`/`tablet`/`desktop`/`wide`).
- `i18n/` — i18next setup and `locales/`. All user-facing strings go through translation keys.
- `storage/appStorage.js` — small wrapper around localStorage for token/language/theme.
- `utils/` — cross-feature helpers and selectors.

## Conventions

- **Files:** `.jsx` for files containing JSX, `.js` otherwise. Components use `PascalCase.jsx`; everything else is `camelCase.js`.
- **Imports:** explicit relative paths (no path aliases configured). Keep import groups: external → `app`/`features`/`shared` → relative.
- **Redux:** one slice per feature, registered in [app/store.js](src/app/store.js). Never read state directly from components — go through a `*Selectors.js` selector. Dispatch only thunks defined in the feature's slice file or hand-rolled thunks colocated with it (see `hydrateAuthenticatedSession` in [authSlice.js](src/features/auth/store/authSlice.js)).
- **HTTP:** use the shared `API` axios instance. Pass `{ silent: true }` only when the calling code shows its own error UI.
- **Realtime:** ActionCable subscriptions belong in `app/realtime/`; feature slices receive live data through dedicated reducers (e.g. `receiveLiveMeasurement`).
- **Routing:** add new routes in [app/router/](src/app/router/) using `lazyRoute(() => import(...))`. Reference paths from `routePaths.json`.
- **i18n:** never hardcode user-visible text. Antd locale and dayjs locale switch together in `AppProvider`.
- **Theme:** read tokens via antd's `theme.useToken()` or the CSS custom properties set in `AppProvider` (`--app-font-size`, etc.). Avoid hardcoded colors/sizes.
- **ESLint:** `no-unused-vars` ignores names matching `^[A-Z_]` (so unused imports of components/constants are allowed if intentional). Don't relax this rule.
- **Comments:** prefer self-documenting code. Only comment non-obvious *why*.

## Adding a new feature

1. Create `src/features/<name>/{components,pages,store}` (add `utils/` only if needed).
2. In `store/`, add `<name>Slice.js` (slice + thunks), `<name>Selectors.js`, `<name>Requests.js` (axios calls).
3. Register the reducer in [app/store.js](src/app/store.js).
4. Add route entries in [app/router/](src/app/router/) with `lazyRoute`, and add the path key to `routePaths.json`.
5. Add translation keys in [shared/i18n/locales/](src/shared/i18n/locales/) for both `en` and `el`.
6. If the feature needs realtime data, extend [app/realtime/index.jsx](src/app/realtime/index.jsx) and add a `receiveLive*` reducer to the slice — do not open ad-hoc sockets in components.

## What not to do

- Don't introduce TypeScript, alternative state libs, or alternative styling systems — match what's already here.
- Don't bypass `axiosInstance` (drops the auth/error behavior).
- Don't open WebSockets outside `app/realtime/`.
- Don't hardcode the API URL — read it from `API_BASE_URL` / `buildApiUrl`.
- Don't add tests scaffolding speculatively; there's no harness yet.
