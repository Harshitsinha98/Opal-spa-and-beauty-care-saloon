# Opal Spa & Beauty Care Salon

Website, online booking, pickup shop, admin panel and staff panel for Opal Spa & Beauty Care Salon, Arera Colony, Bhopal.

**Stack:** Next.js 16 (App Router) · PostgreSQL on Neon · Drizzle ORM · Better Auth (email/password + Google) · Razorpay · Tailwind CSS 4 · Motion + Lenis for animation. Hosted on Vercel.

## What's in it

| Area | Pages |
| --- | --- |
| Public site | Home, Menu & prices, The house (gallery), Shop, Visit/contact |
| Booking | `/book`: pick treatments, therapist (optional), date and time, then pay online or at the salon |
| Customer | Sign up / sign in (email or Google), `/account` to see and cancel bookings and see orders |
| Shop | Pickup-only products, bag, `/checkout` (pay online or at pickup) |
| Admin `/admin` | Dashboard, bookings (status, therapist, counter payment, reschedule, cancel + refund), shop orders, payments ledger, services & prices, products, staff logins, customers, settings |
| Staff `/staff` | Day schedule, booking status, assign therapist, record counter payments, hand over shop orders. No access to prices, settings or refunds. |
| Legal | Terms of Service, Privacy Policy, Cancellation & Refund Policy, HTML sitemap (`/sitemap`) and `sitemap.xml`, `robots.txt` |

Admin-controlled settings: business details, opening hours, weekly off-days and holidays, guests per time slot, slot interval, how far ahead people can book, minimum notice, whether customers pick a therapist, which payment methods are on, and the cancellation fee (free window in hours, percentage or fixed amount). When admin cancels a booking, they choose the refund amount, so the fee can be waived.

The demo services, prices and products are placeholders. Edit them in **Admin → Services & prices** and **Admin → Products**.

## Deploy (Vercel + Neon, both free plans)

1. **Database.** In Vercel: *Storage → Create → Neon Postgres* (or create a project at neon.com). Copy the **pooled** connection string into `DATABASE_URL`.
2. **Import the repo** in Vercel. Framework preset: Next.js. The build command is taken from `vercel-build` in `package.json`. It applies database migrations, seeds the demo menu and first admin (only if they're missing), then builds.
3. **Environment variables** (Project → Settings → Environment Variables). See `.env.example`:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`: run `openssl rand -base64 32`
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL`: your live URL, e.g. `https://opalspa.in`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the first admin login
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google sign-in), `BLOB_READ_WRITE_TOKEN` (image uploads in admin; create a Blob store in Vercel Storage)
4. Deploy, then sign in at `/sign-in` with the admin email. You land on `/admin`.

### Razorpay (test mode first)

1. Razorpay Dashboard → switch to **Test mode** → *Account & Settings → API Keys* → generate. Put the key id and secret in Vercel.
2. *Account & Settings → Webhooks → Add*: URL `https://<your-site>/api/razorpay/webhook`, a secret of your choice (same value in `RAZORPAY_WEBHOOK_SECRET`), events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`, `refund.failed`.
3. Redeploy. The admin dashboard warning disappears and customers see **Pay now**.

Without keys, online payment is hidden and customers can only choose pay at the salon.

How payments are trusted: the amount always comes from the database, never the browser. After Checkout, the server verifies the Razorpay signature, fetches the payment from Razorpay to confirm it is captured, and only then marks the booking paid. The webhook does the same if the browser closes early. Both paths are idempotent. Online bookings hold the slot for a few minutes (configurable). Unpaid holds expire and free the slot or stock.

### Google sign-in (optional)

Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web). Authorised redirect URI: `https://<your-site>/api/auth/callback/google`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL etc.
npm run db:migrate
npm run db:seed
npm run dev
```

Schema changes: edit `lib/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`.

## Photos and video

The raw photos/videos are in `images/`. Install the converters once with `npm i --no-save heic-convert ffmpeg-static`, then `npm run media` converts the chosen ones (HEIC/HDR video included) into graded WebP images and a compressed MP4 in `public/media/`, and writes `lib/media.json` with sizes and blur placeholders. To change which photos are used or how they're cropped, edit the list at the top of `scripts/process-media.mjs` and run it again.

## Reviews

The reviews carousel uses Google reviews copied word for word into `lib/reviews.ts`. Google doesn't allow pulling all reviews automatically without the Business Profile API, so update that file to add newer ones. The rating and review count shown on the site are editable in Admin → Settings.

## Before going live

- Replace the demo services, prices and products.
- Add the phone, WhatsApp, email and legal business name in Admin → Settings. The footer, contact page and legal pages use them.
- Have the Terms, Privacy and Cancellation pages reviewed. They are a sensible starting point for an Indian salon, not legal advice.
- Switch Razorpay to live keys once test bookings work end to end.
