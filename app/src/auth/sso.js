// Stubbed SSO helpers. Replace with real OAuth flows or server-side exchange.
// Use Vite env vars via `import.meta.env.VITE_*`.

export async function signInWithGoogle() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID not set')
    return { ok: false, error: 'missing_client_id' }
  }
  // Real implementation would redirect to Google's OAuth endpoint or use their SDK.
  return Promise.resolve({ ok: true, provider: 'google', token: 'stub-google-token' })
}

export async function signInWithApple() {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID
  if (!clientId) {
    console.warn('VITE_APPLE_CLIENT_ID not set')
    return { ok: false, error: 'missing_client_id' }
  }
  // Apple requires server-side JWT signing for production; this is a client stub.
  return Promise.resolve({ ok: true, provider: 'apple', token: 'stub-apple-token' })
}

export async function signInWithFacebook() {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID
  if (!appId) {
    console.warn('VITE_FACEBOOK_APP_ID not set')
    return { ok: false, error: 'missing_app_id' }
  }
  // Real implementation would open the FB OAuth dialog or use FB SDK.
  return Promise.resolve({ ok: true, provider: 'facebook', token: 'stub-facebook-token' })
}

export default {
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
}
