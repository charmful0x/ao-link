import { dryrun } from "@permaweb/aoconnect"
import { gql } from "urql"

import { AoMessage, ArweaveBlock, BlockEdge, TokenTransferMessage, TransactionEdge } from "../types"

export const messageFields = gql`
  fragment MessageFields on TransactionConnection {
    edges {
      cursor
      node {
        id
        recipient
        block {
          timestamp
          height
        }
        tags {
          name
          value
        }
        data {
          size
        }
        owner {
          address
        }
      }
    }
  }
`

export const systemTagNames = [
  "Type",
  "Data-Protocol",
  "SDK",
  "Content-Type",
  "Variant",
  "Pushed-For",
  "Ref_",
  "Reference",
  "From-Module",
  "From-Process",
  "Module",
  "Scheduler",
  "aos-Version",
  "App-Name",
  "Scheduler",
  "Name",
]

// HyperBEAM may project message keys in lowercase when original ANS-104 tags
// are unavailable. Restore names used throughout the explorer.
const canonicalTagNames = new Map(
  [
    ...systemTagNames,
    "Action",
    "Quantity",
    "Recipient",
    "Sender",
    "Transaction-Id",
    "Memory-Limit",
    "Compute-Limit",
    "Input-Encoding",
    "Output-Encoding",
    "Module-Format",
    "Forwarded-For",
    "Timestamp",
  ].map((name) => [name.toLowerCase(), name]),
)

function partitionTags(rawTags: Tag[]) {
  const systemTags: Record<string, string> = {}
  const userTags: Record<string, string> = {}
  const tags: Record<string, string> = {}

  rawTags.forEach((tag) => {
    const name = canonicalTagNames.get(tag.name.toLowerCase()) || tag.name
    tags[name] = tag.value
    if (systemTagNames.includes(name)) systemTags[name] = tag.value
    else userTags[name] = tag.value
  })

  delete systemTags["Type"]
  delete systemTags["Module"]
  delete systemTags["Name"]

  return { systemTags, userTags, tags }
}

function parseMessageTimestamp(value?: string): Date | null {
  if (!value || !/^\d{10,13}$/.test(value)) return null
  const raw = Number(value)
  const date = new Date(raw < 100_000_000_000 ? raw * 1000 : raw)
  return Number.isFinite(date.getTime()) ? date : null
}

const knownTypes: Record<string, string> = {
  message: "Message",
  process: "Process",
  module: "Module",
  checkpoint: "Checkpoint",
  assignment: "Assignment",
  swap: "Swap",
}

export function parseAoMessage(edge: TransactionEdge): AoMessage {
  const { node, cursor } = edge
  const { systemTags, userTags, tags } = partitionTags(node.tags)

  const rawType = tags["Type"] || "Unknown"
  const type = knownTypes[rawType.toLowerCase()] || rawType
  const blockHeight = node.block ? node.block.height : null
  const from = tags["Forwarded-For"] || tags["From-Process"] || node.owner.address
  const schedulerId = tags["Scheduler"]
  const action = tags["Action"]
  const blockTimestamp = node.block?.timestamp ? new Date(node.block.timestamp * 1000) : null
  const timestamp = blockTimestamp ?? parseMessageTimestamp(tags["Timestamp"])
  const to = node.recipient.trim()

  if (type === "Message" && tags["Name"]) {
    userTags["Name"] = tags["Name"]
  }

  return {
    id: node.id,
    type,
    from,
    to,
    blockHeight,
    schedulerId,
    blockTimestamp,
    timestamp,
    action,
    tags,
    systemTags,
    userTags,
    cursor,
    dataSize: node.data?.size == null ? undefined : Number(node.data.size),
  }
}

export function parseTokenEvent(edge: TransactionEdge): TokenTransferMessage {
  const aoMessage = parseAoMessage(edge)

  const { id, timestamp, action, from, to, tags } = aoMessage

  let sender
  let recipient
  let tokenId
  let amount = 0

  if (action === "Debit-Notice") {
    amount = -Number(tags["Quantity"])
    sender = to
    recipient = tags["Recipient"]
    tokenId = from
  } else if (action === "Credit-Notice") {
    amount = Number(tags["Quantity"])
    sender = tags["Sender"]
    recipient = to
    tokenId = from
  } else if (action === "Transfer") {
    amount = -Number(tags["Quantity"])
    sender = from
    recipient = tags["Recipient"]
    tokenId = to
  } else {
    throw new Error(`Unknown action: ${action}`)
  }

  return {
    id,
    type: "Message",
    cursor: edge.cursor,
    timestamp,
    action,
    sender,
    recipient,
    amount,
    tokenId,
  }
}

export function parseArweaveBlock(edge: BlockEdge): ArweaveBlock {
  const { node, cursor } = edge

  const timestamp = node.timestamp ? new Date(node.timestamp * 1000) : null

  return {
    cursor,
    id: node.id,
    timestamp,
    height: node.height,
    previous: node.previous,
  }
}

export type DryRunResult = Awaited<ReturnType<typeof dryrun>>

/**
 * Returned message object(s) from dryRun
 */
export interface Message {
  Anchor: string
  Tags: Tag[]
  Target: string
  Data: string
}

export type Tag = {
  name: string
  value: string
}

export type CuMessage = {
  systemTags: Record<string, string>
  userTags: Record<string, string>
  tags: Record<string, string>
}

export function parseAoMessageFromCU(message: Message): CuMessage {
  return partitionTags(message.Tags)
}
