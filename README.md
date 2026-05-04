# Ethara — Team Task Manager

Full-stack app: **React (Vite)** + **Express** + **Prisma** + **MongoDB Atlas**.

## Local setup

1. **MongoDB Atlas**: create cluster, database user, Network Access (`0.0.0.0/0` for dev).
2. `cd server` → copy `server/.env.example` to `server/.env` → set `DATABASE_URL` and `JWT_SECRET`.
3. `npm ci` → `npx prisma db push` → `npm run dev` (API on port **4000**).
4. `cd client` → `npm ci` → `npm run dev` (UI on **5173**, proxies `/api` to the API).

## Railway (API only)

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select this repo.
2. Service settings → **Root Directory**: `server`.
3. **Variables** (required):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your Atlas `mongodb+srv://.../teamtasks?...` connection string |
   | `JWT_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |

4. Deploy. After first deploy, sync the schema once (from your machine, with `DATABASE_URL` set):

   ```bash
   cd server
   npx prisma db push
   ```

   Or use **Railway → service → Shell** and run `npx prisma db push` there.

5. **Public URL**: generate a domain for the service. The API serves `GET /health` (includes DB counts) and `/api/*` routes.

**Frontend**: either run the Vite app separately (e.g. Vercel) and point `VITE_API_URL` if you add that, or keep using the dev proxy to `localhost:4000` for local UI. This repo’s client expects `/api` on the same origin or proxy.

## Security

Never commit `server/.env`. Rotate Atlas passwords if they were shared.
