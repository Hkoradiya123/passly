import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select, text, or_

from database import get_db
from auth import gen_id, require_customer
from models import Customer, Pass, Entry, Transfer, ClaimBatch, Event

router = APIRouter(prefix="/customer", tags=["customer"])


def m2d(obj):
    if obj is None:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


@router.get("/me")
def get_me(db: Session = Depends(get_db), user=Depends(require_customer)):
    c = db.get(Customer, user["id"])
    if not c:
        raise HTTPException(404, "Not found")
    return {"customer": m2d(c)}


class UpdateMe(BaseModel):
    name: Optional[str] = None
    id_last4: Optional[str] = None


@router.put("/me")
def update_me(body: UpdateMe, db: Session = Depends(get_db), user=Depends(require_customer)):
    c = db.get(Customer, user["id"])
    if not c:
        raise HTTPException(404, "Not found")
    if body.name is not None:
        c.name = body.name
    if body.id_last4 is not None:
        c.id_last4 = body.id_last4
    db.commit()
    db.refresh(c)
    return {"customer": m2d(c)}


@router.get("/passes")
def get_passes(db: Session = Depends(get_db), user=Depends(require_customer)):
    rows = db.execute(text("""
        SELECT p.*, pt.night_label, pt.color_hex, pt.color_name, pt.event_date, pt.gate_open_time,
            e.name as event_name, e.venue
        FROM passes p
        LEFT JOIN pass_types pt ON pt.id = p.pass_type_id
        LEFT JOIN events e ON e.id = p.event_id
        WHERE p.holder_email = :email AND p.status != 'revoked'
        ORDER BY p.issued_at DESC
    """), {"email": user["email"]}).mappings().all()
    return {"passes": [dict(r) for r in rows]}


@router.get("/passes/{pass_id}")
def get_pass(pass_id: str, db: Session = Depends(get_db), user=Depends(require_customer)):
    row = db.execute(text("""
        SELECT p.*, pt.night_label, pt.color_hex, pt.color_name, pt.event_date, pt.gate_open_time,
            e.name as event_name, e.venue
        FROM passes p
        LEFT JOIN pass_types pt ON pt.id = p.pass_type_id
        LEFT JOIN events e ON e.id = p.event_id
        WHERE p.id = :pid AND p.holder_email = :email
    """), {"pid": pass_id, "email": user["email"]}).mappings().first()
    if not row:
        raise HTTPException(404, "Pass not found")
    return {"pass": dict(row)}


class SendPass(BaseModel):
    to_email: EmailStr
    admits_count: Optional[int] = None


@router.post("/passes/{pass_id}/send", status_code=201)
def send_pass(pass_id: str, body: SendPass, db: Session = Depends(get_db), user=Depends(require_customer)):
    email = user["email"]
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.holder_email == email))
    if not p:
        raise HTTPException(404, "Pass not found")
    if p.status != "active":
        raise HTTPException(400, "Pass cannot be transferred in current state")
    if body.to_email.lower() == email.lower():
        raise HTTPException(400, "Cannot send to yourself")

    available = p.admits_total - p.admits_used
    n = body.admits_count if body.admits_count else available
    if n < 1 or n > available:
        raise HTTPException(400, f"admits_count must be between 1 and {available}")

    transfer_id = gen_id("TRF-")
    token = gen_id("TOK-", 12)
    expires_at = int(time.time()) + 86400
    new_pass_id = pass_id

    if n < available:
        for _ in range(10):
            candidate = "RP-" + gen_id(length=4)
            if not db.get(Pass, candidate):
                new_pass_id = candidate
                break
        new_p = Pass(
            id=new_pass_id,
            pass_type_id=p.pass_type_id,
            event_id=p.event_id,
            organizer_id=p.organizer_id,
            holder_email=body.to_email.lower(),
            admits_total=n,
            status="transfer_pending",
        )
        db.add(new_p)
        p.admits_total = p.admits_total - n
    else:
        p.status = "transfer_pending"

    t = Transfer(
        id=transfer_id,
        pass_id=pass_id,
        from_email=email,
        to_email=body.to_email.lower(),
        admits_count=n,
        new_pass_id=new_pass_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"transfer": m2d(t)}


@router.get("/transfers")
def list_transfers(db: Session = Depends(get_db), user=Depends(require_customer)):
    transfers = db.scalars(
        select(Transfer).where(Transfer.from_email == user["email"]).order_by(Transfer.created_at.desc())
    ).all()
    return {"transfers": [m2d(t) for t in transfers]}


@router.post("/transfers/{transfer_id}/recall")
def recall_transfer(transfer_id: str, db: Session = Depends(get_db), user=Depends(require_customer)):
    t = db.scalar(select(Transfer).where(Transfer.id == transfer_id, Transfer.from_email == user["email"]))
    if not t:
        raise HTTPException(404, "Transfer not found")
    if t.status != "pending":
        raise HTTPException(400, "Transfer cannot be recalled")

    t.status = "recalled"
    if t.new_pass_id != t.pass_id:
        new_p = db.get(Pass, t.new_pass_id)
        restore = new_p.admits_total if new_p else t.admits_count
        if new_p:
            db.delete(new_p)
        orig = db.get(Pass, t.pass_id)
        if orig:
            orig.admits_total += restore
    else:
        orig = db.get(Pass, t.pass_id)
        if orig:
            orig.status = "active"
    db.commit()
    return {"ok": True}


class AcceptTransfer(BaseModel):
    name: Optional[str] = None


@router.post("/transfers/{transfer_id}/accept")
def accept_transfer(transfer_id: str, body: AcceptTransfer, db: Session = Depends(get_db), user=Depends(require_customer)):
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(404, "Transfer not found")
    if t.to_email != user["email"]:
        raise HTTPException(403, "This transfer is not for you")
    if t.status != "pending":
        raise HTTPException(400, "Transfer already processed")

    t.status = "accepted"
    p = db.get(Pass, t.new_pass_id)
    if p:
        p.status = "active"
        p.holder_email = user["email"]
        if body.name:
            p.holder_name = body.name
    db.commit()
    return {"pass": m2d(db.get(Pass, t.new_pass_id))}


@router.get("/passes/{pass_id}/history")
def pass_history(pass_id: str, db: Session = Depends(get_db), user=Depends(require_customer)):
    p = db.scalar(select(Pass).where(Pass.id == pass_id, Pass.holder_email == user["email"]))
    if not p:
        raise HTTPException(404, "Pass not found")
    entries = db.scalars(select(Entry).where(Entry.pass_id == pass_id).order_by(Entry.scanned_at.desc())).all()
    transfers = db.scalars(select(Transfer).where(Transfer.pass_id == pass_id).order_by(Transfer.created_at.desc())).all()
    return {"entries": [m2d(e) for e in entries], "transfers": [m2d(t) for t in transfers]}


@router.get("/claim/{token}")
def get_claim_batch(token: str, db: Session = Depends(get_db)):
    batch = db.get(ClaimBatch, token)
    if not batch:
        raise HTTPException(404, "Invalid or expired link")
    if batch.expires_at and int(time.time()) > batch.expires_at:
        raise HTTPException(410, "This link has expired")
    event = db.get(Event, batch.event_id)
    return {
        "token": token,
        "event_name": event.name if event else "",
        "event_venue": event.venue if event else "",
        "total": batch.total,
        "claimed": batch.claimed,
        "available": batch.total - batch.claimed,
    }


@router.post("/claim/{token}")
def claim_pass(token: str, db: Session = Depends(get_db), user=Depends(require_customer)):
    batch = db.get(ClaimBatch, token)
    if not batch:
        raise HTTPException(404, "Invalid link")
    if batch.expires_at and int(time.time()) > batch.expires_at:
        raise HTTPException(410, "This link has expired")

    already = db.scalar(
        select(Pass).where(Pass.event_id == batch.event_id, Pass.holder_email == user["email"], Pass.status == "active")
    )
    if already:
        raise HTTPException(400, "You already have a pass for this event")

    pass_row = db.scalar(
        select(Pass).where(
            Pass.event_id == batch.event_id,
            Pass.organizer_id == batch.organizer_id,
            or_(Pass.holder_email == "", Pass.holder_email == None),
            Pass.status == "active",
        )
    )
    if not pass_row:
        raise HTTPException(410, "All passes have been claimed")

    pass_row.holder_email = user["email"]
    batch.claimed += 1
    db.commit()
    db.refresh(pass_row)
    return {"pass": m2d(pass_row)}
