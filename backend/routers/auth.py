import os
import random
import time
import smtplib
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from database import get_db
from auth import gen_id, hash_password, verify_password, create_token
from models import Organizer, Customer, OTP

_DEV = os.getenv("ENVIRONMENT", "").lower() == "development"
_MOCK_SMTP = os.getenv("MOCK_SMTP", "false").lower() == "true"
_SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
_SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
_SMTP_USER = os.getenv("SMTP_USER", "")
_SMTP_PASS = os.getenv("SMTP_PASS", "")
_MAIL_FROM = os.getenv("MAIL_FROM", _SMTP_USER)


def _send_otp_email(to: str, code: str):
    if _MOCK_SMTP:
        print(f"[OTP MOCK] {to} → {code}")
        return
    msg = MIMEText(f"Your Raaspass OTP is: {code}\n\nValid for 10 minutes.")
    msg["Subject"] = f"{code} is your Raaspass code"
    msg["From"] = _MAIL_FROM
    msg["To"] = to
    with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT) as s:
        s.starttls()
        s.login(_SMTP_USER, _SMTP_PASS)
        s.sendmail(_MAIL_FROM, to, msg.as_string())


router = APIRouter(prefix="/auth", tags=["auth"])


def m2d(obj):
    if obj is None:
        return None
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


class OrgRegister(BaseModel):
    name: str
    email: str
    password: str


class OrgLogin(BaseModel):
    email: str
    password: str


class SendOtp(BaseModel):
    email: str


class VerifyOtp(BaseModel):
    email: str
    code: str


@router.post("/organizer/register", status_code=201)
def register_organizer(body: OrgRegister, db: Session = Depends(get_db)):
    if not body.name or not body.email or not body.password:
        raise HTTPException(400, "name, email, password required")
    existing = db.scalar(select(Organizer).where(Organizer.email == body.email.lower()))
    if existing:
        raise HTTPException(409, "Email already registered")
    org = Organizer(
        id=gen_id("ORG-"),
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    token = create_token({"id": org.id, "email": org.email, "role": "organizer"})
    return {"token": token, "organizer": m2d(org)}


@router.post("/organizer/login")
def login_organizer(body: OrgLogin, db: Session = Depends(get_db)):
    org = db.scalar(select(Organizer).where(Organizer.email == body.email.lower()))
    if not org or not verify_password(body.password, org.password_hash):
        raise HTTPException(401, "Invalid email or password")
    token = create_token({"id": org.id, "email": org.email, "role": "organizer"})
    d = m2d(org)
    d.pop("password_hash", None)
    return {"token": token, "organizer": d}


@router.post("/customer/send-otp")
def send_otp(body: SendOtp, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if not email:
        raise HTTPException(400, "email required")
    code = "1234" if _DEV else str(random.randint(100000, 999999))
    expires_at = int(time.time()) + 600
    otp = db.get(OTP, email)
    if otp:
        otp.code = code
        otp.expires_at = expires_at
    else:
        otp = OTP(email=email, code=code, expires_at=expires_at)
        db.add(otp)
    db.commit()
    try:
        _send_otp_email(email, code)
    except Exception as ex:
        print(f"[WARN] OTP email failed: {ex}")
    return {"ok": True}


@router.post("/customer/verify-otp")
def verify_otp(body: VerifyOtp, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if not body.code.isdigit() or len(body.code) not in (4, 6):
        raise HTTPException(400, "Invalid OTP format")
    otp = db.get(OTP, email)
    if not otp or otp.code != body.code:
        raise HTTPException(401, "Invalid or expired OTP")
    if otp.expires_at < int(time.time()):
        raise HTTPException(401, "OTP expired")
    db.delete(otp)
    customer = db.scalar(select(Customer).where(Customer.email == email))
    if not customer:
        customer = Customer(id=gen_id("CUS-"), email=email)
        db.add(customer)
    db.commit()
    db.refresh(customer)
    token = create_token({"id": customer.id, "email": customer.email, "role": "customer"})
    return {"token": token, "customer": m2d(customer)}
