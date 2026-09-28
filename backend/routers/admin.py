import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, select
from fastapi.security import HTTPAuthorizationCredentials

from database import get_db
from auth import create_token, decode_token, bearer
from models import Organizer, Entry, Pass

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "raaspass-admin-2026")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@raaspass.com")

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "super_admin":
            raise HTTPException(403, "Super admin access required")
        return payload
    except Exception:
        raise HTTPException(401, "Invalid or missing admin token")


# ── Auth ──────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: str
    password: str


@router.post("/login")
def admin_login(body: AdminLogin):
    if body.email.lower() != ADMIN_EMAIL.lower() or body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid admin credentials")
    token = create_token({"id": "super_admin", "email": ADMIN_EMAIL, "role": "super_admin"})
    return {"token": token, "admin": {"email": ADMIN_EMAIL, "role": "super_admin"}}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = int(datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).timestamp())

    stats = {
        "organizers":    db.execute(text("SELECT COUNT(*) FROM organizers")).scalar(),
        "events":        db.execute(text("SELECT COUNT(*) FROM events")).scalar(),
        "passes":        db.execute(text("SELECT COUNT(*) FROM passes")).scalar(),
        "entries_total": db.execute(text("SELECT COALESCE(SUM(count),0) FROM entries")).scalar(),
        "entries_today": db.execute(text("SELECT COALESCE(SUM(count),0) FROM entries WHERE scanned_at >= :t"), {"t": today}).scalar(),
        "active_events": db.execute(text("SELECT COUNT(*) FROM events WHERE status='active'")).scalar(),
    }

    recent_orgs = db.execute(text("""
        SELECT o.id, o.name, o.email, o.created_at,
            COUNT(DISTINCT e.id) as events_count,
            COUNT(DISTINCT p.id) as passes_count
        FROM organizers o
        LEFT JOIN events e ON e.organizer_id = o.id
        LEFT JOIN passes p ON p.organizer_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 10
    """)).mappings().all()

    return {"stats": stats, "recent_organizers": [dict(r) for r in recent_orgs]}


# ── Organizers ────────────────────────────────────────────────────────────────

@router.get("/organizers")
def list_organizers(search: Optional[str] = Query(None), db: Session = Depends(get_db), _=Depends(require_admin)):
    q = """
        SELECT o.id, o.name, o.email, o.created_at,
            COUNT(DISTINCT e.id) as events_count,
            COUNT(DISTINCT p.id) as passes_count,
            COALESCE(SUM(p.admits_used), 0) as total_entries
        FROM organizers o
        LEFT JOIN events e ON e.organizer_id = o.id
        LEFT JOIN passes p ON p.organizer_id = o.id
    """
    params = {}
    if search:
        q += " WHERE o.name LIKE :s OR o.email LIKE :s"
        params["s"] = f"%{search}%"
    q += " GROUP BY o.id ORDER BY o.created_at DESC"
    rows = db.execute(text(q), params).mappings().all()
    return {"organizers": [dict(r) for r in rows]}


@router.get("/organizers/{org_id}")
def get_organizer(org_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    org = db.execute(text("SELECT id, name, email, created_at FROM organizers WHERE id = :id"), {"id": org_id}).mappings().first()
    if not org:
        raise HTTPException(404, "Organizer not found")

    events = db.execute(text("""
        SELECT e.*, COUNT(DISTINCT p.id) as passes_count,
            COALESCE(SUM(p.admits_used), 0) as admits_used,
            COALESCE(SUM(p.admits_total), 0) as admits_total
        FROM events e
        LEFT JOIN passes p ON p.event_id = e.id
        WHERE e.organizer_id = :o
        GROUP BY e.id
        ORDER BY e.created_at DESC
    """), {"o": org_id}).mappings().all()

    return {"organizer": dict(org), "events": [dict(r) for r in events]}


@router.delete("/organizers/{org_id}")
def delete_organizer(org_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    org = db.get(Organizer, org_id)
    if not org:
        raise HTTPException(404, "Organizer not found")
    db.execute(text("DELETE FROM entries WHERE organizer_id = :o"), {"o": org_id})
    db.execute(text("DELETE FROM passes WHERE organizer_id = :o"), {"o": org_id})
    db.execute(text("DELETE FROM pass_types WHERE organizer_id = :o"), {"o": org_id})
    db.execute(text("DELETE FROM events WHERE organizer_id = :o"), {"o": org_id})
    db.delete(org)
    db.commit()
    return {"ok": True}


# ── Events ─────────────────────────────────────────────────────────────────────

@router.get("/events")
def list_all_events(search: Optional[str] = Query(None), status: Optional[str] = Query(None), db: Session = Depends(get_db), _=Depends(require_admin)):
    q = """
        SELECT e.*, o.name as organizer_name, o.email as organizer_email,
            COUNT(DISTINCT p.id) as passes_count,
            COALESCE(SUM(p.admits_used), 0) as admits_used,
            COALESCE(SUM(p.admits_total), 0) as admits_total
        FROM events e
        JOIN organizers o ON o.id = e.organizer_id
        LEFT JOIN passes p ON p.event_id = e.id
        WHERE 1=1
    """
    params = {}
    if search:
        q += " AND (e.name LIKE :s OR e.venue LIKE :s OR o.name LIKE :s)"
        params["s"] = f"%{search}%"
    if status:
        q += " AND e.status = :status"
        params["status"] = status
    q += " GROUP BY e.id ORDER BY e.created_at DESC"
    rows = db.execute(text(q), params).mappings().all()
    return {"events": [dict(r) for r in rows]}


# ── Passes ─────────────────────────────────────────────────────────────────────

@router.get("/passes")
def list_all_passes(search: Optional[str] = Query(None), status: Optional[str] = Query(None), db: Session = Depends(get_db), _=Depends(require_admin)):
    q = """
        SELECT p.*, e.name as event_name, o.name as organizer_name,
            pt.night_label, pt.color_hex
        FROM passes p
        JOIN events e ON e.id = p.event_id
        JOIN organizers o ON o.id = p.organizer_id
        LEFT JOIN pass_types pt ON pt.id = p.pass_type_id
        WHERE 1=1
    """
    params = {}
    if search:
        q += " AND (p.id LIKE :s OR p.holder_name LIKE :s OR p.holder_email LIKE :s)"
        params["s"] = f"%{search}%"
    if status:
        q += " AND p.status = :status"
        params["status"] = status
    q += " ORDER BY p.issued_at DESC LIMIT 200"
    rows = db.execute(text(q), params).mappings().all()
    return {"passes": [dict(r) for r in rows]}


# ── Platform stats ─────────────────────────────────────────────────────────────

@router.get("/stats")
def platform_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    passes_by_status = db.execute(text("SELECT status, COUNT(*) as count FROM passes GROUP BY status")).mappings().all()

    top_events = db.execute(text("""
        SELECT e.name, e.venue, o.name as organizer,
            COUNT(DISTINCT p.id) as passes,
            COALESCE(SUM(p.admits_used), 0) as entries
        FROM events e
        JOIN organizers o ON o.id = e.organizer_id
        LEFT JOIN passes p ON p.event_id = e.id
        GROUP BY e.id
        ORDER BY entries DESC
        LIMIT 10
    """)).mappings().all()

    return {"passes_by_status": [dict(r) for r in passes_by_status], "top_events": [dict(r) for r in top_events]}
