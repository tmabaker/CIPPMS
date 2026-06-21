# CLAUDE.md — CIPPMS (CIPP-based MSP portal, frontend)

> Auto-loaded by Claude Code at session start. Shared NOIT access/credential
> map below so sessions don't re-derive the environment. The **canonical,
> fuller** copy + ops skills live in the `noit-client-tools` repo
> (`CLAUDE.md`, `.claude/skills/noit-ops`, `.claude/skills/azure-ops`).
> **Never put secret VALUES in this file** — names/IDs/procedures only.
>
> ⚠️ To auto-load in fresh web sessions, this must be on the repo's **default branch**.

## What this repo is
- CIPP-based **MSP portal** (Next.js SPA). Deployed to Azure Static Web App
  **`cipp-swa-orq6j`** (host `agreeable-stone-060c94b0f…`, subscription
  `e9251b04-…`). Pairs with the **`CIPPMS-API`** repo (Azure Functions).
- Frontend calls `/api/ListTenants`, `/api/ListLicenses`, etc. `Failed to fetch`
  on those = API down / CORS / auth, not a frontend bug — check the API + SWA.

## NOIT environment access (verified 2026-06-21)
- **AWS Secrets Manager** — creds in env vars (`AWS_ACCESS_KEY_ID` /
  `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION=us-east-1`). IAM user
  `claude_agent`; **read-only, scoped to `noit/*`** (`ListSecrets`/`Batch…`
  DENIED — `GetSecretValue` by exact name only). `pip3 install boto3` first.
- **Reachable hosts:** `graph.microsoft.com`, `management.azure.com`,
  `login.microsoftonline.com`. Most others blocked by the network allowlist.
- **M365 connector** (MCP) — acts as Tammy for SharePoint/mail/Teams/calendar.
- **Taila Agent** identity: AppId `90f52d62-9133-47e0-a6a1-45c9bec69558`, secret
  AWS `noit/0626_MSClaudeAgent` (**inverted storage**: JSON `{"<secret-value>":
  "<secret-id>"}` — the key is the value), NOIT tenant
  `7fb15bf6-9cea-4c72-89bd-1ab9f16eec8e`. App-only; has Graph
  `User.Read.All`/`Device.Read.All`/etc. but **not** `Application.ReadWrite.All`.
- **CIPP credentials:** AWS secret `noit/cipp`
  (`{base_url,client_id,client_secret,tenant_id,scope}`) per the `noit-ops`
  skill — client-credentials token, then `GET {base_url}/api/ListTenants` is the
  authoritative client tenant-ID source. Role is admin → treat client writes as
  needing explicit per-action OK.

## Bootstrap snippet (mint a Graph/ARM token as Taila Agent)
```python
import boto3, json
raw = boto3.client('secretsmanager','us-east-1').get_secret_value(SecretId='noit/0626_MSClaudeAgent')['SecretString']
secret = next(iter(json.loads(raw).keys()))   # INVERTED: key = secret value
cid="90f52d62-9133-47e0-a6a1-45c9bec69558"; tid="7fb15bf6-9cea-4c72-89bd-1ab9f16eec8e"
# POST login.microsoftonline.com/{tid}/oauth2/v2.0/token, scope .../.default
```

## Pointers
- Fuller runbooks + connection-test matrix: `noit-client-tools/.claude/skills/`
  (`noit-ops`, `azure-ops`) and that repo's `CLAUDE.md`.
- Standing rule: never print/commit secret values — names and booleans only.
