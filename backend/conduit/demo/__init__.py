"""Demo mode: the site shows example data from a database of its own, so the real data is never touched.

While it's on (Administration -> Settings), every visitor sees the demo and can sign in as ``demo`` / ``demo123``.
Administrators who sign in with EVE keep working on the real site, so they can switch it off again. The demo is
read-only, starts no background jobs and never calls ESI. Switching demo mode off brings everyone back to the real
data, untouched; their own sign-ins come back too, since sessions live in the real database.

How it's built:

* ``state``: whether this request is in the demo (a context variable set by the middleware).
* ``router``: sends every query of a demo request to the ``demo`` database, except the few site-wide tables
  in ``SHARED`` (sessions, branding, plugin switches), which stay in the real one and are read-only there.
* ``database``: builds the demo database (migrations, a copy of the static data, then ``seed``).
* ``middleware``: decides who is in the demo and keeps the demo read-only.
"""
