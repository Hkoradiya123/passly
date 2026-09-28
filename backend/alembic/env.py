import sys
import os
from logging.config import fileConfig
from sqlalchemy import pool
import sqlalchemy as sa
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from database import engine, DATABASE_URL
from models import Base

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


_OPTS = dict(
    target_metadata=target_metadata,
    render_as_batch=True,
    compare_type=False,           # ignore TEXT→String noise in SQLite
    include_schemas=False,
)


def run_migrations_offline():
    context.configure(url=DATABASE_URL, literal_binds=True, dialect_opts={"paramstyle": "named"}, **_OPTS)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    with engine.connect() as connection:
        connection.execute(sa.text("PRAGMA foreign_keys=OFF"))
        context.configure(connection=connection, **_OPTS)
        with context.begin_transaction():
            context.run_migrations()
        connection.execute(sa.text("PRAGMA foreign_keys=ON"))


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
