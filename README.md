# Orbinest - Frontend (React SPA)

## Security Hardening (v2.0)

| Area | Status |
| --- | --- |
| **CSRF** | Reads `csrf-token` cookie and sends `X-CSRF-Token` on mutating requests |
| **Dead Code** | Unmounted legacy pages moved out of the active route tree |
| **Bundle Splitting** | Route-level pages lazy-loaded via `React.lazy()` and `<Suspense>` |
| **Auth** | Tokens stored in httpOnly cookies; no `localStorage` secrets |

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
