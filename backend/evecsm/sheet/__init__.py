"""The character sheet: per-character data pulled from ESI.

Each section (skills, wallet, assets, ...) is a small Django app under
``evecsm.sheet`` that registers a ``Section`` describing which ESI scopes it
needs, how often it syncs and the function that does the syncing. The
scheduler in ``tasks.py`` takes care of the rest.
"""
