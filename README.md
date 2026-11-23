# José Fernando Revelo: Portfolio and Services Site

A bilingual (English/Spanish) service-focused portfolio. The static frontend runs on GitHub Pages, and a separate FastAPI service handles Mercado Pago payments.

```text
Browser ── GitHub Pages (React, no secrets)
   │
   ├── POST /api/checkout ──> FastAPI ──> Mercado Pago (create preference)
   ├── redirect to Mercado Pago Checkout Pro
   └── GET /api/orders/:ref ─> FastAPI (returns the server-verified status)

Mercado Pago ── signed webhook ──> FastAPI ──> fetches the payment and verifies it
```

## Run locally

Requires Node 22 and Python 3.11+.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
pytest
uvicorn app.main:app --reload --port 8000
```

Set `VITE_PAYMENT_API_URL=http://localhost:8000` in the root `.env` to connect them. Mercado Pago cannot send webhooks to localhost, so use an HTTPS tunnel and set `PUBLIC_API_URL` to test them.

## Deploy the frontend

1. Push this project to the `main` branch of a GitHub repository.
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Optionally add the public values below under **Settings > Secrets and variables > Actions > Variables**.

The workflow runs the backend tests, detects the correct base path, builds the site and deploys it.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SITE_URL` | No | Canonical URL. Set it when using a custom domain. |
| `VITE_PAYMENT_API_URL` | For payments | Public backend URL. |
| `VITE_CONTACT_ENDPOINT` | Recommended | JSON form endpoint, such as Formspree. |
| `VITE_BASE_PATH` | Local only | CI calculates it automatically. |

All `VITE_` values are public. Never store a secret in one.

## Contact form

Create a form with a provider that accepts JSON and allows browser requests, such as Formspree, then set `VITE_CONTACT_ENDPOINT`. Until then, the form opens the visitor's email app with the message prefilled and says plainly that it has not been sent.

## Deploy the payment backend

Deploy `backend/` with its `Dockerfile` to any HTTPS container host with **persistent storage**. Mount a volume and point `DATABASE_PATH` to it, or order records are lost on restart. Run a single instance when using SQLite.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MP_ACCESS_TOKEN` | Yes | Mercado Pago private access token. |
| `MP_WEBHOOK_SECRET` | Yes | Secret signature for webhooks. |
| `PAYMENT_LINK_SECRET` | Yes | Signs private payment links. Minimum 32 characters. |
| `MP_USE_SANDBOX` | No | `true` uses the test checkout URL. Default `false`. |
| `FRONTEND_URL` | Yes | Public site URL, including any path. |
| `PUBLIC_API_URL` | Yes in production | Public HTTPS backend URL, used for webhooks. |
| `ALLOWED_ORIGINS` | Yes | Comma-separated browser origins, without paths. |
| `DATABASE_PATH` | No | SQLite file location. |

### Configure Mercado Pago

**Sandbox**

1. Create an application under **Your integrations** in the Mercado Pago developer dashboard.
2. Create test buyer and seller accounts, and use the test credentials for `MP_ACCESS_TOKEN`.
3. Set `MP_USE_SANDBOX=true`.
4. Under **Webhooks > Configure notifications**, use `https://YOUR-BACKEND/api/webhooks/mercadopago`, select **Payments**, and copy the secret to `MP_WEBHOOK_SECRET`.
5. Complete approved, rejected and pending test payments, and confirm that each order shows the right status.

**Production**

1. Activate production credentials and replace `MP_ACCESS_TOKEN`.
2. Configure the production webhook and replace `MP_WEBHOOK_SECRET`.
3. Set `MP_USE_SANDBOX=false`.
4. Make one small real payment and refund it.

### Set prices

No prices are published by default. To sell a service directly, set its `unit_price` in `backend/catalog.json` and redeploy. Services with `null` show **Request a Quote**.

### Charge for a custom quote

Run this where the production environment variables are available:

```powershell
python -m app.payment_links --amount 1500000 --description "Custom API project" --currency COP --days 7
```

Send the printed link to the client. The amount is signed and cannot be edited, the link expires, and it cannot be paid twice.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/catalog` | Priced services |
| `GET` | `/api/payment-links/{token}` | Validates a private link |
| `POST` | `/api/checkout` | Creates a Checkout Pro preference |
| `GET` | `/api/orders/{reference}` | Returns the verified order status |
| `POST` | `/api/webhooks/mercadopago` | Receives signed notifications |


