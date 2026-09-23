# Toner Inventory Management System

Modular rebuild of the printer toner inventory application. Same business behavior and **existing SQL Server database** (`toner_inventory`), with a clean architecture: separated views, components, and JavaScript modules. **No demo data, no localStorage fallback.**

## Requirements

- PHP 7.4+ with PDO `sqlsrv` (or `dblib`) driver
- SQL Server / Azure SQL — database `toner_inventory` (existing schema)
- Apache/Nginx or XAMPP-style hosting
- Modern browser (Fetch API, Chart.js)

## Features

| Action | Effect |
|--------|--------|
| **Receive Delivery** | MRR (ERP auto-import), multi-line, or manual single → stock **increases** |
| **Stock Issuance** | Reference + toner + department + location (+ printer, yield) → **1 unit** deducted |
| **Defective workflow** | Flag → send to supplier → receive replacement (replacement **restores** 1 unit) |
| **Inventory** | List, search, filter, add/remove, stock card with running balance |
| **Transaction History** | Tabs, date filters, search, **Export CSV** |
| **Dashboard** | SKUs, stock, low/out, period deliveries/releases, charts, mail/system logs |
| **Masters** | Manage suppliers and department/location/printer mappings |
| **Low-stock email** | Optional SMTP via settings page / `config/mail.php` |

**Rules:** Reference numbers are unique (no double-posting). Issuance is always 1 unit. Stock cannot go negative. Flagging defective does not increase usable stock; receiving a replacement does.

## Project structure

```text
toner-inventory/
├── index.php              # Thin entry (auth + assemble views)
├── login.php / logout.php
├── config/                # database, auth, bootstrap, mailer
├── api/                   # REST-style PHP endpoints (PDO)
├── views/                 # Page sections + layout
│   ├── layout/            # header, sidebar, notifications
│   ├── dashboard.php
│   ├── inventory.php
│   ├── transactions.php
│   ├── masters.php        # Suppliers + locations
│   └── settings.php
├── components/modals/     # delivery, release, defective, stock-card, …
├── assets/
│   ├── css/app.css
│   └── js/                # Modular: api, dashboard, inventory, masters, …
├── sql/                   # Schema + migrations
│   ├── schema_sqlserver.sql
│   ├── migration_suppliers.sql
│   ├── migration_issuance_fields.sql
│   ├── migration_email_settings.sql
│   └── migration_system_logs.sql
├── storage/
└── README.md
```

## Setup

1. Deploy this folder to your web root (e.g. `htdocs/toner-inventory/`).
2. Copy config examples and set real values:
   - `config/database.example.php` → `config/database.php`
   - `config/mail.example.php` → `config/mail.php` (optional)
   - Adjust `config/auth.php` (default `admin` / `admin123` — change before production).
3. Run SQL scripts on database `toner_inventory` (in order):
   - `sql/schema_sqlserver.sql`
   - `sql/migration_suppliers.sql`
   - `sql/migration_issuance_fields.sql`
   - `sql/migration_email_settings.sql`
   - `sql/migration_system_logs.sql`
4. Ensure PHP can reach SQL Server (`pdo_sqlsrv` + ODBC driver).
5. Open `https://your-host/toner-inventory/login.php`.

The app uses tables such as `dbo.toner_inventory` and `dbo.toner_transactions`. It does **not** create a second database or seed demo rows.

## API (session-protected)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health.php` | DB connectivity |
| GET/POST/PUT/DELETE | `/api/inventory.php` | List / add / update / remove toner |
| GET | `/api/transactions.php` | `?type=&from=&to=` |
| POST | `/api/delivery.php` | Record delivery or `{ action: "preview", mrr }` to search ERP |
| POST | `/api/release.php` | Record issuance |
| POST | `/api/defective.php` | `flag` / `send_to_supplier` / `receive_replacement` |
| GET/POST/PUT/DELETE | `/api/locations.php` | Departments / locations / printers |
| GET/POST/PUT/DELETE | `/api/suppliers.php` | Supplier master list |
| GET | `/api/check_low_stock.php` | Low-stock email check |
| GET/POST | `/api/settings.php` | Email SMTP settings |
| GET | `/api/logs.php` | System activity logs |
| GET | `/api/mail_log.php` | Outgoing mail log |

Responses use `{ "ok": true, ... }` or `{ "ok": false, "error": "..." }`.

### Delivery modes

1. **MRR (ERP)** — Enter MRR → **Search MRR** → confirm lines from linked server `[VM-EGNSERVER]`.
2. **Manual** — Reference + one toner + quantity + date.
3. **Multi-line** — Reference + several item/qty/date rows.

### Defective workflow

1. **Flag** — Mark an issuance as defective (stock unchanged).
2. **Send to supplier** — Track return shipment (stock unchanged).
3. **Receive replacement** — Stock +1; records accepted-by.

## Architecture notes

- **Frontend:** HTML + Tailwind CDN + Chart.js + vanilla JS modules under `assets/js/`.
- **Backend:** Modular PHP APIs; compatible with SQL Server schema.
- **Auth:** PHP sessions (`auth_lib.php`); pages and APIs require admin login.
- **No localStorage demo mode** — empty states when the database has no rows.

## Email configuration

In the app: **Email Settings** (sidebar).

| Setting | Purpose |
|---------|---------|
| Alert recipient | Address that receives low-stock alerts |
| SMTP host / port / encryption | e.g. `smtp.gmail.com`, 465 + SSL or 587 + TLS |
| SMTP username | Usually your mailbox address (also used as From) |
| SMTP password | Gmail **App Password** recommended |
| Cooldown hours | Suppress repeat alerts for the same item |

Settings are saved to `dbo.toner_email_settings` when the database is available. Emergency defaults live in `config/mail.php`.  
Test: **Run low-stock check** on the settings page, or open `/api/check_low_stock.php?force=1` while logged in.

## Security

- PDO prepared statements
- Session auth on UI and API
- Credentials via config / environment (see `.gitignore`)
- Change default admin password before production

## Troubleshooting

- **401 on API** — log in again; session cookie required.
- **PDO sqlsrv missing** — install Microsoft Drivers for PHP for SQL Server.
- **Wrong database** — `config/database.php` must use `toner_inventory`, not another DB name.
- **Missing tables** — run the scripts under `sql/`.
- **Empty inventory** — expected if the table has no rows; use **Add Toner** or record a delivery.
- **ERP / MRR search fails** — linked server may be offline; use **Manual** or **Multi-line** mode instead.

## License / origin

Rebuilt for maintainability from the reference drafts repository while preserving production database usage and core business rules.
