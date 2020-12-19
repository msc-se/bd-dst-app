/* eslint-disable @typescript-eslint/ban-ts-comment */
import express from 'express'
import { HiveService } from './HiveService'
import expressWs from 'express-ws'
import cors from 'cors'
import { KafkaService, PayloadHandler } from './KafkaService'

const { app } = expressWs(express())
const PORT = 8000

const onMessage: PayloadHandler = (payload) => {
  for (const [timestamp, ws] of liveDataClients) {
    try {
      ws.send(JSON.stringify(payload))
    } catch (e) {
      liveDataClients.delete(timestamp)
    }
  }
}

const hiveService = new HiveService()
const kafkaService = new KafkaService(onMessage)

const liveDataClients = new Map<number, WebSocket>()
const wordCountClients = new Map<number, WebSocket>()

// @ts-ignore
app.get('/historical', cors(), async (req, res) => {
  const date = String(req.query.date)

  if (isNaN(Date.parse(date))) {
    res.sendStatus(400)
    return
  }

  const data = await hiveService.getCovidData(date)
  res.send(data)
})

function wordCountStatusHandler(payload: unknown): void {
  for (const [timestamp, ws] of wordCountClients) {
    try {
      ws.send(JSON.stringify(payload))
    } catch (e) {
      wordCountClients.delete(timestamp)
    }
  }
}

// @ts-ignore
app.get('/word-count', cors(), async (req, res) => {
  try {
    const date = String(req.query.date)

    if (isNaN(Date.parse(date))) {
      res.sendStatus(400)
      return
    }

    const data = await hiveService.getWordCount(date, wordCountStatusHandler)
    res.send(data)
  } catch (e) {
    console.error(e)
  }
})

app.ws('/live', (ws) => {
  const timestamp = Date.now()
  // @ts-ignore
  liveDataClients.set(timestamp, ws)
  ws.send(JSON.stringify(kafkaService.countryTweets))
  ws.onmessage = (message) => console.log(`Message received: ${message.data}`)
})

app.ws('/status', (ws) => {
  const timestamp = Date.now()
  // @ts-ignore
  wordCountClients.set(timestamp, ws)
  ws.onclose = () => wordCountClients.delete(timestamp)
})

app.listen(PORT, async () => {
  try {
    await kafkaService.start()
  } catch (e) {
    console.error(e)
  }

  console.log(`⚡ [server]: Server is running at https://localhost:${PORT}`)
})
