"use client"

import React, { type FormEvent, useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/PageWrapper"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material"

import Grid2 from "@mui/material/Unstable_Grid2/Grid2"

import { AllMessagesTable } from "./AllMessagesTable"
import { AreaChart } from "@/components/Charts/AreaChart"

import { Subheading } from "@/components/Subheading"

import {
  DEFAULT_GRAPHQL_ENDPOINT,
  getGraphqlEndpoint,
  setGraphqlEndpoint,
} from "@/config/gateway"
import { getNetworkStats } from "@/services/messages-api"
import { HighchartAreaData, NetworkStat } from "@/types"
import { formatAbsString } from "@/utils/date-utils"
import { wait } from "@/utils/utils"

function GraphqlEndpointSetting() {
  const [open, setOpen] = useState(false)
  const [endpoint, setEndpoint] = useState(getGraphqlEndpoint)
  const [error, setError] = useState("")

  const close = () => {
    setOpen(false)
    setEndpoint(getGraphqlEndpoint())
    setError("")
  }

  const saveEndpoint = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const previous = getGraphqlEndpoint()
      const next = setGraphqlEndpoint(endpoint)
      setError("")
      if (next !== previous) window.location.reload()
      else close()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the endpoint.")
    }
  }

  const restoreDefault = () => {
    try {
      const previous = getGraphqlEndpoint()
      setGraphqlEndpoint(DEFAULT_GRAPHQL_ENDPOINT)
      setError("")
      if (previous !== DEFAULT_GRAPHQL_ENDPOINT) window.location.reload()
      else close()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore the default.")
    }
  }

  return (
    <>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen(true)}
        sx={{ color: "text.secondary", fontSize: "0.8125rem", fontWeight: 400, textTransform: "none" }}
      >
        GraphQL endpoint
      </Button>
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="graphql-endpoint-title">
        <Box component="form" onSubmit={saveEndpoint}>
          <DialogTitle id="graphql-endpoint-title">GraphQL endpoint</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose where AO Link loads messages and blocks. Saved in this browser.
            </Typography>
            <TextField
              label="Endpoint URL"
              size="small"
              fullWidth
              value={endpoint}
              onChange={(event) => {
                setEndpoint(event.target.value)
                setError("")
              }}
              error={!!error}
              helperText={error || undefined}
              inputProps={{ "aria-label": "GraphQL endpoint URL" }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={restoreDefault}>Use default</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button type="button" onClick={close}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

function HomePageContent() {
  const [stats, setStats] = useState<NetworkStat[]>()

  useEffect(() => {
    // Allow the request for messages to go before network stats, as they are more important
    wait(1000)
      .then(() => getNetworkStats())
      .then(setStats)
  }, [])

  const messages = useMemo<HighchartAreaData[]>(
    () =>
      !stats
        ? []
        : stats.slice(-30).map((stat) => [formatAbsString(stat.created_date), stat.tx_count]),
    [stats],
  )

  const totalMessages = useMemo(
    () => (stats?.length ? stats[stats.length - 1].tx_count_rolling : 0),
    [stats],
  )

  const modules = useMemo<HighchartAreaData[]>(
    () =>
      !stats
        ? []
        : stats
            .slice(-30)
            .map((stat) => [formatAbsString(stat.created_date), stat.modules_rolling]),
    [stats],
  )

  const users = useMemo<HighchartAreaData[]>(
    () =>
      !stats
        ? []
        : stats.slice(-30).map((stat) => [formatAbsString(stat.created_date), stat.active_users]),
    [stats],
  )

  const processes = useMemo<HighchartAreaData[]>(
    () =>
      !stats
        ? []
        : stats
            .slice(-30)
            .map((stat) => [formatAbsString(stat.created_date), stat.active_processes]),
    [stats],
  )

  return (
    <Stack component="main" gap={2} sx={{ paddingY: { xs: 2, sm: 3 } }}>
      <Alert severity="info" variant="outlined">
        AO Link is no longer maintained. For AO network, use{" "}
        <Link href="https://lunar.arweave.net" target="_blank" rel="noopener noreferrer" fontWeight={600}>
          Lunar
        </Link>
        .
      </Alert>
      {!stats ? (
        <Grid2 container spacing={{ xs: 2, sm: 1, lg: 2 }} sx={{ marginX: { xs: 0, sm: -2.5 } }}>
          <Grid2 xs={12} sm={6} lg={3}>
            <Skeleton height={150} variant="rectangular" />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <Skeleton height={150} variant="rectangular" />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <Skeleton height={150} variant="rectangular" />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <Skeleton height={150} variant="rectangular" />
          </Grid2>
        </Grid2>
      ) : (
        <Grid2 container spacing={{ xs: 2, sm: 1, lg: 2 }} sx={{ marginX: { xs: 0, sm: -2.5 } }}>
          <Grid2 xs={12} sm={6} lg={3}>
            <AreaChart data={messages} titleText="TOTAL MESSAGES" overrideValue={totalMessages} />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <AreaChart data={users} titleText="USERS" />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <AreaChart data={processes} titleText="PROCESSES" />
          </Grid2>
          <Grid2 xs={12} sm={6} lg={3}>
            <AreaChart data={modules} titleText="MODULES" />
          </Grid2>
        </Grid2>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Subheading type="Latest messages" />
        <GraphqlEndpointSetting />
      </Stack>
      <Box sx={{ marginX: { xs: 0, sm: -2 } }}> {/* Adjust negative margin for mobile */}
        <AllMessagesTable open />
      </Box>
    </Stack>
  )
}

export default function HomePage() {
  return (
    <PageWrapper>
      <HomePageContent />
    </PageWrapper>
  )
}
