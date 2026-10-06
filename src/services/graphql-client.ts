import { Client, cacheExchange, fetchExchange } from "urql"
import { getGraphqlEndpoint } from "@/config/gateway"

export const graphqlClient = new Client({
  url: getGraphqlEndpoint(),
  exchanges: [cacheExchange, fetchExchange],
})
