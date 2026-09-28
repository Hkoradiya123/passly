# Passly

**Passly** is a full-stack digital event pass platform built for large-scale Indian events like Garba and Navratri. Organizers issue thousands of passes in bulk, distribute them via shareable links or email, and scan them at the gate — all from one dashboard.

---

## Features

### For Organizers
- Create and manage events with venue, description, and status
- Issue 1–10,000 passes in a single action (bulk issuance)
- Define pass types (night label, color, gate open time, admits per pass)
- Distribute passes three ways:
  - **Shareable claim link** — post one URL to WhatsApp; customers claim automatically
  - **Bulk email send** — paste a list of emails, each gets a pass assigned
  - **Per-pass send** — send any individual pass directly to a specific email
- View all issued passes, track claims, and monitor entry counts
- QR code scanner at the gate with live admit tracking

### For Customers
- Email OTP login — no password needed
- View all held passes with QR codes
- Claim a pass via link (redirects to login if not signed in)
- Pass history and transfer support

### Admin
- Platform-wide overview: organizers, events, passes, entries

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, custom state-based navigation |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 (`Mapped`, `mapped_column`) |
| Migrations | Alembic (SQLite batch mode) |
| Database | SQLite |
| Auth | JWT tokens + Email OTP (Gmail SMTP) |
| Styling | CSS variables, responsive design |

---

## Project Structure

```
raaspass/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── models.py             # SQLAlchemy ORM models
│   ├── database.py           # Engine, session, WAL mode
│   ├── db.py                 # init_db helper
│   ├── routers/
│   │   ├── auth.py           # OTP login for organizer & customer
│   │   ├── organizer.py      # Events, passes, batches, send
│   │   ├── customer.py       # Customer passes, claim flow
│   │   └── admin.py          # Admin stats
│   ├── alembic/              # Migration scripts
│   └── requirements.txt
└── frontend/app/
    ├── src/
    │   ├── App.jsx            # Root with role-based routing
    │   ├── api.js             # All API calls
    │   ├── screens/
    │   │   ├── HomeScreen.jsx
    │   │   ├── auth/LoginScreen.jsx
    │   │   ├── organizer/     # Dashboard, events, scanner
    │   │   └── customer/      # Passes, claim, profile
    │   └── components/        # Navbars, sidebars, modals
    └── public/logo.svg
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Gmail account for OTP sending (or use dev mode)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
JWT_SECRET=your_secret_key_here
SMTP_EMAIL=your@gmail.com
SMTP_PASSWORD=your_app_password
DEV_OTP=1234
```

Run migrations and start:

```bash
alembic upgrade head
uvicorn main:app --port 3001 --reload
```

### Frontend

```bash
cd frontend/app
npm install
npm run dev
```

App → `http://localhost:5173`  
API → `http://localhost:3001`

---

## Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "describe your change"

# Apply
alembic upgrade head

# Check current version
alembic current
```

> **Note:** SQLite requires `render_as_batch=True` for column alterations. Simple `ADD COLUMN` operations use `op.execute("ALTER TABLE ... ADD COLUMN ...")` directly to avoid FK constraint issues during batch table recreation.

---

## API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/organizer/auth/send-otp` | Send OTP to organizer email |
| POST | `/organizer/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/organizer/events` | List organizer's events |
| POST | `/organizer/events` | Create event |
| POST | `/organizer/events/{id}/passes` | Issue bulk passes |
| POST | `/organizer/passes/{id}/send` | Send pass to customer email |
| POST | `/organizer/events/{id}/batches` | Create shareable claim batch |
| GET | `/customer/claim/{token}` | Preview claim batch |
| POST | `/customer/claim/{token}` | Claim a pass |
| GET | `/customer/passes` | Customer's passes |

---

## Dev Notes

- In dev mode, any OTP `1234` is accepted (set `DEV_OTP=1234` in `.env`)
- Passes start as "unassigned" (`holder_email = ""`); they get assigned when claimed or sent
- `pass_id = "__next__"` on the send endpoint auto-picks the next unassigned pass for that event
- SQLite WAL mode is enabled for better concurrent read performance
