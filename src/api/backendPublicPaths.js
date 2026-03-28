/**
 * Cloud Run: aether-app is private (IAM). The browser must call the UI service only; the gateway
 * attaches a Google ID token to upstream requests. Production builds must not embed the app URL.
 */
export function graphqlHttpUri() {
  if (import.meta.env.DEV && import.meta.env.VITE_GRAPHQL_URL) {
    return import.meta.env.VITE_GRAPHQL_URL
  }
  return '/graphql'
}

export function restApiBase() {
  if (import.meta.env.DEV && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return '/api'
}
