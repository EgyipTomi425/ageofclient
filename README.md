# Frontier Desk

React/Vite tournament dashboard for Age of Empires III. The interface supports Hungarian and English, selected from the header and persisted in browser local storage.

## Development

```sh
npm ci
npm run dev
```

The app is built for `/ageof/`. The same-origin `/age3ofserver/api` route is proxied by Caddy to the Proxygen HTTP/2 API; images are served from this app's own `public/assets` directory.

Match detail requests are made only when a match is expanded. Image elements use native lazy loading, and analytics are fetched only when the analytics view is opened. Civilization/map rankings are calculated from explicitly fictional local sample games; they are not official or live game statistics. Asset source notes are in `public/assets/ATTRIBUTION.md`.