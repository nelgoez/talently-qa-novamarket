# Tool & Platform Integration — Playbook

> **Why this exists.** Wiring an external tool or platform (Trello, Google Drive, an MCP,
> a CLI, a cloud API) into this repo is the most failure-prone kind of work the agent does,
> because the failures are not in _our_ code but in the _foreign_ system's auth model, quota,
> and format semantics. This doc records the validated approach and the specific gotchas the
> Drive + Trello wiring surfaced, so a future session does not re-derive them from scratch.
> Read it before touching Drive, Trello, or any new platform integration.

---

## 1. The method (do these in order)

1. **Research before wiring.** Official, current semantics from `[DOCS_TOOL]` (Context7);
   community-known breakage and deprecations from `[WEB_SEARCH_TOOL]` (Tavily). Never wire a
   foreign system from memory: the shared-client retirement below is exactly the kind of thing
   that is only discoverable in the live docs/forum, not in recalled knowledge.
2. **Validate the three invariants before writing any config:**
   - **Auth model** — what credentials exist? Do _any_ exist yet? (Here: no GCP OAuth client
     existed, which forced the rclone path.)
   - **Quota / rate limits** — shared credentials are throttled collectively; check before
     assuming "it works, it just needs a token."
   - **Format semantics** — e.g. "native Google Sheet" vs "a file that happens to be a .xlsx".
     Verify _how_ a platform creates the artifact type you want, not just that it uploads a file.
3. **Wire at repo level**, never ad hoc: MCP parity across all three harnesses
   (`.mcp.json` + `opencode.jsonc` + `.codex/config.toml`, AGENTS.md §4.5), credentials in
   `.env` (gitignored), identity/IDs in `.agents/project.yaml`.
4. **Verify with the platform's own API, not the CLI wrapper.** CLIs like `rclone` can exit 0
   while an underlying call silently failed under rate limit. The Drive REST API
   (`files.get` / `files.list`) is the authoritative state. Confirm name, MIME type, and
   shareable link before declaring done.
5. **Record gotchas as durable knowledge.** Every silent failure is a trap for the next
   session. It goes in this doc, not in a session summary that gets archived.

---

## 2. Case study: Google Drive via `rclone`

### 2.1 Auth — the shared client_id is dead walking

- rclone ships a **shared `client_id`** that Google is **retiring during 2026** (heavily abused,
  far over quota, now being charged for). It triggers frequent `403 Quota exceeded ...
rateLimitExceeded` against `project_number:202264815644` — this is the rate limit this repo hit.
- **Correct fix: create your own OAuth `client_id` + `client_secret`** on the remote.
  Reference: <https://rclone.org/drive/#making-your-own-client-id>.
- **Service account is NOT viable here**: `NOVAMARKET` is "shared with me", and a service account
  can only reach a folder its email was explicitly shared with — which requires the _owner_ to act.
  An OAuth personal client keeps using your own account's edit access to the shared folder, no
  owner cooperation needed.
- Until the own-client exists, mitigate with `--tpslimit 8` (Google default ~10 queries/sec),
  `--tpslimit-burst 1`, `--transfers 4`, `--fast-list`.

**Long-term fix (done 2026-09-18 for this repo — steps kept as reference for new setups):**

1. Google Cloud Console → create a project (or reuse) → enable **Drive API**.
2. **OAuth consent screen** → External → add yourself as a test user (Testing is fine for a QA tool).
3. **Credentials → Create credentials → OAuth client ID → Desktop app** → note `client_id` + `client_secret`.
4. Wire them into rclone and re-authorize:
   ```sh
   rclone config update gdrive client_id=<id> client_secret=<secret>
   rclone authorize "drive" <id> <secret>            # browser consent → paste the token JSON
   rclone config update gdrive token='<json>'
   ```
5. Verify the 403s are gone:
   `rclone lsjson gdrive: --drive-root-folder-id <QA_FOLDER_ID> --fast-list`

Gotcha: an OAuth app kept in **Testing** mode expires its refresh token **weekly**. Publish the
app (External, team-only) or accept the weekly re-auth.

#### Publishing (stop the 7-day refresh-token expiry)

An OAuth app left in **Testing** mode drops its refresh token every **7 days** — that is the
`401` that forces a re-auth. Publishing stops it. This is a runbook, not code:

1. **Publish the app (preferred, one-time).** Google Cloud Console → the project →
   **OAuth consent screen** → (the app is already **External**, from the §2.1 setup) →
   click **Publish app**. This moves the consent screen into production. Because this is a
   single-user QA tool whose only "user" is the test user already listed, Google's
   _unverified-app_ warning is harmless: it appears only to people you have not whitelisted,
   and there are none. After publishing, the refresh token no longer expires weekly.
2. **Verify the token survives.** Re-run the §2.1 verification
   (`rclone lsjson gdrive: --drive-root-folder-id <QA_FOLDER_ID> --fast-list`). No `403` and
   no `401` means the expiry is gone for good.

**Fallback — keep Testing and re-auth weekly.** If publishing is blocked (no GCP billing,
org policy, or the consent screen cannot move to production), stay in **Testing** mode and
re-authorize each time the refresh token lapses:

1. `rclone authorize "drive" <client_id> <client_secret>` — browser consent → paste the
   token JSON.
2. `rclone config update gdrive token='<json>'` — store the fresh token back into the
   `gdrive` remote.
3. Confirm with the §2.1 verification command.

This is the weekly chore publishing removes. The `client_id` / `client_secret` live in
`.auth/google-oauth-client.json` (gitignored) when the own-client setup from §2.1 was run.

### 2.2 Creating native Google Docs / Sheets (not just files)

- Uploading a file ≠ creating a native Google Doc/Sheet. Native conversion is driven by
  `--drive-import-formats` and is **off by default because it is lossy**.
- **The rule that bit us:** the import extension must survive `--drive-export-formats`
  unchanged, or rclone errors with `can't convert ".csv" to a document with a different export
filetype (".xlsx")`. Two ways to satisfy it:
  - Import an extension that already matches the type's export format: `.xlsx` → Sheet,
    `.docx` → Doc (both in the default export list), or
  - Add `--drive-allow-import-name-change` to permit the rename (e.g. `.html` → Doc, `.csv` →
    Sheet).
- **`--drive-root-folder-id` sets the remote root.** With root = `/QA`, write to `gdrive:name`,
  **not** `gdrive:/QA/name` — the latter creates a _nested_ `QA` folder inside `/QA`. This is
  how the stray child `QA` folder was born.

### 2.3 Correct commands (copy-paste shape)

```sh
# Sheet (native) from a .xlsx — extension matches default export, no extra flag needed
rclone copyto "matriz.xlsx" "gdrive:Matriz de pruebas - QA-9.xlsx" \
  --drive-root-folder-id <QA_FOLDER_ID> \
  --drive-import-formats xlsx --tpslimit 8 --fast-list

# Doc (native) from a .html — extension change permitted
rclone copyto "propuesta.html" "gdrive:Propuesta AC - v0.1.html" \
  --drive-root-folder-id <QA_FOLDER_ID> \
  --drive-import-formats html --drive-allow-import-name-change --tpslimit 8
```

### 2.4 Authoritative verification (use this, not rclone's listing)

rclone _presents_ Google-native files with their export extension and `Size:-1`
(`Size:-1` = native Google file; a real upload would show a positive byte size). The Drive API
returns the truth — clean name, real MIME type, and the shareable link:

```sh
TOKEN=$(rclone config show gdrive | grep -o '"access_token":"[^"]*"' | head -1 | sed 's/.*://;s/"//')
curl -s "https://www.googleapis.com/drive/v3/files?q='<QA_FOLDER_ID>'+in+parents&fields=files(id,name,mimeType,webViewLink)" \
  -H "Authorization: Bearer $TOKEN"
```

- `application/vnd.google-apps.spreadsheet` → `https://docs.google.com/spreadsheets/d/<id>/edit`
- `application/vnd.google-apps.document` → `https://docs.google.com/document/d/<id>/edit`

### 2.5 Silent-failure trap

`rclone deletefile` / `rmdir` returned exit 0 while the file/folder actually survived (the
probe file stayed behind inside the child `QA` folder). Under rate limit the CLI can lie.
Always confirm a delete with a Drive API `files.list`, and delete by **ID** via
`curl -X DELETE .../files/<id>` rather than by path.

---

## 3. Case study: Trello via the `trello` CLI

- JSON-first, self-documenting (`trello <resource> <verb> --help`). Auth from
  `TRELLO_API_KEY` + `TRELLO_TOKEN` in `.env`.
- Card identity = Trello's own card number, slug = `{LABEL}-{number}` (`QA-9`). Never a
  hand-assigned `-NNN`.
- ACs live in the card **checklist**; test results in **comments**; the Drive **matrix** holds
  the feature↔test traceability. Card description carries the `## Test Matrix` / `## Docs`
  links back to Drive (bidirectional).
- Discipline is a **label**, not a title prefix; renaming cards / normalizing labels is a PO/EM
  call, not QA's to execute unilaterally.

---

## 4. File-format map (ratified)

| Artifact                       | Format           | Why                                                              |
| ------------------------------ | ---------------- | ---------------------------------------------------------------- |
| Traceability matrix            | **Google Sheet** | tabular, filterable, AI/API read-write cells                     |
| Proposals / briefs / decisions | **Google Doc**   | inline team review; `.md` stays in git as the diffable source    |
| Ratified snapshot              | **PDF**          | read-only release                                                |
| `.md`                          | **git only**     | authoring + version control; never the human-facing Drive format |

---

## 5. Drive file naming convention

Mirrors the observed team convention (`Minuta_Kickoff_NovaMarket_S2621_v2.pdf`,
`NovaMarket_<area>_PropuestaTecnica_<version>`), adapted to QA:

```
NovaMarket_<SLUG>_<TYPE>_v<version>
```

- `<SLUG>` = the Trello card slug (`QA-9`), which already encodes the area (`QA`) + the stable
  Trello card number. Including it makes the Drive file trace back to the card with a predictable
  identifier, and disambiguates when one area has several cards.
- `<TYPE>` = the artifact type in camelCase, not a generic "PropuestaTecnica":
  `MatrizDePruebas` (test matrix), `PropuestaAC` (acceptance-criteria proposal), `Minuta`, etc.
- `<version>` = `v0.1`, `v1`, … — Drive revision history is the version for _edits_; the `v` token
  marks _released_ milestones.

Examples: `NovaMarket_QA-9_MatrizDePruebas_v0.1` · `NovaMarket_QA-9_PropuestaAC_v0.1`.
Team adoption is a suggestion to the rest of the areas, not a QA unilateral rename of their files.

---

## 6. Current wired state (2026-09-18)

- Drive folder `NOVAMARKET` → `/QA` = `1VSV-Wiw53rSwVKRRvxnuejpvHx08-LMn`.
- rclone remote `gdrive` — **own OAuth `client_id` wired** (client JSON backup at
  `.auth/google-oauth-client.json`, gitignored; token in rclone's local config).
- `QA-9` card → Sheet `NovaMarket_QA-9_MatrizDePruebas_v0.1`
  (`1k6mbYXUFk3qLmOwB9EcDcK-iQGebwOD2n16mARCLexA`) + Doc `NovaMarket_QA-9_PropuestaAC_v0.1`
  (`1uyw4pEPaasQnx6rLWi1aUjJMete1NsAL4z807_XspN4`), linked bidirectionally from the card.
- Note: the OAuth app is in Testing mode, so the refresh token expires **weekly** — when a `401`
  appears, re-run `rclone authorize "drive" <client_id> <client_secret>` (§2.1).
