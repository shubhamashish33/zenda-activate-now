# Frontend

Angular 21 standalone dashboard and activation feature. See the [root README](../README.md) for complete setup, API/schema documentation, test commands, and delivery materials.

```sh
npm ci
npm start
npm test -- --watch=false
npm run build
npm run e2e
```

`npm run e2e` requires the development database/backend and resets the synthetic demo activation. `E2E_BASE_URL` can target the production Docker frontend instead.
