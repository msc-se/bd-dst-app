import express from 'express'
import { HiveService } from 'src/HiveService'
import expressWs from 'express-ws'
import { KafkaService, PayloadHandler } from 'src/KafkaService'

const { app, getWss } = expressWs(express())
const PORT = 8000

const onMessage: PayloadHandler = (payload) => {
  getWss().clients.forEach((client) => client.send(JSON.stringify(payload)))
}

const hiveService = new HiveService()
const kafkaService = new KafkaService(onMessage)

app.get('/', async (req, res) => {
  const data = await hiveService.getCovidData()
  res.send(data)
})

app.ws('/live', (ws) => {
  ws.send(JSON.stringify(kafkaService.countryTweets))
  ws.onmessage = (message) => console.log(`Message received: ${message.data}`)
})

app.listen(PORT, async () => {
  try {
    await kafkaService.start()

    // setTimeout(async () => await kafkaService.restart(), 10000)
  } catch (e) {
    console.error(e)
  }

  console.log(`⚡ [server]: Server is running at https://localhost:${PORT}`)
})
