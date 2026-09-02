# QR attendance deployment guide

The canonical pages are `/teacher/session` and `/student/checkin`. With a
Supabase service-role key configured, these pages use the server session,
signed rotating tokens, enrollment, geofence, device binding and atomic
attendance writes. Without the migration or credentials, the UI intentionally
falls back to its local demo store.

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` (never expose the service key to a browser).
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Sign teachers and students in with Supabase Auth. The API derives the
   student ID from the bearer JWT; a posted student ID is ignored.
5. Pass a class UUID in `/teacher/session?class=<uuid>` to start a server
   session. The QR contains only a short-lived signed token.

WebAuthn is capability-detected but deliberately disabled until a passkey
provider is configured. The app never implements cryptography in the browser;
the normal Supabase/password flow remains the clear fallback.
