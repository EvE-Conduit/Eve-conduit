# External API and logs

Other services (Discord/TeamSpeak/Mumble bots, killboards, recruitment tools, a SIEM) talk to EvE Conduit
through the external API at `/api/v1/`. Its interactive docs are at `/api/v1/docs`.

## Setting it up

1. **Administration > API > APIs:** switch on the APIs you need. Every API starts switched off, and
   each one is switched on and off separately:

   | API | Scopes | What it's for |
   |---|---|---|
   | Directory | `directory:read` | Users, main/alt characters, corporations, alliances, states, groups |
   | Character sheets | `sheet:<section>` (e.g. `sheet:skills`) | Synced character data, one scope per section |
   | Group membership | `groups:write` | Add/remove users from groups (state restrictions still apply; never groups that grant administrator permissions) |
   | State membership | `states:write` | Add/remove characters, corporations, alliances from a state (never states that grant administrator permissions) |
   | Notifications | `notify:write`, `notify:links` | Send in-app notifications to users, character owners or group members |
   | Logs | `logs:audit`, `logs:requests`, `logs:service`, `logs:esi` | Audit, API request, service and ESI call logs |
   | Plugins | `p.<plugin>:<scope>` | Whatever a plugin offers; only while the plugin is enabled |

2. **Administration > API > Keys:** create a key for each service with only the scopes it needs. You can
   limit a key to IP addresses or CIDR ranges and give it an expiry date. The secret (`evk_...`) is shown
   once. EvE Conduit keeps only a hash of it. If a secret is lost, revoke the key and create a new one.

3. The service sends the key with every request:

   ```bash
   curl -H "Authorization: Bearer evk_..." https://auth.example.com/api/v1/me
   ```

   `X-API-Key: evk_...` works too. `/api/v1/me` needs no scope and shows the key's scopes and which APIs
   are switched on. A browser session doesn't count: the external API accepts only keys.

## Errors

- `401`: no key, a wrong key, or a revoked or expired key.
- `403`: the key isn't allowed from this IP, the API is switched off, or the key lacks the scope.
  The `detail` field says which.
- `404`: the object doesn't exist, or the API belongs to a plugin that is disabled.

Lists take `limit` (at most 500) and `offset`, and return `{"items": [...], "count": n}`.

## Polling the logs

`/api/v1/logs/audit`, `/logs/snooper`, `/logs/requests`, `/logs/service` and `/logs/esi` return entries oldest first after `after_id`,
plus `next_after_id`. Store that number and pass it on the next poll, and no entry is missed or repeated:

```bash
curl -H "Authorization: Bearer evk_..." "https://auth.example.com/api/v1/logs/audit?after_id=0&limit=500"
```

`since=<ISO date>` skips older entries on the first poll.

## What gets logged

- **Audit log:** sign-ins and sign-outs, characters added, removed or made main, groups and states
  created, changed or deleted, group joins, leaves and member changes, plugin and site settings changes,
  first-run setup, and API keys and APIs. Changes made through the API name the key that made them.
- **Snooper log:** every time someone opens a character sheet that isn't theirs (HR, recruiters,
  directors with the `sheet.view_*_characters` permissions or a plugin's sheet access): who looked, at
  which character and whose it is, which section, and from which IP. Looking at your own characters is
  never recorded. The same person, character and section is recorded once per 10 minutes. While an admin
  is signed in as someone else, the admin is named as the viewer.
- **API request log:** every call to `/api/v1/`, refused ones included: key, method, path, status,
  duration, IP and user agent.
- **Service log:** warnings and errors the web server and worker log (turn this off with
  `CONDUIT_SERVICE_LOG_DB=false`). The Windows install also shows its log files there.
  Elsewhere, set `CONDUIT_LOG_DIR` to the folder holding the log files.

- **ESI call log:** every request the server sends to ESI: route, character, what made the call (e.g.
  `sheet:wallet` or `eve.update_affiliations`), status, duration, and the error-limit and rate-limit
  headers. Calls held back during an error-limit pause are listed too. Answers still fresh in the local
  cache never reach ESI and aren't listed. The ESI tab adds totals, calls per hour, the busiest routes
  and callers, and the current error limit. `CONDUIT_ESI_LOG=errors` records only failures; `off` records
  nothing.

Admins see all five under **Administration > Logs** (permission `site.view_logs`). Managing keys and
switching APIs on and off needs `site.manage_api`.

Old entries are deleted every night. The defaults are 365 days for the audit and snooper logs, 90 for the request log,
30 for the service log and 7 for the ESI call log (`CONDUIT_AUDIT_LOG_DAYS`, `CONDUIT_SNOOP_LOG_DAYS`, `CONDUIT_API_LOG_DAYS`,
`CONDUIT_SERVICE_LOG_DAYS`, `CONDUIT_ESI_LOG_DAYS`; `0` keeps entries forever).

## Adding an external API to a plugin

```python
class FleetsModule(Plugin):
    id = "fleets"
    external_api = "conduit_fleets.external:router"
    external_scopes = {"read": "Read fleet schedules", "write": "Create fleets"}
```

```python
# conduit_fleets/external.py
from ninja import Router
from conduit.external.auth import require_scope

router = Router()

@router.get("/schedule")
@require_scope("p.fleets:read")
def schedule(request):
    return [...]
```

The router is mounted at `/api/v1/p/fleets/`. It appears under Administration > API as its own API,
which an admin switches on separately. Scope names containing `write` are flagged as write access.

## Sending notifications

With the Notifications API on and a key holding `notify:write`, a bot can ping people inside EvE Conduit:

```bash
curl -X POST -H "Authorization: Bearer evk_..." -H "Content-Type: application/json" \
  -d '{"group_ids": [4], "title": "Form up in Jita", "body": "Doctrine: Ferox", "link": "/p/fleets", "level": "warning"}' \
  https://auth.example.com/api/v1/notifications
```

Recipients are the union of `user_ids`, the owners of `character_ids` and the members of `group_ids`. `level` is
`info`, `success`, `warning` or `danger`; `category` (default `system`) lets people mute kinds of notifications.
`link` is a path on the site (`/p/fleets`). Links to other sites (`https://...`) also need the `notify:links` scope,
so a leaked bot key can't be used to send members phishing links; people are still asked before they leave the site. The reply says how many people got it (`sent`) out of how many
were addressed (`recipients`); the difference muted that category.
