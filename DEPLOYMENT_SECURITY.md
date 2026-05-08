# Addis Events Deployment Security Checklist

## Required before hosting

- Rotate any Supabase keys that were ever committed, shared, or copied into example files.
- Set production environment variables from `.env.local.example`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ADMIN_SETUP_TOKEN`, `CHAPA_SECRET_KEY`, and `RESEND_API_KEY` server-only.
- Configure `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin.
- Configure `RESEND_FROM_EMAIL` with a verified sending domain.
- Leave `ENABLE_STAFF_PIN_LOGIN` unset in production unless you explicitly accept PIN-based staff login risk.

## Production defaults now enforced

- Protected API routes return JSON `401/403` instead of redirecting to HTML login pages.
- Mutating sensitive endpoints reject cross-origin browser requests.
- Cron endpoints require `CRON_SECRET` in every environment.
- Admin setup requires `ADMIN_SETUP_TOKEN` when configured, and requires it in production.
- Admin 2FA codes are stored hashed and rate-limited.
- Payment callback no longer marks tickets as paid from the browser; `/api/tickets/verify` verifies with Chapa server-side first.
- Production payment and email paths fail closed when Chapa or Resend credentials are missing.

## Verification commands

```bash
npm audit --omit=dev
npm run build
npx eslint src/lib/security.ts src/lib/supabase/middleware.ts src/proxy.ts src/app/api/admin/setup/route.ts src/app/api/admin/2fa/send/route.ts src/app/api/admin/2fa/verify/route.ts src/app/api/dashboard/invite/route.ts src/app/api/dashboard/events/route.ts src/app/api/tickets/checkout/route.ts src/app/api/tickets/verify/route.ts src/app/api/auth/pin-login/route.ts src/app/api/portal/accept-invite/route.ts src/app/api/cron/status/route.ts src/app/api/cron/reminders/route.ts src/app/api/admin/users/route.ts src/lib/resend.ts src/lib/chapa.ts src/app/tickets/callback/page.tsx src/app/admin/setup/page.tsx
```

