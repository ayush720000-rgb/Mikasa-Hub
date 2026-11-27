#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Per-player counters shown by /stats. Stored by database.py, in MongoDB or the local file.

Each Telegram user has one record, keyed by user id. A player who has never played reads as
zeros. Counters only ever go up, and every change is an atomic increment.
"""

import database

COUNTERS = ('games_played', 'first_places', 'cards_played')


def get_stats(user_id):
    """The counters for one player, always with all keys (zero when there is no record yet)."""
    row = database.get_backend().get(int(user_id)) or {}
    return {name: int(row.get(name) or 0) for name in COUNTERS}


def add_stats(user_id, **amounts):
    """Add to one or more counters, e.g. ``add_stats(id, cards_played=1)``. Zeros are skipped."""
    changes = {}
    for name, value in amounts.items():
        if name not in COUNTERS:
            raise KeyError(f'Unknown counter: {name}')
        if value:
            changes[name] = int(value)
    if changes:
        database.get_backend().increment(int(user_id), changes)
