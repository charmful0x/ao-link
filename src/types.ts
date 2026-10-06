export type Tag = {
  name: string
  value: string
}

export type Owner = {
  address: string
  key?: string
}

export type ArweaveBlock = {
  id: string
  timestamp: Date | null
  height: number
  previous?: string
  cursor?: string
}

export type TransactionNode = {
  id: string
  anchor?: string
  signature?: string
  recipient: string
  owner: Owner
  fee?: {
    winston: string
    ar: string
  }
  quantity?: {
    winston: string
    ar: string
  }
  data?: {
    size?: string | null
    type?: string
  }
  tags: Tag[]
  block: BlockEdge["node"] | null
  parent?: {
    id: string
  }
  bundledIn?: {
    id: string
  }
}

export type TransactionEdge = {
  cursor: string
  node: TransactionNode
}

export type TransactionsResponse = {
  transactions: {
    count?: string | number | null
    edges: TransactionEdge[]
  }
}

export type BlocksResponse = {
  blocks: {
    edges: BlockEdge[]
  }
}

export type BlockEdge = {
  cursor: string
  node: {
    id: string
    height: number
    previous?: string
    timestamp: number | null
  }
}

export type ArweaveAddress = string
export const MSG_TYPES = ["Message", "Process", "Checkpoint", "Assignment"] as const

export interface ArweaveTransaction {
  id: string
  blockHeight: number | null
  blockTimestamp: Date | null
  timestamp: Date | null
  tags: Record<string, string>
  cursor?: string
  dataSize?: number
}

export interface AoMessage extends ArweaveTransaction {
  action: string
  to: ArweaveAddress
  from: ArweaveAddress
  type: string
  schedulerId: string
  systemTags: Record<string, string>
  userTags: Record<string, string>
}

export type UserAddress = ArweaveAddress

export interface AoProcess extends AoMessage {
  id: ArweaveAddress
  type: "Process"
}

export type TokenTransferMessage = Pick<AoMessage, "id" | "timestamp" | "cursor" | "action"> & {
  type: "Message"
  sender: ArweaveAddress
  recipient: ArweaveAddress
  amount: number
  tokenId: string
}

// { created_date: '2024-02-21', num_messages: 69076 }
export type MessageStatistic = {
  created_date: string
  num_messages: number
}

// { created_date: '2024-01-24', modules_running: 83, delta: 15 }
export type ModuleStatistic = {
  created_date: string
  modules_running: number
  delta: number
}

// { created_date: '2024-01-24',  users: 21,  pct_change: -0.2222222222222222 }
export type UserStatistic = {
  created_date: string
  users: number
  pct_change: number
}

// { created_date: '2024-01-27', processes: 129, pct_change: 1.015625 },
export type ProcessStatistic = {
  created_date: string
  processes: number
  pct_change: number
}

export type HighchartAreaData = [number, number]
export type HighchartPieData = { y: number; name: string }

export type NetworkStat = {
  active_processes: number
  active_users: number
  created_date: string // "YYYY-MM-DD HH:MM:SS" format
  eval_count: number
  modules_rolling: number
  new_module_count: number
  new_process_count: number
  processes_rolling: number
  transfer_count: number
  tx_count: number
  tx_count_rolling: number
}
