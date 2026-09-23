# Printer Toner Inventory Management System

A practical web application for tracking **printer toner** stock and movements. Administrators record deliveries, issuances, and defective returns using **ticket reference numbers** plus the details they enter. Data is stored in **MySQL** through a **PHP API**, with an admin login and optional **low-stock email alerts**.

---

## What the system does

| Action | Effect |
|--------|--------|
| **Receive Delivery** | Enter reference no., toner, qty, date, supplier → stock **increases** |
| **Stock Issuance** | Enter reference no., toner, department, location → **1 unit** deducted (date = today) |
| **Return Defective** | Flag an already issued ticket as defective → **stock is not restored** |
| **Toner Inventory** | Unique toner codes, compatible printers, add/remove, stock card history |
| **Transaction History** | Tabs for deliveries, releases, defective; date filters; export filtered CSV |
| **Dashboard** | KPIs, department demand chart, stock status chart |
| **Low-stock email** | SMTP alert to admin when quantity ≤ reorder level |

Tickets are **reference numbers only** (not an approval workflow). Details are entered **manually**.

---

## Key features

- **MySQL persistence** via PHP REST-style endpoints (`api/`)
- **Admin login** (session-based); logout returns to `login.php`
- **Duplicate prevention** — same reference number cannot be processed twice
- **Issuance rules** — always 1 unit per ticket; location filtered by department
- **Stock card** — click a toner for movement history and running balance
- **Compatible printers** — add multiple printers as separate rows; shown as chips
- **Date filters** on transaction history (Today / Week / Month / Custom); **Export Filtered CSV**
- **Low / out-of-stock** notifications in the UI and optional **Gmail SMTP** email
- **Fallback** — if the API is offline, the UI can use localStorage demo mode

---

## Technology stack

| Layer | Technology |
|-------|------------|
| UI | Single-page app in `index.php` (HTML + Tailwind CSS CDN + Chart.js) |
| Backend | PHP 7.4+ (PDO) |
| Database | MySQL / MariaDB |
| Auth | PHP sessions (`login.php` / `logout.php`) |
| Mail | SMTP (e.g. Gmail App Password) via `config/mailer.php` |

---

## Project structure

```text
toner-system/          (or drafts/)
├── index.php          ← main app (requires login)
├── login.php          ← admin sign-in
├── logout.php         ← end session
├── config/
│   ├── database.php   ← MySQL credentials
│   ├── bootstrap.php  ← PDO + JSON helpers + API auth
│   ├── auth.php       ← admin username/password
│   ├── auth_lib.php
│   ├── mail.php       ← admin email + SMTP settings
│   └── mailer.php     ← low-stock email logic
├── api/
│   ├── health.php
│   ├── inventory.php
│   ├── transactions.php
│   ├── delivery.php
│   ├── release.php
│   ├── defective.php
│   └── check_low_stock.php
├── sql/
│   └── schema.sql
└── storage/           ← mail log + alert cooldown
```

---

## Setup (XAMPP)

1. **Start** Apache + MySQL in XAMPP.
2. Copy the project folder to `C:\xampp\htdocs\drafts\` (or `toner-system\`).
3. **Import database** — phpMyAdmin → SQL → run `sql/schema.sql`  
   (creates database `toner_inventory` and tables).
4. **Configure MySQL** in `config/database.php`:
   ```php
   'host'     => '127.0.0.1',
   'dbname'   => 'toner_inventory',
   'username' => 'root',
   'password' => '',   // default XAMPP
   ```
5. **Admin login** in `config/auth.php` (default: `admin` / `admin123`).
6. Open:
   ```text
   http://localhost/drafts/login.php
   ```

### Optional: low-stock email (Gmail)

Edit `config/mail.php`:

- `admin_email` — your address  
- `driver` → `smtp`  
- `smtp_user` / `smtp_pass` — Gmail address + **App Password**  

Test: `http://localhost/drafts/api/check_low_stock.php?force=1`

---

## How to use

### Login
Sign in as admin → dashboard.

### Receive delivery
Reference number + toner + quantity + date + supplier → **Record Delivery**.

### Stock issuance
Reference number + toner + department + location → **Record Issuance** (1 unit, date locked to today).

### Defective return
Issuance reference that was already released → **Flag as Defective**.

### Inventory
- One row per **toner code**  
- Click row → **stock card**  
- **Add Toner** / **Remove**  
- Add printers one per row  

### Transaction history
Filter by tab and date → **Export Filtered CSV** (not the full history unless you choose All Time).

### Logout
Header **Log out** → confirm → `logout.php`.

---

## Core business rules

1. Reference numbers identify records; details are entered by the admin.  
2. A reference number can only be used **once** (duplicate blocked).  
3. Issuance is always **1 toner unit** per ticket.  
4. Stock cannot go below **0**.  
5. Defective flag does **not** increase usable stock.  
6. Low stock = `quantity ≤ reorder_level`; out of stock = `quantity ≤ 0`.

---

## API overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health.php` | DB connectivity |
| GET/POST/DELETE | `/api/inventory.php` | List / add / remove toner |
| GET | `/api/transactions.php` | List (`?type=&from=&to=`) |
| POST | `/api/delivery.php` | Record delivery |
| POST | `/api/release.php` | Record issuance |
| POST | `/api/defective.php` | Flag defective |
| GET | `/api/check_low_stock.php` | Run low-stock email check |

API routes require an **admin session** (same login as the app).

---

## Default credentials

| Item | Value |
|------|--------|
| Admin user | `admin` |
| Admin password | `admin123` |
| Database | `toner_inventory` |

Change the admin password in `config/auth.php` before production use.
