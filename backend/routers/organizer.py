import os
import re
import secrets
import time
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, text, func, or_

from database import get_db
from auth import gen_id, require_organizer
from models import Event, PassType, Pass, Entry, Transfer, ClaimBatch

_MOCK_SMTP = os.getenv("MOCK_SMTP", "false").lower() == "true"
_SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
_SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
_SMTP_USER = os.getenv("SMTP_USER", "")
_SMTP_PASS = os.getenv("SMTP_PASS", "")
_MAIL_FROM = os.getenv("MAIL_FROM", _SMTP_USER)
_APP_URL = os.getenv("APP_URL", "http://localhost:5173")


def _send_pass_email(to: str, pass_id: str, event_name: str, admits: int):
    body = (
        f"You've received an event pass!\n\n"
        f"Event: {event_name}\n"
        f"Pass ID: {pass_id}\n"
        f"Admits: {admits}\n\n"
        f"Open the app to view your pass:\n{_APP_URL}\n\n"
        f"Login with this email ({to}) to access your pass."
    )
    if _MOCK_SMTP:
        print(f"[PASS EMAIL MOCK] {to} → {pass_id}")
        return
    msg = MIMEText(body)
    msg["Subject"] = f"Your pass for {event_name} – {pass_id}"
    msg["From"] = _MAIL_FROM
    msg["To"] = to
    with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT) as s:
        s.starttls()
        s.login(_SMTP_USER, _SMTP_PASS)
        s.sendmail(_MAIL_FROM, to, msg.as_string())


router = APIRouter(prefix="/organizer", tags=["organizer"])


def m2d(obj):
    if obj is None:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def today_start() -> int:
    d = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return int(d.timestamp())


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(require_organizer)):
    org_id = user["id"]
    ts = today_start()

    events_count = db.execute(text("SELECT COUNT(*) FROM events WHERE organizer_id = :o"), {"o": org_id}).scalar()
    passes_count = db.execute(text("SELECT COUNT(*) FROM passes WHERE organizer_id = :o"), {"o": org_id}).scalar()
    entries_today = db.execute(
        text("SELECT COALESCE(SUM(count),0) FROM entries WHERE organizer_id = :o AND scanned_at >= :ts"),
        {"o": org_id, "ts": ts}
    ).scalar()

    upcoming = db.execute(text("""
        SELECT e.id, e.name, e.venue, e.status,
            COUNT(DISTINCT p.id) as passes_count,
            COALESCE((SELECT SUM(en.count) FROM entries en WHERE en.event_id = e.id AND en.scanned_at >= :ts), 0) as entries_today
        FROM events e
        LEFT JOIN passes p ON p.event_id = e.id
        WHERE e.organizer_id = :o
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT 10
    """), {"ts": ts, "o": org_id}).mappings().all()

    return {"events": events_count, "passes": passes_count, "entries_today": entries_today, "upcoming_events": [dict(r) for r in upcoming]}


# ── Events ────────────────────────────────────────────────────────────────────

class EventBody(BaseModel):
    name: Optional[str] = None
    venue: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


@router.get("/events")
def list_events(db: Session = Depends(get_db), user=Depends(require_organizer)):
    ts = today_start()
    rows = db.execute(text("""
        SELECT e.*,
            COUNT(DISTINCT p.id) as passes_count,
            COALESCE(SUM(p.admits_total), 0) as admits_total,
            COALESCE(SUM(p.admits_used), 0) as admits_used,
            COALESCE((SELECT SUM(en.count) FROM entries en WHERE en.event_id = e.id AND en.scanned_at >= :ts), 0) as entries_today
        FROM events e
        LEFT JOIN passes p ON p.event_id = e.id
        WHERE e.organizer_id = :o
        GROUP BY e.id
        ORDER BY e.created_at DESC
    """), {"ts": ts, "o": user["id"]}).mappings().all()
    return {"events": [dict(r) for r in rows]}


@router.post("/events", status_code=201)
def create_event(body: EventBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not body.name:
        raise HTTPException(400, "name required")
    e = Event(
        id=gen_id("EVT-"),
        organizer_id=user["id"],
        name=body.name.strip(),
        venue=body.venue or "",
        location=body.location or "",
        description=body.description or "",
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"event": m2d(e)}


@router.get("/events/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"]))
    if not event:
        raise HTTPException(404, "Event not found")

    ts = today_start()
    pass_types = db.scalars(select(PassType).where(PassType.event_id == event_id)).all()
    stats = db.execute(text(
        "SELECT COUNT(*) as passes_issued, COALESCE(SUM(admits_total),0) as admits_total, COALESCE(SUM(admits_used),0) as admits_used FROM passes WHERE event_id = :eid"
    ), {"eid": event_id}).mappings().first()
    entries_today = db.execute(
        text("SELECT COALESCE(SUM(count),0) FROM entries WHERE event_id = :eid AND scanned_at >= :ts"),
        {"eid": event_id, "ts": ts}
    ).scalar()

    stats_dict = dict(stats)
    stats_dict["entries_today"] = entries_today
    return {"event": m2d(event), "pass_types": [m2d(pt) for pt in pass_types], "stats": stats_dict}


@router.put("/events/{event_id}")
def update_event(event_id: str, body: EventBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"]))
    if not event:
        raise HTTPException(404, "Event not found")
    if body.name is not None:
        event.name = body.name
    if body.venue is not None:
        event.venue = body.venue
    if body.location is not None:
        event.location = body.location
    if body.description is not None:
        event.description = body.description
    if body.status is not None:
        event.status = body.status
    db.commit()
    db.refresh(event)
    return {"event": m2d(event)}


@router.delete("/events/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    event = db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"]))
    if not event:
        raise HTTPException(404, "Event not found")
    db.delete(event)
    db.commit()
    return {"ok": True}


# ── Pass Types ─────────────────────────────────────────────────────────────────

class PassTypeBody(BaseModel):
    night_label: Optional[str] = None
    color_name: Optional[str] = None
    color_hex: Optional[str] = None
    event_date: Optional[str] = None
    gate_open_time: Optional[str] = None
    admits_per_pass: Optional[int] = 1
    price_paise: Optional[int] = 0


@router.get("/events/{event_id}/pass-types")
def list_pass_types(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")
    pts = db.scalars(select(PassType).where(PassType.event_id == event_id)).all()
    return {"pass_types": [m2d(pt) for pt in pts]}


@router.post("/events/{event_id}/pass-types", status_code=201)
def create_pass_type(event_id: str, body: PassTypeBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not body.night_label:
        raise HTTPException(400, "night_label required")
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")
    pt = PassType(
        id=gen_id("PT-"),
        event_id=event_id,
        organizer_id=user["id"],
        night_label=body.night_label,
        color_name=body.color_name or "",
        color_hex=body.color_hex or "#7A1F3D",
        event_date=body.event_date or "",
        gate_open_time=body.gate_open_time or "",
        admits_per_pass=body.admits_per_pass or 1,
        price_paise=body.price_paise or 0,
    )
    db.add(pt)
    db.commit()
    db.refresh(pt)
    return {"pass_type": m2d(pt)}


@router.put("/pass-types/{pt_id}")
def update_pass_type(pt_id: str, body: PassTypeBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    pt = db.scalar(select(PassType).where(PassType.id == pt_id, PassType.organizer_id == user["id"]))
    if not pt:
        raise HTTPException(404, "Pass type not found")
    if body.night_label is not None:
        pt.night_label = body.night_label
    if body.color_name is not None:
        pt.color_name = body.color_name
    if body.color_hex is not None:
        pt.color_hex = body.color_hex
    if body.event_date is not None:
        pt.event_date = body.event_date
    if body.gate_open_time is not None:
        pt.gate_open_time = body.gate_open_time
    if body.admits_per_pass is not None:
        pt.admits_per_pass = body.admits_per_pass
    if body.price_paise is not None:
        pt.price_paise = body.price_paise
    db.commit()
    db.refresh(pt)
    return {"pass_type": m2d(pt)}


@router.delete("/pass-types/{pt_id}")
def delete_pass_type(pt_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    pt = db.scalar(select(PassType).where(PassType.id == pt_id, PassType.organizer_id == user["id"]))
    if not pt:
        raise HTTPException(404, "Pass type not found")
    db.delete(pt)
    db.commit()
    return {"ok": True}


# ── Passes ────────────────────────────────────────────────────────────────────

class PassBody(BaseModel):
    pass_type_id: Optional[str] = None
    holder_email: Optional[str] = None
    holder_name: Optional[str] = None
    id_last4: Optional[str] = None
    admits_total: int
    quantity: int = 1
    status: Optional[str] = None


@router.get("/events/{event_id}/passes")
def list_passes(
    event_id: str,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(require_organizer),
):
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")

    q = """
        SELECT p.*, pt.night_label, pt.color_hex, pt.color_name
        FROM passes p
        LEFT JOIN pass_types pt ON pt.id = p.pass_type_id
        WHERE p.event_id = :eid AND p.organizer_id = :o
    """
    params: dict = {"eid": event_id, "o": user["id"]}

    if status:
        q += " AND p.status = :status"
        params["status"] = status
    if search:
        q += " AND (p.holder_name LIKE :s OR p.holder_email LIKE :s OR p.id LIKE :s)"
        params["s"] = f"%{search}%"

    q += " ORDER BY p.issued_at DESC"
    rows = db.execute(text(q), params).mappings().all()
    return {"passes": [dict(r) for r in rows]}


@router.post("/events/{event_id}/passes", status_code=201)
def create_pass(event_id: str, body: PassBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")
    if body.admits_total < 1:
        raise HTTPException(400, "admits_total must be >= 1")
    qty = max(1, min(body.quantity, 10000))

    created = []
    for _ in range(qty):
        pass_id = None
        for _ in range(10):
            candidate = "RP-" + gen_id(length=4)
            if not db.get(Pass, candidate):
                pass_id = candidate
                break
        if not pass_id:
            raise HTTPException(500, "Could not generate unique pass ID")
        p = Pass(
            id=pass_id,
            pass_type_id=body.pass_type_id or None,
            event_id=event_id,
            organizer_id=user["id"],
            holder_email=body.holder_email or "",
            holder_name=body.holder_name or "",
            id_last4=body.id_last4 or "",
            admits_total=body.admits_total,
        )
        db.add(p)
        created.append(pass_id)
    db.commit()

    if qty == 1:
        return {"pass": m2d(db.get(Pass, created[0])), "count": 1}
    return {"passes": created, "count": len(created)}


@router.put("/passes/{pass_id}")
def update_pass(pass_id: str, body: PassBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.organizer_id == user["id"]))
    if not p:
        raise HTTPException(404, "Pass not found")
    if body.holder_name is not None:
        p.holder_name = body.holder_name
    if body.holder_email is not None:
        p.holder_email = body.holder_email
    if body.status is not None:
        p.status = body.status
    db.commit()
    db.refresh(p)
    return {"pass": m2d(p)}


# ── Claim Batches ─────────────────────────────────────────────────────────────

class BatchBody(BaseModel):
    pass_type_id: Optional[str] = None


@router.post("/events/{event_id}/batches", status_code=201)
def create_claim_batch(event_id: str, body: BatchBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")

    q = select(func.count(Pass.id)).where(
        Pass.event_id == event_id,
        Pass.organizer_id == user["id"],
        or_(Pass.holder_email == "", Pass.holder_email == None),
        Pass.status == "active",
    )
    if body.pass_type_id:
        q = q.where(Pass.pass_type_id == body.pass_type_id)
    total = db.scalar(q) or 0

    if total == 0:
        raise HTTPException(400, "No unassigned passes available for this event")

    token = secrets.token_urlsafe(16)
    expires_at = int(time.time()) + 30 * 24 * 3600
    batch = ClaimBatch(
        token=token,
        event_id=event_id,
        organizer_id=user["id"],
        total=total,
        expires_at=expires_at,
    )
    db.add(batch)
    db.commit()
    return {"token": token, "total": total, "expires_at": expires_at}


@router.get("/events/{event_id}/batches")
def list_batches(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    batches = db.scalars(
        select(ClaimBatch).where(ClaimBatch.event_id == event_id, ClaimBatch.organizer_id == user["id"]).order_by(ClaimBatch.created_at.desc())
    ).all()
    return {"batches": [m2d(b) for b in batches]}


class ShareBatchBody(BaseModel):
    email: str
    token: str


@router.post("/batches/share-email")
def share_batch_email(body: ShareBatchBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    batch = db.scalar(select(ClaimBatch).where(ClaimBatch.token == body.token, ClaimBatch.organizer_id == user["id"]))
    if not batch:
        raise HTTPException(404, "Batch not found")
    event = db.scalar(select(Event).where(Event.id == batch.event_id))
    event_name = event.name if event else "Event"
    claim_url = f"{_APP_URL}/?claim={body.token}"

    msg_body = (
        f"You've been invited to {event_name}!\n\n"
        f"Click the link below to claim your pass:\n{claim_url}\n\n"
        f"Passes available: {batch.total - batch.claimed}"
    )
    if _MOCK_SMTP:
        print(f"[SHARE EMAIL MOCK] {body.email} → {claim_url}")
    else:
        try:
            msg = MIMEText(msg_body)
            msg["Subject"] = f"Your invite to {event_name}"
            msg["From"] = _MAIL_FROM
            msg["To"] = body.email
            with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT) as s:
                s.starttls()
                s.login(_SMTP_USER, _SMTP_PASS)
                s.sendmail(_MAIL_FROM, body.email, msg.as_string())
        except Exception as ex:
            raise HTTPException(500, f"Email failed: {ex}")

    return {"ok": True}


# ── Pass Send ─────────────────────────────────────────────────────────────────

class SendPassBody(BaseModel):
    email: str
    event_id: Optional[str] = None


@router.post("/passes/{pass_id}/send")
def send_pass_to_customer(pass_id: str, body: SendPassBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    email = body.email.strip().lower()

    if pass_id == "__next__":
        if not body.event_id:
            raise HTTPException(400, "event_id required for bulk send")
        row = db.execute(text("""
            SELECT p.*, e.name as event_name FROM passes p JOIN events e ON p.event_id = e.id
            WHERE p.event_id = :eid AND p.organizer_id = :o AND (p.holder_email = '' OR p.holder_email IS NULL) AND p.status = 'active'
            LIMIT 1
        """), {"eid": body.event_id, "o": user["id"]}).mappings().first()
        if not row:
            raise HTTPException(410, "No unassigned passes left")
        p_dict = dict(row)
    else:
        row = db.execute(text("""
            SELECT p.*, e.name as event_name FROM passes p JOIN events e ON p.event_id = e.id
            WHERE p.id = :pid AND p.organizer_id = :o
        """), {"pid": pass_id, "o": user["id"]}).mappings().first()
        if not row:
            raise HTTPException(404, "Pass not found")
        p_dict = dict(row)

    if p_dict["status"] == "revoked":
        raise HTTPException(400, "Cannot send a revoked pass")

    p = db.get(Pass, p_dict["id"])
    p.holder_email = email
    p.holder_name = ""
    db.commit()

    try:
        _send_pass_email(email, p_dict["id"], p_dict["event_name"], p_dict["admits_total"])
    except Exception as ex:
        print(f"[WARN] Pass email failed: {ex}")

    return {"ok": True, "pass_id": p_dict["id"], "sent_to": email}


# ── Scan & Entry ──────────────────────────────────────────────────────────────

class ScanBody(BaseModel):
    qr_data: str


class EnterBody(BaseModel):
    count: int = 1
    gate: Optional[str] = ""


@router.post("/passes/scan")
def scan_pass(body: ScanBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    qr = body.qr_data.strip()
    m = re.match(r"raaspass://v1/([^/]+)", qr)
    pass_id = m.group(1) if m else qr

    row = db.execute(text("""
        SELECT p.*, pt.night_label, pt.color_hex, pt.color_name, pt.event_date, pt.gate_open_time,
            e.name as event_name, e.venue
        FROM passes p
        LEFT JOIN pass_types pt ON pt.id = p.pass_type_id
        LEFT JOIN events e ON e.id = p.event_id
        WHERE p.id = :pid
    """), {"pid": pass_id}).mappings().first()

    if not row:
        raise HTTPException(404, "Pass not found")

    p = dict(row)
    admits_remaining = p["admits_total"] - p["admits_used"]
    return {
        "pass": p,
        "admits_remaining": admits_remaining,
        "can_enter": p["status"] == "active" and admits_remaining > 0,
    }


@router.post("/passes/{pass_id}/enter")
def enter_pass(pass_id: str, body: EnterBody, db: Session = Depends(get_db), user=Depends(require_organizer)):
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.organizer_id == user["id"]))
    if not p:
        raise HTTPException(404, "Pass not found")
    if p.status == "revoked":
        raise HTTPException(400, "Pass is revoked")

    admits_remaining = p.admits_total - p.admits_used
    if body.count < 1:
        raise HTTPException(400, "count must be >= 1")
    if body.count > admits_remaining:
        raise HTTPException(400, f"Only {admits_remaining} admit(s) remaining")

    entry = Entry(
        id=gen_id("ENT-"),
        pass_id=pass_id,
        event_id=p.event_id,
        organizer_id=user["id"],
        count=body.count,
        gate=body.gate or "",
    )
    db.add(entry)

    p.admits_used += body.count
    if p.admits_used >= p.admits_total:
        p.status = "checked_in"
    db.commit()
    db.refresh(p)
    return {"pass": m2d(p), "admits_remaining": p.admits_total - p.admits_used, "entry_id": entry.id}


@router.post("/passes/{pass_id}/revoke")
def revoke_pass(pass_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.organizer_id == user["id"]))
    if not p:
        raise HTTPException(404, "Pass not found")
    p.status = "revoked"
    db.commit()
    return {"ok": True}


@router.post("/passes/{pass_id}/reset-entries")
def reset_entries(pass_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.organizer_id == user["id"]))
    if not p:
        raise HTTPException(404, "Pass not found")
    db.execute(text("DELETE FROM entries WHERE pass_id = :pid"), {"pid": pass_id})
    p.admits_used = 0
    p.status = "active"
    db.commit()
    return {"ok": True}


@router.get("/events/{event_id}/entries")
def list_entries(event_id: str, db: Session = Depends(get_db), user=Depends(require_organizer)):
    if not db.scalar(select(Event).where(Event.id == event_id, Event.organizer_id == user["id"])):
        raise HTTPException(404, "Event not found")

    rows = db.execute(text("""
        SELECT en.*, p.holder_name, p.holder_email
        FROM entries en
        JOIN passes p ON p.id = en.pass_id
        WHERE en.event_id = :eid
        ORDER BY en.scanned_at DESC
    """), {"eid": event_id}).mappings().all()
    return {"entries": [dict(r) for r in rows]}
