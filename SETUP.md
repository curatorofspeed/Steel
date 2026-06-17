# Steelhead Storage — Deploy (Light)
Supabase + Vercel only. No Stripe, no email, no custom domain required.

---

## What works in this version

- Public site — all 6 pages, live from Supabase
- Unit availability shared across all visitors instantly
- Reservations saved to database
- Owner console — login, units, tenants, PDF upload, cameras
- Tenant portal — login, view balance and gate code
- Waitlist signups saved to database
- Payments — demo mode (records locally, no real card charge)
- Contact form — shows confirmation locally, no email sent

Add Stripe and Resend any time — just drop in the extra files and env vars.

---

## Step 1 — Supabase

1. Go to supabase.com → sign in with GitHub → New project
   - Name: steelhead-storage
   - Region: US West (Oregon)
   - Click Create new project, wait ~60 seconds

2. Run the schema:
   - Left sidebar → SQL Editor → New query
   - Copy everything from supabase/schema.sql, paste it in, click Run
   - You'll see "Success. No rows returned" — that's correct

3. Copy your credentials:
   - Left sidebar → Project Settings (gear icon) → API
   - Copy Project URL → this is SUPABASE_URL
   - Copy the service_role key (click the eye icon — it's the long one, NOT the anon key) → SUPABASE_SERVICE_KEY

---

## Step 2 — GitHub

1. Go to github.com → + → New repository
   - Name: steelhead-storage, Private, Create repository

2. In your terminal, inside this project folder:

   git init
   git add .
   git commit -m "initial deploy"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/steelhead-storage.git
   git push -u origin main

---

## Step 3 — Edit index.html before deploying

Open index.html in a text editor:

Set your owner passcode:
Search for v==='2026' and change 2026 to whatever you want.
This is what you type to log into the owner console. Remember it.

Save, then push:
   git add index.html
   git commit -m "set passcode"
   git push

---

## Step 4 — Vercel

1. Go to vercel.com → Sign Up with GitHub
2. Click Add New Project → find steelhead-storage → Import
3. Scroll to Environment Variables and add these 4:

   SUPABASE_URL          = your Supabase Project URL
   SUPABASE_SERVICE_KEY  = your Supabase service_role key
   OWNER_PASSCODE        = the passcode you chose above
   JWT_SECRET            = run this and paste the output:
                           node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

4. Click Deploy — about 30 seconds

Your site is live at your-project.vercel.app

---

## Step 5 — Test

- Site loads and shows unit availability
- Click Rent Now on a unit → check Supabase → Table Editor → tenants → it's there
- Pay Bill / Login → enter john.smith@email.com → pay → demo confirmation
- Owner console → enter passcode → dashboard loads with live data
- PDF Updates → upload Vacant Units Report → open in another browser → availability matches

---

## Adding Stripe + email later

1. Add stripe and resend to package.json dependencies
2. Add api/payment-intent.js, api/stripe-webhook.js, api/contact.js from the full phase2 package
3. Add env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL
4. Push to GitHub — Vercel auto-deploys

---

## Custom domain (when ready)

Vercel → your project → Settings → Domains → add steelheadstorage.net → follow the DNS instructions.
