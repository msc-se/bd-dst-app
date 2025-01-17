import { Consumer, EachMessagePayload, Kafka, KafkaMessage } from 'kafkajs'

export interface TweetPayload {
  country: string
  tweets: number
}

export type PayloadHandler = (payload: unknown) => void

export class KafkaService {
  private readonly topic = 'processed-tweets'
  private readonly onMessage: PayloadHandler
  private readonly kafka = new Kafka({
    clientId: 'express-api',
    brokers: ['node-master:9092', 'node1:9092', 'node2:9092']
  })
  private readonly consumer: Consumer
  private readonly _countryTweets = new Map<string, number>()
  private currentDate = new Date().setHours(0, 0, 0, 0)
  private startedAt = Date.now()

  constructor(onMessage: PayloadHandler) {
    this.onMessage = onMessage
    this.consumer = this.kafka.consumer({ groupId: 'test-group' })
  }

  get countryTweets(): TweetPayload[] {
    const data: TweetPayload[] = []
    this._countryTweets.forEach((value, key) => {
      data.push({
        country: key,
        tweets: value
      })
    })

    return data
  }

  async start(): Promise<void> {
    const admin = this.kafka.admin()
    const offset = await admin
      .fetchTopicOffsetsByTimestamp('processed-tweets', this.currentDate)
      .then((offsets) => offsets[0].offset)

    await this.consumer.connect()
    await this.consumer.subscribe({ topic: this.topic })

    await this.consumer.run({
      eachMessage: this.handleMessage.bind(this)
    })
    this.consumer.seek({ topic: this.topic, partition: 0, offset })
  }

  stop(): Promise<void> {
    return this.consumer.disconnect()
  }

  private async handleMessage({ message }: EachMessagePayload): Promise<void> {
    const payload = KafkaService.parseMessage(message)

    if (this._countryTweets.has(payload.country)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._countryTweets.set(payload.country, this._countryTweets.get(payload.country)! + payload.tweets)
    } else this._countryTweets.set(payload.country, payload.tweets)

    payload.tweets = this._countryTweets.get(payload.country) ?? payload.tweets

    if (Number(message.timestamp) > this.startedAt) this.onMessage(payload)
  }

  private static parseMessage(message: KafkaMessage): TweetPayload {
    return {
      country: message.key.toString().toUpperCase(),
      tweets: Number(message.value?.toString())
    }
  }
}
