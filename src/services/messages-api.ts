import { result } from "@permaweb/aoconnect/browser"
import { MessageResult } from "@permaweb/aoconnect/dist/lib/result"
import { gql } from "urql"

import { graphqlClient } from "./graphql-client"
import { AoMessage, NetworkStat, TokenTransferMessage, TransactionsResponse } from "@/types"

import { messageFields, parseAoMessage, parseTokenEvent } from "@/utils/arweave-utils"

import { isArweaveId } from "@/utils/utils"

// const AO_NETWORK_IDENTIFIER = '{ name: "SDK", values: ["aoconnect"] }'
// const AO_NETWORK_IDENTIFIER = '{ name: "Variant", values: ["ao.TN.1"] }'
const AO_NETWORK_IDENTIFIER = '{ name: "Data-Protocol", values: ["ao"] }'

function parseTransactionCount(value: string | number | null | undefined): number | undefined {
  if (value == null) return undefined
  const count = Number(value)
  return Number.isFinite(count) && count >= 0 ? count : undefined
}

/**
 * WARN This query fails if both count and cursor are set
 */
const outgoingMessagesQuery = (includeCount = false, isProcess?: boolean) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor
      ${
        isProcess
          ? `tags: [{ name: "From-Process", values: [$entityId] }, ${AO_NETWORK_IDENTIFIER}]`
          : `tags: [${AO_NETWORK_IDENTIFIER}]
             owners: [$entityId]`
      }
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getOutgoingMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
  isProcess?: boolean,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(outgoingMessagesQuery(!cursor, isProcess), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const incomingMessagesQuery = (includeCount = false) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      recipients: [$entityId]
      tags: [${AO_NETWORK_IDENTIFIER}]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getIncomingMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(incomingMessagesQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

const tokenTransfersQuery = (includeCount = false) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [{ name: "Action", values: ["Credit-Notice", "Debit-Notice"] }, ${AO_NETWORK_IDENTIFIER}]
      recipients: [$entityId]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getTokenTransfers(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
): Promise<[number | undefined, TokenTransferMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(tokenTransfersQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseTokenEvent)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const spawnedProcessesQuery = (includeCount = false, isProcess?: boolean) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      ${
        isProcess
          ? `tags: [{ name: "From-Process", values: [$entityId]}, { name: "Type", values: ["Process"]}, ${AO_NETWORK_IDENTIFIER}]`
          : `tags: [${AO_NETWORK_IDENTIFIER}, { name: "Type", values: ["Process"]}]
             owners: [$entityId]`
      }
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getSpawnedProcesses(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
  isProcess?: boolean,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(spawnedProcessesQuery(!cursor, isProcess), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

export async function getMessageById(id: string): Promise<AoMessage | null> {
  if (!isArweaveId(id)) {
    return null
  }
  const { data, error } = await graphqlClient
    .query<TransactionsResponse>(
      gql`
        query ($id: ID!) {
          transactions(ids: [$id], tags: [${AO_NETWORK_IDENTIFIER}]) {
            ...MessageFields
          }
        }

        ${messageFields}
      `,
      { id },
    )
    .toPromise()

  if (error) throw new Error(error.message)

  if (!data) return null
  if (!data.transactions.edges.length) return null

  return parseAoMessage(data.transactions.edges[0])
}

/**
 * WARN This query fails if both count and cursor are set
 */
const processesQuery = (includeCount = false) => gql`
  query ($limit: Int!, $sortOrder: SortOrder!, $cursor: String, $tags: [TagFilter!]) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor
      tags: $tags
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getProcesses(
  limit = 100,
  cursor = "",
  ascending: boolean,
  moduleId?: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const tags = [
      { name: "Type", values: ["Process", "Module"] },
      { name: "Data-Protocol", values: ["ao"] },
    ]

    if (moduleId) {
      tags.push({ name: "Module", values: [moduleId] })
    }

    const result = await graphqlClient
      .query<TransactionsResponse>(processesQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        tags,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const records = edges.map(parseAoMessage)

    return [parseTransactionCount(count), records]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const modulesQuery = (includeCount = false) => gql`
  query (
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [{ name: "Type", values: ["Module"]}, ${AO_NETWORK_IDENTIFIER}]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getModules(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(modulesQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const resultingMessagesQuery = (includeCount = false, useOldRefSymbol = false) => gql`
  query (
    $fromProcessId: String!
    $msgRefs: [String!]!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [{ name: "${useOldRefSymbol ? "Ref_" : "Reference"}", values: $msgRefs },{ name: "From-Process", values: [$fromProcessId] }, ${AO_NETWORK_IDENTIFIER}]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`
export async function getResultingMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  pushedFor: string,
  sender: string,
  msgRefs?: string[],
  useOldRefSymbol = false,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(resultingMessagesQuery(!cursor, useOldRefSymbol), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        msgRefs: msgRefs?.filter(Boolean).length ? msgRefs.filter(Boolean) : [pushedFor],
        fromProcessId: sender,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

const resultingMessagesIdsQuery = gql`
  query (
    $recipient: String!
    $tags: [TagFilter!]!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor
      recipients: [$recipient]
      tags: $tags
    ) {
      ...MessageFields
    }
  }

  ${messageFields}
`

export interface GetResultingMessagesNodesArgs {
  recipient: string
  limit: number
  cursor: string
  ascending: boolean
  fromProcess?: string
  actions?: string[]
  msgRefs?: string[]
  useOldRefSymbol: boolean
}

export const getResultingMessagesNodes = async ({
  recipient,
  limit = 100,
  cursor = "",
  ascending,
  fromProcess,
  actions,
  msgRefs,
  useOldRefSymbol = false,
}: GetResultingMessagesNodesArgs) => {
  const tags = [
    { name: useOldRefSymbol ? "Ref_" : "Reference", values: msgRefs || [] },
    { name: "Data-Protocol", values: ["ao"] },
  ]
  if (fromProcess) tags.push({ name: "From-Process", values: [fromProcess] })
  if (actions?.length) tags.push({ name: "Action", values: actions })

  const result = await graphqlClient
    .query<TransactionsResponse>(resultingMessagesIdsQuery, {
      recipient,
      tags,
      limit,
      cursor,
      sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
    })
    .toPromise()

  const { data } = result
  if (!data) return []

  const { edges } = data.transactions
  const nodes = edges.map((e) => e.node)

  return nodes
}

/**
 * WARN This query fails if both count and cursor are set
 */
const linkedMessagesQuery = (includeCount = false) => gql`
  query (
    $messageId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [{ name: "Pushed-For", values: [$messageId] }, ${AO_NETWORK_IDENTIFIER}]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getLinkedMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  pushedFor: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(linkedMessagesQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        messageId: pushedFor,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const messagesForBlockQuery = (includeCount = false) => gql`
  query (
    $blockHeight: Int
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      block: { min: $blockHeight, max: $blockHeight }
      tags: [${AO_NETWORK_IDENTIFIER}]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getMessagesForBlock(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  blockHeight?: number,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(messagesForBlockQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        blockHeight,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

const allMessagesQuery = gql`
  query ($limit: Int!, $sortOrder: SortOrder!, $cursor: String, $tags: [TagFilter!]) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: $tags
    ) {
    ...MessageFields
    }
  }

  ${messageFields}
`

export async function getAllMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  extraFilters?: Record<string, string>,
): Promise<[number | undefined, AoMessage[]]> {
  const tags = [
    {
      // AO_NETWORK_IDENTIFIER
      name: "Data-Protocol",
      values: ["ao"],
    },
  ]

  if (extraFilters) {
    for (const [name, value] of Object.entries(extraFilters)) {
      tags.push({ name, values: [value] })
    }
  }

  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(allMessagesQuery, {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        tags,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const evalMessagesQuery = (includeCount = false) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [{ name: "Action", values: ["Eval"] }, ${AO_NETWORK_IDENTIFIER}]
      recipients: [$entityId]
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getEvalMessages(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(evalMessagesQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

const networkStatsQuery = gql`
  query {
    transactions(
      sort: HEIGHT_DESC
      first: 1
      owners: ["yqRGaljOLb2IvKkYVa87Wdcc8m_4w6FI58Gej05gorA"]
      recipients: ["vdpaKV_BQNISuDgtZpLDfDlMJinKHqM3d2NWd3bzeSk"]
      tags: [{ name: "Action", values: ["Update-Stats"] }, ${AO_NETWORK_IDENTIFIER}]
    ) {
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getNetworkStats(): Promise<NetworkStat[]> {
  try {
    const result = await graphqlClient.query<TransactionsResponse>(networkStatsQuery, {}).toPromise()
    if (!result.data) return []

    const { edges } = result.data.transactions
    const updateId = edges[0]?.node.id

    const data = await fetch(`https://arweave.net/${updateId}`)
    const json = await data.json()

    return json as NetworkStat[]
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const ownedDomainsQuery = (includeCount = false) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [${AO_NETWORK_IDENTIFIER}, { name: "Action", values: ["Buy-Record-Notice"]}]
      recipients: [$entityId]
     
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getOwnedDomainsHistory(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(ownedDomainsQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

/**
 * WARN This query fails if both count and cursor are set
 */
const setRecordsQuery = (includeCount = false) => gql`
  query (
    $entityId: String!
    $limit: Int!
    $sortOrder: SortOrder!
    $cursor: String
  ) {
    transactions(
      sort: $sortOrder
      first: $limit
      after: $cursor

      tags: [${AO_NETWORK_IDENTIFIER}, { name: "Action", values: ["Set-Record"] }, { name: "Transaction-Id", values: [$entityId]}]
      owners: [$entityId]
     
    ) {
      ${includeCount ? "count" : ""}
      ...MessageFields
    }
  }

  ${messageFields}
`

export async function getSetRecordsToEntityId(
  limit = 100,
  cursor = "",
  ascending: boolean,
  //
  entityId: string,
): Promise<[number | undefined, AoMessage[]]> {
  try {
    const result = await graphqlClient
      .query<TransactionsResponse>(setRecordsQuery(!cursor), {
        limit,
        sortOrder: ascending ? "HEIGHT_ASC" : "HEIGHT_DESC",
        cursor,
        //
        entityId,
      })
      .toPromise()
    const { data } = result

    if (!data) return [0, []]

    const { count, edges } = data.transactions
    const events = edges.map(parseAoMessage)

    return [parseTransactionCount(count), events]
  } catch (error) {
    return [0, []]
  }
}

export type MessageTree = AoMessage & {
  result: MessageResult | null
  children: MessageTree[]
}

export interface FetchMessageGraphArgs {
  msgId: string
  actions?: string[]
  startFromPushedFor?: boolean
  ignoreRepeatingMessages?: boolean
  depth?: number
}

export const fetchMessageGraph = async (
  {
    msgId,
    actions,
    startFromPushedFor = false,
    ignoreRepeatingMessages = false,
    depth = 0,
  }: FetchMessageGraphArgs,
  visited: Set<string> = new Set(),
): Promise<MessageTree | null> => {
  try {
    if (visited.has(msgId)) {
      return null
    }

    visited.add(msgId)

    let originalMsg = await getMessageById(msgId)

    if (!originalMsg) {
      return null
    }

    if (startFromPushedFor) {
      const pushedFor = originalMsg.tags["Pushed-For"]

      if (pushedFor) {
        originalMsg = await getMessageById(pushedFor)
      }
    }

    if (!originalMsg) {
      return null
    }

    const receiverMsg = await getMessageById(originalMsg.to)

    let res = null

    if (receiverMsg && receiverMsg.type === "Process") {
      res = await result({
        process: originalMsg.to,
        message: originalMsg.id,
      })
    }

    const head: MessageTree = Object.assign({}, originalMsg, {
      children: [],
      result: res,
    })

    if (!head) {
      return null
    }

    for (const result of head.result?.Messages ?? []) {
      const refTag = result.Tags.find((t: any) => ["Ref_", "Reference"].includes(t.name))

      // Require a valid target and at least one reference tag value
      if (!isArweaveId(String(result.Target)) || !refTag?.value) {
        continue
      }

      const shouldUseOldRefSymbol = refTag.name === "Ref_"

      const nodes = await getResultingMessagesNodes({
        recipient: result.Target,
        limit: 100,
        cursor: "",
        actions,
        // TODO(Nikita): If you specify from-proess this way
        //               some of the messages dissapear, although they seem
        //               completely valid. Investigate, then enable this feature
        // fromProcess: depth > 0 ? originalMsg.to : undefined,
        ascending: false,
        msgRefs: refTag ? [refTag.value] : [],
        useOldRefSymbol: shouldUseOldRefSymbol,
      })

      let nodesIds = nodes.filter((n) => n && isArweaveId(String(n.id))).map((n) => n.id)

      if (ignoreRepeatingMessages) {
        nodesIds = [...new Set(nodesIds)]
      }

      let leafs = []

      for (const nodeId of nodesIds) {
        if (!isArweaveId(nodeId)) continue
        const leaf = await fetchMessageGraph(
          {
            msgId: nodeId,
            actions,
            ignoreRepeatingMessages,
            depth: depth + 1,
          },
          visited,
        )

        leafs.push(leaf)
      }

      leafs = leafs.filter((l) => l !== null)

      head.children = head.children.concat(leafs)
    }

    return head
  } catch (error) {
    return null
  }
}
