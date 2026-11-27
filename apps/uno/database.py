#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Where UNO keeps per-player counters: MongoDB when MONGODB_URI is set, otherwise a local file.

Only the counters in user_setting.py are stored. Updates use MongoDB's atomic ``$inc``, so
counts from concurrent worker threads are never lost. The local file is only a fallback for
development or a bot without a database; on an ephemeral host it is lost on every redeploy.
"""

import json
import logging
import os
import tempfile
import threading

from pymongo import MongoClient
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

COLLECTION = 'user_settings'
DEFAULT_DB_NAME = 'mikasa'
DEFAULT_FILE = 'uno-data.json'

# The active store, set by bind_database(). None until it runs.
_backend = None


def _as_bool(value, default):
    if value is None:
        return default
    return str(value).strip().lower() in ('yes', 'true', 't', '1', 'on')


class MongoStore:
    """Counters in one MongoDB collection, one document per Telegram user (``_id`` = user id)."""

    kind = 'mongodb'

    def __init__(self, uri, db_name):
        # Connecting is lazy, so ping now: a bad or unreachable server must fail here, not later.
        self.client = MongoClient(uri, maxPoolSize=10, serverSelectionTimeoutMS=10_000)
        try:
            self.client.admin.command('ping')
        except Exception:
            self.client.close()
            raise
        self.db = self.client[db_name]
        self.collection = self.db[COLLECTION]

    def get(self, user_id):
        return self.collection.find_one({'_id': user_id}, {'_id': 0})

    def increment(self, user_id, amounts):
        self.collection.update_one({'_id': user_id}, {'$inc': amounts}, upsert=True)

    def size_bytes(self):
        stats = self.db.command('dbStats')
        return int(stats['storageSize'] + stats['indexSize'])


class FileStore:
    """Counters in a local JSON file. Used only when MongoDB is not configured or not reachable."""

    kind = 'file'

    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self):
        try:
            with open(self.path, encoding='utf-8') as handle:
                return json.load(handle)
        except FileNotFoundError:
            return {}
        except (OSError, ValueError) as e:
            logger.warning('Could not read %s, starting empty: %s', self.path, e)
            return {}

    def get(self, user_id):
        with self._lock:
            row = self._data.get(str(user_id))
            return dict(row) if row else None

    def increment(self, user_id, amounts):
        with self._lock:
            row = self._data.setdefault(str(user_id), {})
            for key, value in amounts.items():
                row[key] = row.get(key, 0) + value
            self._write()

    def _write(self):
        # Write to a temporary file and rename it, so a crash never leaves half a file behind.
        directory = os.path.dirname(os.path.abspath(self.path))
        fd, tmp = tempfile.mkstemp(dir=directory, prefix='.uno-data-', suffix='.tmp')
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            json.dump(self._data, handle)
        os.replace(tmp, self.path)

    def size_bytes(self):
        return os.path.getsize(self.path) if os.path.exists(self.path) else 0


def bind_database():
    """Use MongoDB when MONGODB_URI is set and reachable, otherwise the local file.

    Set UNO_REQUIRE_DATABASE=true to refuse the file fallback and stop start-up instead.
    """
    global _backend
    uri = os.getenv('MONGODB_URI', '').strip()
    if uri:
        db_name = os.getenv('MONGODB_DB', '').strip() or DEFAULT_DB_NAME
        try:
            _backend = MongoStore(uri, db_name)
            logger.info('Using MongoDB (MONGODB_URI).')
            return
        except (PyMongoError, OSError, ValueError) as e:
            if _as_bool(os.getenv('UNO_REQUIRE_DATABASE'), False):
                raise RuntimeError(f'MongoDB unavailable and UNO_REQUIRE_DATABASE is set: {e}') from e
            logger.error('MongoDB unavailable, falling back to a local file: %s', e)

    path = os.getenv('UNO_DB', DEFAULT_FILE)
    _backend = FileStore(path)
    logger.warning(
        'Using local file %s. Stats and settings are lost on every redeploy when this '
        'filesystem is ephemeral (Render free plan). Set MONGODB_URI to keep them.', path)


def get_backend():
    if _backend is None:
        raise RuntimeError('Database is not bound. Call bind_database() first.')
    return _backend


def database_size_bytes():
    """Bytes used by the bot's data: the MongoDB database, or the local file.

    Raises an exception if MongoDB cannot be reached. The caller decides what to show.
    """
    if _backend is None:
        return 0
    return _backend.size_bytes()
