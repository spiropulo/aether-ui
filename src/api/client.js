import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
  // In development, requests go to /graphql which Vite proxies to the backend
  // (avoids CORS). In production set VITE_GRAPHQL_URL to the full backend URL.
  uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('aether_token')
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

// Guard prevents multiple concurrent queries from triggering multiple redirects
let redirectingToLogin = false

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (redirectingToLogin) return

  const isUnauthenticated =
    graphQLErrors?.some(
      (e) =>
        e.extensions?.code === 'UNAUTHENTICATED' ||
        e.message?.toLowerCase().includes('unauthorized') ||
        e.message?.toLowerCase().includes('unauthenticated'),
    ) ||
    networkError?.statusCode === 401

  if (isUnauthenticated) {
    const alreadyOnAuthPage =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/register')

    if (!alreadyOnAuthPage) {
      redirectingToLogin = true
      localStorage.removeItem('aether_token')
      localStorage.removeItem('aether_user')
      // Full page replace clears all in-memory state before going to login
      window.location.replace('/login')
    }
  }
})

export const client = new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})
