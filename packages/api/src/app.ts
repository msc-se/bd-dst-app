import express from 'express'
import { HiveService } from 'src/HiveService'

const app = express()
const PORT = 8000

const hiveService = new HiveService()

app.get('/', async (req, res) => {
  const data = await hiveService.getCovidData()
  res.send(data)
})

app.listen(PORT, async () => {
  console.log(`⚡ [server]: Server is running at https://localhost:${PORT}`)
})

app.on('close', () => {
  console.log('close')
  hiveService.terminate()
})
