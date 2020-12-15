import express from 'express'
import { HiveService } from './HiveService'
import expressWs from 'express-ws'
import cors from 'cors'
import { KafkaService, PayloadHandler } from './KafkaService'

const { app, getWss } = expressWs(express())
const PORT = 8000

const onMessage: PayloadHandler = (payload) => {
  getWss().clients.forEach((client) => client.send(JSON.stringify(payload)))
}

const hiveService = new HiveService()
const kafkaService = new KafkaService(onMessage)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

app.ws('/live', (ws) => {
  ws.send(JSON.stringify(kafkaService.countryTweets))
  ws.onmessage = (message) => console.log(`Message received: ${message.data}`)
})

app.listen(PORT, async () => {
  try {
    await kafkaService.start()
  } catch (e) {
    console.error(e)
  }

  console.log(`⚡ [server]: Server is running at https://localhost:${PORT}`)
})
