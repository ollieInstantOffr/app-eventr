# Eventr by instantoffr

Run a raffle at your event in ten minutes. Guests scan a QR code and enter on
their phone; you collect every entry in one place and draw the winners live on
the big screen, with your logo on everything.

Built from the `Raffle App Mockups` design: Next.js 16 (App Router), Postgres
with Prisma, Resend for email, all running in Docker.

## Running it

```bash
cp .env.example .env
```

Set `SESSION_SECRET` to something random (`openssl rand -base64 48`), then:

```bash
docker compose up
```

That brings up Postgres, applies migrations and starts the app on
<http://localhost:3100>. Nothing else is needed for a first run — with no
`RESEND_API_KEY` set, emails are written to disk as HTML previews instead of
being sent, and the log line tells you where.

To develop with hot reload against the same database:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Or run the app on the host with just the database in Docker:

```bash
docker compose up -d db
npm install
npm run db:migrate
npm run dev
```

### A note on `RESEND_API_KEY`

Docker Compose substitutes variables from your **shell environment in
preference to `.env`**. If `RESEND_API_KEY` is exported in your shell, the
container will use it and send real email, even though `.env` sets it empty.
To force the preview driver for a test run:

```bash
RESEND_API_KEY= docker compose up
```

### Uploaded files (`S3_*`)

Logos and generated posters go to an S3-compatible bucket — required, not
optional; the app won't start without `S3_BUCKET`, `S3_ENDPOINT`,
`S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` set. It works against real AWS
S3 or any S3-compatible provider (MinIO, Cloudflare R2, DigitalOcean Spaces,
Backblaze B2, a self-hosted Garage/SeaweedFS, ...) — point `S3_ENDPOINT` at
that provider. `S3_REGION` defaults to `"auto"`, which R2 and most
self-hosted providers accept; on real AWS S3 set it to your bucket's actual
region or request signing fails.

**The bucket must allow public reads.** Files are served by linking straight
to the object rather than proxying through the app — nothing stored here
(logos, posters) is ever private. On AWS that means turning off "Block public
access" for bucket policies and attaching one granting `s3:GetObject` on
`arn:aws:s3:::<bucket>/*` to `"Principal": "*"`. A bucket created after April
2023 also defaults to Object Ownership "Bucket owner enforced," which rejects
object ACLs outright — the app never sets one, for exactly that reason; a
bucket policy is what works uniformly across old and new buckets and every
other provider.

`UPLOADS_DIR` is unrelated to any of this — it's only where email previews
get written when `RESEND_API_KEY` is empty.

## Trying it out

1. Register at `/register` — no password, you get a magic link.
2. With no Resend key, find the link in the newest file under
   `email-previews/` in the uploads volume:
   ```bash
   docker compose exec app sh -c 'ls -t /data/uploads/email-previews | head -1'
   ```
3. On the empty dashboard, **Load demo** creates an event with 40 fake entries,
   including deliberate duplicates.
4. Open **Live draw**, then **Open public screen** on a second window and press
   `space`.

## The shape of it

```
src/app/
  (marketing)/       landing page, Terms, Privacy, Cookies, DPA
  (auth)/            login, register, check-inbox, 2FA challenge
  (app)/             organiser shell: events, entries, live draw, settings
  [slug]/            guest phone: entry form, confirmation, closed states
  screen/[slug]/     public draw screen and the full-screen booth QR
  kiosk/             booth device pairing
  winner/[token]/    what a winner opens from their email
  api/               health, files, QR, poster, CSV, SSE, draw, exports
src/server/
  auth/              magic links, sessions, RBAC, redaction, TOTP
  draw/              the draw engine, selection, pool hashing
  entries/           submission, queries, CSV
  events/            queries, mutations, demo data
  email/             Resend transport and the four templates
  jobs/              the in-process scheduler
  gdpr/              DPA text, Art. 30 record
  qr/                QR generation and poster PDFs
```

### Decisions worth knowing

**The draw is auditable on purpose.** Selection is `crypto.randomInt` over the
eligible pool, inside a transaction that re-checks the prize slot so two `space`
presses can't both produce a winner. Every draw appends a `DrawLog` row with the
algorithm, the eligible count and a SHA-256 of the pool's entry ids — enough to
show an organiser which entries were in a draw without keeping a copy of anyone's
personal data. `src/server/draw/draw.test.ts` covers uniformity and hash
stability.

**Roles are enforced in the query layer, not the UI.** `toPublicEntry()` strips
personal data for a Viewer before it leaves the server, so their API responses
contain no guest names or addresses at all. A kiosk device carries a scoped token
with no user attached and can only reach the QR screen and the draw.

**Consent is versioned.** Editing the guest consent text creates a new version
rather than mutating the old one, because every entry references the version its
guest agreed to and that record has to stay truthful.

**Retention has one exception.** Entries are erased N days after the event, but a
winner whose prize isn't marked delivered is skipped — the organiser still has to
reach them.

**The live screen survives a bad venue connection.** It caches the masked entry
list in IndexedDB and keeps drawing locally, queueing results to reconcile on
reconnect. The audience never sees an error: problems that need a decision appear
as an organiser-only overlay while the public view stays on the waiting screen.

**Realtime is SSE over an in-process bus.** Fine for a single container, which is
what the compose stack is. Running more than one replica means moving
`src/server/events.ts` behind Postgres `LISTEN`/`NOTIFY`; nothing else changes.
The scheduler already takes a Postgres advisory lock, so it is safe either way.

**Prisma is pinned to 7.10.0.** Prisma's `latest` dist-tag is currently an 8.0
release candidate. Prisma 7 also moved the connection URL out of `schema.prisma`
into `prisma.config.ts` and no longer loads `.env` itself, which is why that file
calls `process.loadEnvFile()`.

## Commands

| | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (what the `migrate` container runs) |
| `npm run db:studio` | Prisma Studio |

## Still to do

- The legal copy (Terms, Privacy, Cookies, DPA) is the design's draft wording and
  has not been through a lawyer. Governing law points at "the country where
  instantoffr is registered" — swap in the real one.
- SMS for winner notifications is behind a provider interface
  (`src/server/sms/send.ts`) with a generic HTTP implementation; point
  `SMS_PROVIDER` at a real endpoint or write a driver.
