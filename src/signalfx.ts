import * as core from '@actions/core'
import * as httpm from '@actions/http-client'
import {Event, Metric} from './types'

export function getClient(token: string): httpm.HttpClient {
  return new httpm.HttpClient('sfx-http-client', [], {
    headers: {
      'X-SF-TOKEN': token,
      'Content-Type': 'application/json'
    }
  })
}

export async function sendEvents(
  apiURL: string,
  token: string,
  events: Event[]
): Promise<void> {
  const http: httpm.HttpClient = getClient(token)

  core.debug(`About to send ${events.length} events`)
  const res: httpm.HttpClientResponse = await http.post(
    `${apiURL}/v2/event`,
    JSON.stringify(events)
  )
  if (res.message.statusCode === undefined || res.message.statusCode >= 400) {
    core.error(`HTTP request failed: ${res.message.statusMessage}`)
    throw new Error(`Failed to send events`)
  }
}

export async function sendMetrics(
  apiURL: string,
  apiKey: string,
  metrics: Metric[]
): Promise<void> {
  const http: httpm.HttpClient = getClient(apiKey)
  const jsonPayload = `{
    "counter": [
      ${metrics
        .filter(metric => metric.type == 'counter')
        .map(
          metric => `{
            "metric": "${metric.name}",
            "value": ${metric.value},
            "dimensions": ${JSON.stringify(metric.dimensions || {})},
            "properties": ${JSON.stringify(metric.properties || {})}
          }`
        )
        .join(',')}
    ],
    "gauge": [
      ${metrics
        .filter(metric => metric.type == 'gauge')
        .map(
          metric => `{
            "metric": "${metric.name}",
            "value": ${metric.value},
            "dimensions": ${JSON.stringify(metric.dimensions || {})},
            "properties": ${JSON.stringify(metric.properties || {})}
          }`
        )
        .join(',')}
    ],
    "cumulative_counter": [
      ${metrics
        .filter(metric => metric.type == 'cumulative_counter')
        .map(
          metric => `{
            "metric": "${metric.name}",
            "value": ${metric.value},
            "dimensions": ${JSON.stringify(metric.dimensions || {})},
            "properties": ${JSON.stringify(metric.properties || {})}
          }`
        )
        .join(',')}
    ]
  }`
  core.debug(`made jsonpayload`)
  console.log(jsonPayload)
  core.debug(`About to send ${metrics.length} metrics`)
  const res: httpm.HttpClientResponse = await http.post(
    `${apiURL}/v2/datapoint`,
    jsonPayload
  )
  console.log(await res.readBody())
  if (res.message.statusCode === undefined || res.message.statusCode >= 400) {
    throw new Error(`HTTP request failed: ${res.message.statusMessage}`)
  }
}
