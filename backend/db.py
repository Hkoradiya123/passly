from database import engine
from models import Base


def get_db():
    # kept for any legacy import; real get_db is in database.py
    from database import get_db as _get_db
    yield from _get_db()


def init_db():
    Base.metadata.create_all(bind=engine)
    print("DB initialized via SQLAlchemy")
