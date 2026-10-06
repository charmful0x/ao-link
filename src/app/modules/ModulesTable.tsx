import { Paper, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { Info } from "@phosphor-icons/react"
import React from "react"

import { useNavigate } from "react-router-dom"

import { RetryableProcessCount } from "./RetryableProcessCount"
import { AsyncTable, AsyncTableProps } from "@/components/AsyncTable"
import { IdBlock } from "@/components/IdBlock"
import { TypeBadge } from "@/components/TypeBadge"
import { AoMessage } from "@/types"
import { truncateId } from "@/utils/data-utils"
import { formatFullDate, formatRelative } from "@/utils/date-utils"
import { formatNumber } from "@/utils/number-utils"

type ModulesTableProps = Pick<AsyncTableProps, "fetchFunction" | "pageSize">

export function ModulesTable(props: ModulesTableProps) {
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
        { label: "Memory limit", align: "right" },
        { label: "Compute limit", align: "right" },
        { label: "Processes", align: "right", sx: { width: 160 } },
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
      ]}
      renderRow={(item: AoMessage) => (
        <TableRow
          sx={{ cursor: "pointer" }}
          key={item.id}
          onClick={() => {
            navigate(`/module/${item.id}`)
          }}
        >
          <TableCell>
            <TypeBadge type={item.type} />
          </TableCell>
          <TableCell>
            <IdBlock label={truncateId(item.id)} value={item.id} href={`/module/${item.id}`} />
          </TableCell>
          <TableCell align="right">{item.tags["Memory-Limit"] || "Unknown"}</TableCell>
          <TableCell align="right">
            {item.tags["Compute-Limit"] === undefined
              ? "Unknown"
              : formatNumber(parseInt(item.tags["Compute-Limit"]))}
          </TableCell>
          <TableCell align="right">
            <RetryableProcessCount moduleId={item.id} />
          </TableCell>
          <TableCell align="right">
            {item.blockHeight === null ? (
              "Processing"
            ) : (
              <IdBlock
                label={formatNumber(item.blockHeight)}
                value={String(item.blockHeight)}
                href={`/block/${item.blockHeight}`}
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
