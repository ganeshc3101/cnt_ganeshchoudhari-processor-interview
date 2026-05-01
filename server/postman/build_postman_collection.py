#!/usr/bin/env python3
r"""
Regenerates `Processor-API.postman_collection.json` and the two environment JSON files
next to this script. Run when you add/change API requests: `python3 server/postman/build_postman_collection.py`

If you do not change the collection, you do not need to run it — use the committed JSON in Git.
For day-to-day API testing, only import the collection + `Processor-API.local` environment in Postman.
"""
import json
from pathlib import Path
from typing import Any, Dict, List


def url(raw: str) -> dict:
    raw = raw.replace("{{baseUrl}}", "{{baseUrl}}", 1)
    tail = raw.split("://", 1)[-1] if "://" in raw else raw
    if tail.startswith("{{baseUrl}}"):
        path_part = tail.replace("{{baseUrl}}", "").lstrip("/")
    else:
        path_part = raw.lstrip("/")
    if not path_part or path_part == "":
        path_arr = [""]
    else:
        path_arr = path_part.split("/")
    return {"raw": raw, "host": ["{{baseUrl}}"], "path": path_arr}


def req(
    name: str,
    method: str,
    raw: str,
    *,
    body=None,
    formdata=None,
    auth: str | None = None,
    desc: str | None = None,
    tests: str | None = None,
) -> dict:
    headers = []
    if body and not formdata and method in ("POST", "PUT", "PATCH", "DELETE"):
        headers.append({"key": "Content-Type", "value": "application/json"})
    if auth:
        headers.append({"key": "Authorization", "value": f"Bearer {{{{{auth}}}}}"})
    r = {
        "name": name,
        "request": {
            "method": method,
            "header": headers,
            "url": url(raw),
        },
    }
    if desc:
        r["request"]["description"] = desc
    if formdata is not None:
        r["request"]["body"] = {"mode": "formdata", "formdata": formdata}
    elif body is not None:
        if isinstance(body, (dict, list)):
            r["request"]["body"] = {
                "mode": "raw",
                "raw": json.dumps(body, indent=2),
                "options": {"raw": {"language": "json"}},
            }
        else:
            r["request"]["body"] = {
                "mode": "raw",
                "raw": body,
                "options": {"raw": {"language": "json"}},
            }
    if tests:
        r["event"] = [
            {
                "listen": "test",
                "script": {"exec": tests.split("\n"), "type": "text/javascript"},
            }
        ]
    return r


def folder(name: str, description: str, items: list) -> dict:
    return {"name": name, "description": description, "item": items}


def login(name: str, user: str, var: str, desc: str) -> dict:
    # Postman variable {{seedPassword}} must appear literally in the JSON body
    raw_json = (
        "{\n"
        f'  "username": "{user}",\n'
        '  "password": "{{seedPassword}}"\n'
        "}"
    )
    tests = f"""pm.test("HTTP 200", function() {{ pm.response.to.have.status(200); }});
var j = pm.response.json();
pm.test("accessToken present", function() {{ pm.expect(j.accessToken).to.be.a("string").that.is.not.empty; }});
if (j.accessToken) {{ pm.collectionVariables.set("{var}", j.accessToken); }}"""
    r = req(
        name, "POST", "{{baseUrl}}/api/v1/auth/login", body=raw_json, desc=desc, tests=tests
    )
    r["request"]["body"] = {
        "mode": "raw",
        "raw": raw_json,
        "options": {"raw": {"language": "json"}},
    }
    return r


B = "{{baseUrl}}"

collection = {
    "info": {
        "name": "Processor API",
        "description": r"""## Card Transaction Processor

### Environments (import both from `server/postman/`)
1. **Processor API — Local** — use for day-to-day: sets `baseUrl`, `seedPassword`, and local DB hints. **Select this in the environment dropdown** before sending requests.
2. **Processor API — Production (sample)** — same *shape* as local; `baseUrl` is a placeholder. Replace with your real host before any real run. `seedPassword` is still the dev **sample** only (not a real secret).

`token*` and `lastTransactionId` are **collection** variables (filled by test scripts or by you), not the env files.

### App setup
1. Run PostgreSQL and `server/scripts/db_setup.sh` (or `db_setup.ps1`). Set **`seedPassword`** to the **plaintext** you used in Java to generate the BCrypt hashes in `09_seed_admin_user.sql` (must be 12–128 chars per API validation).
2. **Seeded users** (one password, different roles for RBAC tests):
   - **`admin`** — SUPER_ADMIN
   - **`org_admin`** — ADMIN
   - **`operator`** — OPERATOR
   - **`analyst`** — ANALYST
   - **`viewer`** — VIEWER
3. **Collection Runner order**: run folder **1. Auth** first (or the whole collection top-to-bottom) to populate `token*`.
4. **Batch upload (folder 3)**: set form field **`file`** to `server/postman/sample-batch.csv`.

### RBAC (negative tests in this collection)
- **ANALYST** — no `TRANSACTIONS_WRITE` / `BATCHES_WRITE` → 403 on create transaction and batch.
- **VIEWER** — no `TRANSACTIONS_WRITE` / `BATCHES_WRITE`; no `AUDIT_LOGS_READ` → 403 on list activity-logs, but can POST activity.
- **OPERATOR** — has batch + txn write; **no** `AUDIT_LOGS_READ` → 403 on **GET** `/activity-logs` (can POST activity).""",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "",
        },
        {
            "key": "seedPassword",
            "value": "",
        },
        {"key": "tokenAdmin", "value": ""},
        {"key": "tokenOrgAdmin", "value": ""},
        {"key": "tokenOperator", "value": ""},
        {"key": "tokenAnalyst", "value": ""},
        {"key": "tokenViewer", "value": ""},
        {"key": "lastTransactionId", "value": ""},
    ],
    "item": [],
}

# 0. Public
collection["item"].append(
    folder(
        "0. Public (no auth)",
        "Static HTML at `/` and `/help` — no JWT.",
        [
            req("GET / — help HTML (200)", "GET", f"{B}/", desc="Returns `api-help.html`."),
            req("GET /help (200)", "GET", f"{B}/help", desc="Same content as `/`."),
        ],
    )
)

# 1. Auth
auth = [
    login("Login — admin (SUPER_ADMIN)", "admin", "tokenAdmin", "Stores JWT in `tokenAdmin`."),
    login("Login — org_admin (ADMIN)", "org_admin", "tokenOrgAdmin", "All perms except USERS_DELETE (no user APIs here)."),
    login("Login — operator (OPERATOR)", "operator", "tokenOperator", "Write txns + batches; no audit **list**."),
    login("Login — analyst (ANALYST)", "analyst", "tokenAnalyst", "Read txns; no manual create; has audit list."),
    login("Login — viewer (VIEWER)", "viewer", "tokenViewer", "Read-only txns/reports; no write txn or batch; no audit list."),
    req(
        "Login — NEG: wrong password (401)",
        "POST",
        f"{B}/api/v1/auth/login",
        body={"username": "admin", "password": "not-the-real-password-xyz"},
        desc="Invalid credentials → AUTH_FAILED.",
        tests="""pm.test("HTTP 401", function() { pm.response.to.have.status(401); });
var j = pm.response.json();
pm.test("body code", function() { pm.expect(j.code).to.equal("AUTH_FAILED"); });""",
    ),
    req(
        "Login — NEG: password too short (400)",
        "POST",
        f"{B}/api/v1/auth/login",
        body={"username": "admin", "password": "short"},
        desc="Password must be 12–128 characters.",
        tests="""pm.test("HTTP 400", function() { pm.response.to.have.status(400); });
pm.test("VALIDATION_ERROR", function() { pm.expect(pm.response.json().code).to.equal("VALIDATION_ERROR"); });""",
    ),
    req(
        "GET /api/v1/auth/me — admin (200)",
        "GET",
        f"{B}/api/v1/auth/me",
        auth="tokenAdmin",
        desc="Expect `roleCodes` to include `SUPER_ADMIN` and a non-empty `permissionCodes` array.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });
var j = pm.response.json();
pm.test("roles", function() { pm.expect(j.roleCodes).to.include("SUPER_ADMIN"); });
pm.test("email", function() { pm.expect(j.email).to.include("admin@"); });""",
    ),
    req(
        "GET /me — NEG: no token (401)",
        "GET",
        f"{B}/api/v1/auth/me",
        desc="Missing Authorization → 401.",
        tests="""pm.test("HTTP 401", function() { pm.response.to.have.status(401); });""",
    ),
    req(
        "GET /me — NEG: invalid JWT (401)",
        "GET",
        f"{B}/api/v1/auth/me",
        desc="Bogus Bearer value.",
        tests="""pm.test("HTTP 401", function() { pm.response.to.have.status(401); });""",
    ),
]
auth[-1]["request"]["header"] = [
    {"key": "Authorization", "value": "Bearer not.a.valid.jwt"}
]

auth.extend(
    [
        req(
            "POST /api/v1/auth/logout (204)",
            "POST",
            f"{B}/api/v1/auth/logout",
            body="",
            auth="tokenAdmin",
            desc="Revokes session for this JWT. Re-run **Login — admin (again)** before protected calls if you need a fresh token after other tests.",
            tests="""pm.test("204 No Content or 200", function() { pm.expect([200, 204]).to.include(pm.response.code); });""",
        ),
    ]
)
# clear body for logout - use empty raw without application/json? Spring might accept empty. Remove content-type
logout = auth[-1]
logout["request"]["header"] = [h for h in logout["request"]["header"] if h.get("key") != "Content-Type"]
if "body" in logout["request"]:
    del logout["request"]["body"]

auth.append(
    login(
        "Login — admin (again) refresh token",
        "admin",
        "tokenAdmin",
        "Re-login after **logout** so `tokenAdmin` is valid for folders 2–5.",
    )
)

collection["item"].append(
    folder(
        "1. Auth",
        "Login, `/me`, optional logout. **`{{seedPassword}}`** = plaintext matching `09_seed_admin_user.sql` hashes.",
        auth,
    )
)

# 2. Transactions
tx_body_ok = {
    "cardholderName": "Postman Test",
    "cardNumber": "4111111111111111",
    "amount": 25.5,
    "currency": "USD",
}
tx_create_one = [tx_body_ok]
tx_create_bulk = [
    tx_body_ok,
    {
        "cardholderName": "Postman Bulk 2",
        "cardNumber": "5555555555554444",
        "amount": 10.0,
        "currency": "USD",
    },
]
transactions = [
    req(
        "POST /transactions — create manual (201) JSON array",
        "POST",
        f"{B}/api/v1/transactions",
        body=tx_create_one,
        auth="tokenAdmin",
        desc="Requires `TRANSACTIONS_WRITE`. Body must be a **non-empty JSON array** of transaction objects. Saves `lastTransactionId` from the first created row (for GET-by-id next).",
        tests="""pm.test("HTTP 201", function() { pm.response.to.have.status(201); });
var j = pm.response.json();
pm.test("array response", function() { pm.expect(j).to.be.an("array").that.is.not.empty; });
pm.collectionVariables.set("lastTransactionId", j[0].id);
pm.test("masked PAN", function() { pm.expect(j[0]).to.have.property("cardLast4"); });""",
    ),
    req(
        "POST /transactions — create manual bulk 2 rows (201)",
        "POST",
        f"{B}/api/v1/transactions",
        body=tx_create_bulk,
        auth="tokenAdmin",
        desc="Creates two accepted transactions in one request; rolls back entirely if any row fails validation or processing.",
        tests="""pm.test("HTTP 201", function() { pm.response.to.have.status(201); });
var j = pm.response.json();
pm.test("two created", function() { pm.expect(j).to.be.an("array").with.lengthOf(2); });""",
    ),
    req(
        "POST /transactions — NEG: invalid card (400)",
        "POST",
        f"{B}/api/v1/transactions",
        body=[{**tx_body_ok, "cardNumber": "41"}],
        auth="tokenAdmin",
        desc="`cardNumber` must be 12–19 digits.",
        tests="""pm.test("HTTP 400", function() { pm.response.to.have.status(400); });
pm.test("code", function() { pm.expect(pm.response.json().code).to.equal("VALIDATION_ERROR"); });""",
    ),
    req(
        "POST /transactions — NEG: empty array (400)",
        "POST",
        f"{B}/api/v1/transactions",
        body=[],
        auth="tokenAdmin",
        desc="Body must be a non-empty JSON array.",
        tests="""pm.test("HTTP 400", function() { pm.response.to.have.status(400); });""",
    ),
    req(
        "GET /transactions/{id} (200)",
        "GET",
        f"{B}/api/v1/transactions/" + "{{lastTransactionId}}",
        auth="tokenAdmin",
        desc="Requires `TRANSACTIONS_READ`.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /transactions/{id} — NEG: not found (404)",
        "GET",
        f"{B}/api/v1/transactions/00000000-0000-0000-0000-000000000000",
        auth="tokenAdmin",
        desc="NOT_FOUND.",
        tests="""pm.test("HTTP 404", function() { pm.response.to.have.status(404); });
pm.test("code", function() { pm.expect(pm.response.json().code).to.equal("NOT_FOUND"); });""",
    ),
    req(
        "GET /transactions — list paged (200)",
        "GET",
        f"{B}/api/v1/transactions?page=0&size=10",
        auth="tokenAdmin",
        desc="Optional filters: from, to, cardBrands, minAmount, maxAmount.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });
var j = pm.response.json();
pm.test("paged", function() { pm.expect(j).to.have.property("content"); });""",
    ),
    req(
        "POST /transactions — NEG: analyst (403)",
        "POST",
        f"{B}/api/v1/transactions",
        body=tx_create_one,
        auth="tokenAnalyst",
        desc="ANALYST has no `TRANSACTIONS_WRITE`.",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });
pm.test("FORBIDDEN", function() { pm.expect(pm.response.json().code).to.equal("FORBIDDEN"); });""",
    ),
    req(
        "POST /transactions — NEG: viewer (403)",
        "POST",
        f"{B}/api/v1/transactions",
        body=tx_create_one,
        auth="tokenViewer",
        desc="VIEWER has no `TRANSACTIONS_WRITE`.",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });""",
    ),
    req(
        "GET /transactions — viewer read (200)",
        "GET",
        f"{B}/api/v1/transactions?page=0&size=5",
        auth="tokenViewer",
        desc="`TRANSACTIONS_READ` is allowed for VIEWER.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
]
collection["item"].append(
    folder(
        "2. Transactions",
        "Manual create (POST body = JSON **array** of txn objects), get by id, list. **Requires `lastTransactionId` from the create request.**",
        transactions,
    )
)

# 3. Batch
batch = [
    req(
        "POST /transactions/batch — operator (202)",
        "POST",
        f"{B}/api/v1/transactions/batch",
        formdata=[
            {
                "key": "file",
                "type": "file",
                "src": [],
                "description": "Select `server/postman/sample-batch.csv`",
            },
            {"key": "format", "value": "csv", "type": "text", "description": "Use `csv`"},
        ],
        auth="tokenOperator",
        desc="**Body → form-data:** attach `file` and text field `format`=`csv`. Requires `BATCHES_WRITE`.",
        tests="""pm.test("HTTP 202", function() { pm.response.to.have.status(202); });""",
    ),
    req(
        "POST /transactions/batch — NEG: analyst (403)",
        "POST",
        f"{B}/api/v1/transactions/batch",
        formdata=[
            {"key": "file", "type": "file", "src": []},
            {"key": "format", "value": "csv", "type": "text"},
        ],
        auth="tokenAnalyst",
        desc="ANALYST has no `BATCHES_WRITE`.",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });""",
    ),
    req(
        "POST /transactions/batch — NEG: viewer (403)",
        "POST",
        f"{B}/api/v1/transactions/batch",
        formdata=[
            {"key": "file", "type": "file", "src": []},
            {"key": "format", "value": "csv", "type": "text"},
        ],
        auth="tokenViewer",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });""",
    ),
]
collection["item"].append(
    folder(
        "3. Batch (multipart)",
        "**Attach `postman/sample-batch.csv`** in each `file` field. Import path is relative to repo root.",
        batch,
    )
)

# 4. Reports
reports = [
    req(
        "GET /reports/metrics (200) — viewer",
        "GET",
        f"{B}/api/v1/reports/metrics",
        auth="tokenViewer",
        desc="`REPORTS_READ` — all seeded roles have it.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /reports/daily-volume (200) — org_admin, no params",
        "GET",
        f"{B}/api/v1/reports/daily-volume",
        auth="tokenOrgAdmin",
        desc="Default window: last **90 days** through now when `from` / `to` are omitted.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /reports/daily-volume (200) — org_admin, with from & to",
        "GET",
        f"{B}/api/v1/reports/daily-volume?from=2026-01-01T00:00:00.000Z&to=2026-06-01T00:00:00.000Z",
        auth="tokenOrgAdmin",
        desc="Explicit ISO-8601 `from` and `to` (half-open interval [from, to) in the service).",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /reports/card-distribution (200) — admin",
        "GET",
        f"{B}/api/v1/reports/card-distribution",
        auth="tokenAdmin",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /reports/metrics — NEG: no token (401)",
        "GET",
        f"{B}/api/v1/reports/metrics",
        desc="Unauthenticated reports request.",
        tests="""pm.test("HTTP 401", function() { pm.response.to.have.status(401); });""",
    ),
]
collection["item"].append(
    folder(
        "4. Reports",
        "Optional query params: `from`, `to` (ISO-8601 instants). "
        "`daily-volume` defaults to the **last 90 days** when both are omitted; other report endpoints use a shorter default.",
        reports,
    )
)

# 5. Activity
activity = [
    req(
        "GET /activity-logs — admin (200)",
        "GET",
        f"{B}/api/v1/activity-logs?page=0&size=20",
        auth="tokenAdmin",
        desc="Requires `AUDIT_LOGS_READ`.",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /activity-logs — analyst (200)",
        "GET",
        f"{B}/api/v1/activity-logs",
        auth="tokenAnalyst",
        desc="ANALYST can list audit (has `AUDIT_LOGS_READ`).",
        tests="""pm.test("HTTP 200", function() { pm.response.to.have.status(200); });""",
    ),
    req(
        "GET /activity-logs — NEG: operator (403)",
        "GET",
        f"{B}/api/v1/activity-logs",
        auth="tokenOperator",
        desc="OPERATOR lacks `AUDIT_LOGS_READ` (only WRITE for client events).",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });""",
    ),
    req(
        "GET /activity-logs — NEG: viewer (403)",
        "GET",
        f"{B}/api/v1/activity-logs",
        auth="tokenViewer",
        desc="VIEWER has no `AUDIT_LOGS_READ`.",
        tests="""pm.test("HTTP 403", function() { pm.response.to.have.status(403); });""",
    ),
    req(
        "POST /activity-logs — viewer (201)",
        "POST",
        f"{B}/api/v1/activity-logs",
        body={
            "action": "UI_CLICK",
            "resourceType": "button",
            "message": "postman",
            "metadata": {"source": "postman"},
        },
        auth="tokenViewer",
        desc="All seeded roles can POST (have `AUDIT_LOGS_WRITE`).",
        tests="""pm.test("HTTP 201", function() { pm.response.to.have.status(201); });""",
    ),
    req(
        "POST /activity-logs — NEG: bad action (400)",
        "POST",
        f"{B}/api/v1/activity-logs",
        body={
            "action": "lowercase_forbidden",
            "resourceType": "X",
            "message": "m",
        },
        auth="tokenAdmin",
        desc="`action` must match `[A-Z0-9_]+` per DTO validation.",
        tests="""pm.test("HTTP 400", function() { pm.response.to.have.status(400); });""",
    ),
]
collection["item"].append(
    folder(
        "5. Activity logs",
        "List requires `AUDIT_LOGS_READ` (e.g. admin, analyst). **Operator** and **viewer** get **403** on **GET** but may **POST** (WRITE).",
        activity,
    )
)

root = Path(__file__).resolve().parent

POSTMAN_ENV_SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/environment.json"
SAMPLE_PASSWORD = "ChangeMe!2026"


def write_environment(path: Path, name: str, eid: str, values: List[Dict[str, Any]]) -> None:
    """Postman v2.1 environment export."""
    body = {
        "id": eid,
        "name": name,
        "values": values,
        "_postman_variable_scope": "environment",
        "schema": POSTMAN_ENV_SCHEMA,
    }
    path.write_text(json.dumps(body, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {path}")


# Stable IDs so re-running the generator does not churn git diffs unnecessarily
ENV_ID_LOCAL = "a1000000-0000-4000-8000-000000000001"
ENV_ID_PROD = "a1000000-0000-4000-8000-000000000002"

# Local: full local-dev defaults (this is the one the collection is meant to use)
write_environment(
    root / "Processor-API.local.postman_environment.json",
    "Processor API — Local",
    ENV_ID_LOCAL,
    [
        {
            "key": "baseUrl",
            "value": "http://localhost:9091",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "seedPassword",
            "value": SAMPLE_PASSWORD,
            "type": "secret",
            "enabled": True,
        },
        {
            "key": "appPort",
            "value": "9091",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbHost",
            "value": "localhost",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbPort",
            "value": "5432",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbName",
            "value": "processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbUser",
            "value": "processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbJdbcUrl",
            "value": "jdbc:postgresql://localhost:5432/processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "seededUsernames",
            "value": "admin, org_admin, operator, analyst, viewer",
            "type": "default",
            "enabled": True,
        },
    ],
)

# Production: placeholder host, same *sample* credentials as local (not real secrets)
write_environment(
    root / "Processor-API.production.postman_environment.json",
    "Processor API — Production (sample)",
    ENV_ID_PROD,
    [
        {
            "key": "baseUrl",
            "value": "https://api.example.com",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "seedPassword",
            "value": SAMPLE_PASSWORD,
            "type": "secret",
            "enabled": True,
        },
        {
            "key": "appPort",
            "value": "443",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbHost",
            "value": "db.example.com",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbPort",
            "value": "5432",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbName",
            "value": "processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbUser",
            "value": "processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "dbJdbcUrl",
            "value": "jdbc:postgresql://db.example.com:5432/processor",
            "type": "default",
            "enabled": True,
        },
        {
            "key": "seededUsernames",
            "value": "admin, org_admin, operator, analyst, viewer",
            "type": "default",
            "enabled": True,
        },
    ],
)

out = root / "Processor-API.postman_collection.json"
out.write_text(json.dumps(collection, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Wrote {out}")
