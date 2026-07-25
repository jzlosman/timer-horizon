# Deployment

Timer Horizon is a static site deployed as a Cloudflare Worker, not Cloudflare Pages.

## After every commit to `main`

```bash
npm test
npm run check
git push origin main
npm run build
wrangler deploy --no-autoconfig --message "Deploy $(git rev-parse --short HEAD)"
curl -fsSI https://timerhorizon.com
```

- `wrangler.json` serves `dist/` and keeps the `timerhorizon.com/*` Worker route attached.
- `npm run build` must run before deploy; `dist/` is generated and intentionally ignored by Git.
- If Wrangler is not authenticated, run `wrangler login` first. Do not deploy with `--domain`; the route is already configured in `wrangler.json`.
