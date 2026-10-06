import { Stack, Tooltip } from "@mui/material"
import { Info } from "@phosphor-icons/react"
import React, { memo } from "react"

import { EvalMessagesTableRow } from "./EvalMessagesTableRow"
import { AsyncTable, AsyncTableProps, HeaderCell } from "@/components/AsyncTable"
import { AoMessage } from "@/types"

type EvalMessagesTableProps = Pick<AsyncTableProps, "fetchFunction" | "pageSize"> & {}

function BaseEvalMessagesTable(props: EvalMessagesTableProps) {
  const { ...rest } = props

  const headerCells: HeaderCell[] = [
    {
      label: "Type",
      sx: { width: 140 },
    },
    { label: "ID", sx: { width: 240 } },
    { label: "Action" },
    { label: "Success", sx: { width: 20 } },
    { label: "From" },
    {
      label: "Data size",
      sx: { width: 160 },
      align: "right",
    },
    {
      label: "Arweave Block",
      sx: { width: 160 },
      align: "right",
    },
    {
      field: "timestamp" satisfies keyof AoMessage,
      label: (
        <Stack direction="row" gap={0.5} alignItems="center">
          Timestamp
          <Tooltip title="Arweave block time, or the message's Timestamp tag when block time is unavailable. Results are ordered by block height.">
            <Info width={16} height={16} />
          </Tooltip>
        </Stack>
      ),
      sx: { width: 160 },
      align: "right",
      sortable: true,
    },
    { label: "", sx: { width: 20 } },
  ]

  return (
    <AsyncTable
      {...rest}
      // component={Paper}
      initialSortDir="desc"
      initialSortField="timestamp"
      headerCells={headerCells}
      renderRow={(item: AoMessage, index) => (
        <EvalMessagesTableRow key={item.id} item={item} expandedByDefault={index === 0} />
      )}
    />
  )
}

export const EvalMessagesTable = memo(BaseEvalMessagesTable)
