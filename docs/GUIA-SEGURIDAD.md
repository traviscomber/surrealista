# Security Guide — Sur-Realista

**Status:** current security model, September 2026.

This document replaces older project notes that described a plaintext shared password. That credential was compromised by being committed to the public repository and was rotated on 2 September 2026.

No current credential is documented in this repository.

---

## Current internal-access model

Sur-Realista currently protects privileged application and API surfaces with a server-issued internal session.

```text
Password entered over HTTPS
        ↓
POST /api/internal-access
        ↓
Server-side PBKDF2 verification
        ↓
Rate-limit / lockout policy
        ↓
Signed short-lived session token
        ↓
httpOnly + SameSite=Strict cookie
        ↓
Middleware / API authorization
```

Important properties:

- the plaintext password is not stored in source code;
- the browser does not retain the password as an authorization token;
- successful login creates a signed `httpOnly` cookie;
- previous cookies are invalidated when the token version changes;
- privileged APIs validate the signed cookie server-side;
- scraper/admin APIs do not accept plaintext site passwords or alternate public headers;
- repeated failed authentication attempts are rate-limited;
- responses from the access endpoint use `private, no-store` caching.

Canonical implementation:

- `components/auth/password-gate.tsx`
- `app/api/internal-access/route.ts`
- `lib/auth/internal-access.ts`
- `lib/auth/internal-access-rate-limit.ts`
- `middleware.ts`
- `lib/scrapers/route-auth.ts`

---

## September 2026 credential incident

A legacy shared credential appeared in old public documentation and one obsolete client header.

Remediation completed:

1. the credential verifier was rotated;
2. the internal token version was incremented, invalidating old sessions;
3. the obsolete client authorization header was removed;
4. old quick-reference/final-documentation files exposing the credential were removed from the current branch;
5. privileged scraper/admin routes remain cookie-authenticated server-side;
6. repository search is part of the verification gate.

Git history is intentionally not rewritten as part of normal project curation. Because the old credential is no longer valid, its historical presence does not grant current access.

---

## Current authorization boundary

### Public pages

Public documentation/help pages may be reachable without the internal session according to `middleware.ts`.

### Privileged pages and APIs

Privileged routes require a valid internal access cookie. The authorization decision happens in middleware or the server route, not in client UI state.

A `sessionStorage` marker may be used only as a UX hint that a browser previously completed login. It is not an authorization credential and cannot substitute for the server cookie.

### Supabase authentication

The repository also contains Supabase Auth flows. These are separate from the current global internal-access boundary. Do not assume that any authenticated Supabase user is an internal operator.

A future migration from the shared internal gate to named operator accounts should use a server-controlled role/allowlist model, not user-editable profile metadata.

---

## Secret-management rules

Never commit:

- plaintext passwords;
- API keys or bearer tokens;
- Supabase service-role keys;
- OpenAI/provider secrets;
- internal-access signing secrets;
- production cookies/session tokens;
- customer or owner private evidence.

Use deployment environment variables or an approved secret store for secrets.

Public examples must use obvious placeholders such as:

```env
OPENAI_API_KEY=your-provider-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
INTERNAL_ACCESS_SECRET=your-random-server-secret
```

Never use a realistic live credential as documentation.

---

## Security invariants

1. Authorization is enforced on the server, not by hiding UI controls.
2. Client-supplied headers are never accepted as a substitute for a signed server session unless a dedicated authenticated protocol explicitly requires them.
3. Service-role credentials remain server-only.
4. Missing authentication fails closed.
5. Rate limiting and lockout apply to the internal login endpoint.
6. Sensitive responses use `no-store`.
7. Source evidence and operator actions remain auditable where the workflow requires it.
8. A credential found in source control is considered compromised and must be rotated, not merely deleted from the latest file.

---

## Release security check

Before release or public-repository cleanup:

- search the current branch for known credential values and suspicious key patterns;
- confirm privileged routes reject requests without a valid server session;
- confirm previous session versions are rejected after credential rotation;
- verify no admin component relies on a hardcoded access header;
- verify secrets exist only in deployment/server configuration;
- inspect security/runtime logs for new 401/403/5xx anomalies after auth changes.

---

## Next hardening step

The preferred long-term direction is **named internal operator identities** with server-controlled authorization and per-user auditability. The existing internal password gate is now materially safer than the legacy implementation, but a named-account model provides stronger revocation, attribution and least-privilege controls.

That migration should be implemented only after a canonical operator-role source is defined and tested. It must not grant privileged access based solely on self-editable user metadata.
