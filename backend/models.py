import time
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _now() -> int:
    return int(time.time())


class Base(DeclarativeBase):
    pass


class Organizer(Base):
    __tablename__ = "organizers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    organizer_id: Mapped[str] = mapped_column(String, ForeignKey("organizers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    venue: Mapped[str] = mapped_column(String, default="")
    location: Mapped[str] = mapped_column(String, default="")
    description: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="active")
    start_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)


class PassType(Base):
    __tablename__ = "pass_types"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False)
    organizer_id: Mapped[str] = mapped_column(String, nullable=False)
    night_label: Mapped[str] = mapped_column(String, nullable=False)
    color_name: Mapped[str] = mapped_column(String, default="")
    color_hex: Mapped[str] = mapped_column(String, default="#7A1F3D")
    event_date: Mapped[str] = mapped_column(String, default="")
    gate_open_time: Mapped[str] = mapped_column(String, default="")
    admits_per_pass: Mapped[int] = mapped_column(Integer, default=1)
    price_paise: Mapped[int] = mapped_column(Integer, default=0)


class Pass(Base):
    __tablename__ = "passes"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    pass_type_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("pass_types.id"), nullable=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False)
    organizer_id: Mapped[str] = mapped_column(String, nullable=False)
    holder_email: Mapped[str] = mapped_column(String, default="")
    holder_name: Mapped[str] = mapped_column(String, default="")
    id_last4: Mapped[str] = mapped_column(String, default="")
    admits_total: Mapped[int] = mapped_column(Integer, nullable=False)
    admits_used: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="active")
    issued_at: Mapped[int] = mapped_column(Integer, default=_now)


class Entry(Base):
    __tablename__ = "entries"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    pass_id: Mapped[str] = mapped_column(String, ForeignKey("passes.id"), nullable=False)
    event_id: Mapped[str] = mapped_column(String, nullable=False)
    organizer_id: Mapped[str] = mapped_column(String, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    gate: Mapped[str] = mapped_column(String, default="")
    scanned_at: Mapped[int] = mapped_column(Integer, default=_now)


class Transfer(Base):
    __tablename__ = "transfers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    pass_id: Mapped[str] = mapped_column(String, ForeignKey("passes.id"), nullable=False)
    from_email: Mapped[str] = mapped_column(String, nullable=False)
    to_email: Mapped[str] = mapped_column(String, default="")
    admits_count: Mapped[int] = mapped_column(Integer, nullable=False)
    new_pass_id: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="pending")
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)


class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, default="")
    id_last4: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[int] = mapped_column(Integer, default=_now)


class OTP(Base):
    __tablename__ = "otps"
    email: Mapped[str] = mapped_column(String, primary_key=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)


class ClaimBatch(Base):
    __tablename__ = "claim_batches"
    token: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False)
    organizer_id: Mapped[str] = mapped_column(String, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    claimed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[int] = mapped_column(Integer, default=_now)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
