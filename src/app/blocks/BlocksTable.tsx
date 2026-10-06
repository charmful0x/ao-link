import { Paper, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { Info } from "@phosphor-icons/react"
import React, { memo } from "react"

import { useNavigate } from "react-router-dom"

import { RetryableMsgCount } from "./RetryableMsgCount"
import { AsyncTable, AsyncTableProps } from "@/components/AsyncTable"
import { IdBlock } from "@/components/IdBlock"
import { TypeBadge } from "@/components/TypeBadge"
import { ArweaveBlock } from "@/types"
import { truncateId } from "@/utils/data-utils"
import { formatFullDate, formatRelative } from "@/utils/date-utils"
import { formatNumber } from "@/utils/number-utils"

type BlocksTableProps = Pick<AsyncTableProps, "fetchFunction" | "pageSize">

function BaseBlocksTable(props: BlocksTableProps) {
  const navigate = useNavigate()

  return (
    <AsyncTable
      {...props}
      component={Paper}
      initialSortDir="desc"
      initialSortField="timestamp"
      headerCells={[
        { label: "Type", sx: { width: 140 } },
        { label: "ID", sx: { width: 240 } },
        { label: "Messages", align: "right", sx: { width: 160 } },
        {
          label: "Arweave Block",
          sx: { width: 160 },
          align: "right",
        },
        {
          field: "timestamp" satisfies keyof ArweaveBlock,
          label: (
            <Stack direction="row" gap={0.5} alignItems="center">
              Block time
              <Tooltip title="Timestamp recorded in the Arweave block header.">
                <Info width={16} height={16} />
              </Tooltip>
            </Stack>
          ),
          sx: { width: 160 },
          align: "right",
          sortable: true,
        },
      ]}
      renderRow={(item: ArweaveBlock) => (
        <TableRow
          sx={{ cursor: "pointer" }}
          key={item.id}
          onClick={() => {
            navigate(`/block/${item.height}`)
          }}
        >
          <TableCell>
            <TypeBadge type={"Block"} />
          </TableCell>
          <TableCell>
            <IdBlock label={truncateId(item.id)} value={item.id} />
          </TableCell>
          <TableCell align="right">
            <RetryableMsgCount blockHeight={item.height} />
          </TableCell>
          <TableCell align="right">
            {item.height === null ? (
              "Processing"
            ) : (
              <IdBlock
                label={formatNumber(item.height)}
                value={String(item.height)}
                href={`/block/${item.height}`}
              />
            )}
          </TableCell>
          <TableCell align="right">
            {item.timestamp === null ? (
              "Unknown"
            ) : (
              <Tooltip title={formatFullDate(item.timestamp)}>
                <span>{formatRelative(item.timestamp)}</span>
              </Tooltip>
            )}
          </TableCell>
        </TableRow>
      )}
    />
  )
}

export const BlocksTable = memo(BaseBlocksTable)
