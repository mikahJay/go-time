Auth server (simple OAuth callback handler)

Run a lightweight Express server that handles provider redirects and token exchange.

Setup

1. Copy `.env.example` to `.env` and fill in provider credentials.
2. Install dependencies:

```powershell
cd services/auth-server
npm install
```

3. Start the server:

```powershell
npm start
```

Usage

- Visit `http://localhost:3000/auth/google` to begin a Google sign-in (redirects to Google's consent screen).
- After consent you'll be redirected back to `http://localhost:3000/auth/google/callback`, the server will exchange the code and then redirect to the client `CLIENT_REDIRECT_URI` with `provider` and `token` query params.

Notes

- This is a minimal example. For production, validate state parameters, secure secrets, and avoid leaking tokens in query strings.
- Implement proper Apple JWT signing server-side for Apple Sign in.
