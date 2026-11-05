# Auth testing
- Email/password: POST /api/auth/register, /api/auth/login -> {token,user}; GET /api/auth/me with Bearer.
- Apple: POST /api/auth/apple {identity_token, email?, full_name?} verifies against Apple JWKS (aud in APPLE_AUDIENCES: bundle id + host.exp.Exponent). Invalid token -> 401. Button only on iOS devices (not web) — real Apple ID needed, manual test only.
- Test user: test@bologna.it / tortellini
