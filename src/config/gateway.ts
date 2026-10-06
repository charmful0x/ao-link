export const DEFAULT_GRAPHQL_ENDPOINT = "https://arweave.net/~query@1.0/graphql"
export const GATEWAY_DATA = "https://arweave.net"

const GRAPHQL_ENDPOINT_KEY = "ao-link:graphql-endpoint"

export function normalizeGraphqlEndpoint(value: string): string {
  const trimmed = value.trim()
  let url: URL

  try {
    url = new URL(trimmed)
  } catch {
    throw new Error("Enter a complete HTTP or HTTPS URL.")
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error("Use an HTTP or HTTPS URL without credentials or a fragment.")
  }

  return url.toString()
}

export function getGraphqlEndpoint(): string {
  try {
    const saved = localStorage.getItem(GRAPHQL_ENDPOINT_KEY)
    return saved ? normalizeGraphqlEndpoint(saved) : DEFAULT_GRAPHQL_ENDPOINT
  } catch {
    return DEFAULT_GRAPHQL_ENDPOINT
  }
}

export function setGraphqlEndpoint(value: string): string {
  const endpoint = normalizeGraphqlEndpoint(value)
  if (endpoint === DEFAULT_GRAPHQL_ENDPOINT) {
    localStorage.removeItem(GRAPHQL_ENDPOINT_KEY)
  } else {
    localStorage.setItem(GRAPHQL_ENDPOINT_KEY, endpoint)
  }
  return endpoint
}
