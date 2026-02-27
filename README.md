# PremCRM — Frontend (React SPA)

## Security Hardening (v2.0)

| Area                 | Status                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| **CSRF**             | Reads `csrf-token` cookie → sends as `X-CSRF-Token` header on every mutating request |
| **Dead Code**        | 14 unmounted pages moved to `src/pages/_deprecated/`                                 |
| **Bundle Splitting** | All route-level pages lazy-loaded via `React.lazy()` + `<Suspense>`                  |
| **Auth**             | Tokens stored in httpOnly cookies; no `localStorage` secrets                         |

## Scripts

```bash
npm run dev    # Vite dev server
npm run build  # Production build
npm run lint   # ESLint check
```
