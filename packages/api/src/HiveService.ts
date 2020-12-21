import { auth, connections, HiveClient, HiveUtils, thrift } from 'hive-driver'
import IHiveSession from 'hive-driver/dist/contracts/IHiveSession'
import { format } from 'sqlstring'

const utils = new HiveUtils(thrift.TCLIService_types)

export class HiveService {
  private session?: IHiveSession

  async getCovidData(date = '12-08-2020'): Promise<unknown[]> {
    const sql = format(
      `
      select code3, country, cases, new_cases, new_cases_per_tweet, population, tweets
      from processed
      where day = ?
    `,
      [date]
    )
    const result = await this.executeStatement(sql)

    return result.map(
      ({ code3, country, cases, new_cases, new_cases_per_tweet, population, tweets }: Record<string, unknown>) => ({
        code: code3,
        country,
        cases,
        newCases: new_cases,
        newCasesPerTweet: new_cases_per_tweet,
        population,
        tweets
      })
    )
  }

  async getWordCount(date = '12-18-2020', handler: (payload: unknown) => void): Promise<unknown[]> {
    const sql = format(
      `
      select count, word
      from wordcount
      where day = ?
      and length(word) > '4'
      and word not like 'http%'
      order by count desc
      limit 100
    `,
      [date]
    )

    return this.executeStatement(sql, handler)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeStatement(sql: string, statusHandler?: (payload: unknown) => void): Promise<any> {
    let isDone = false
    try {
      const session = await this.getSession()

      const operation = await session.executeStatement(sql, { runAsync: true })

      const poll = async () => {
        try {
          const result = await operation.status(true) //.then((result) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const status = JSON.parse(result.taskStatus!)[0]
          if (statusHandler) statusHandler(status)
          if (!isDone) setTimeout(poll, 100)
        } catch (e) {}
      }

      if (statusHandler) poll().catch((e) => console.error(e))

      await utils.waitUntilReady(operation, true)
      await utils.fetchAll(operation)

      isDone = true
      await operation.close()

      return utils.getResult(operation).getValue()
    } catch (e) {
      console.error(e)
    } finally {
      isDone = true
    }
  }

  private async getSession(): Promise<IHiveSession> {
    if (this.session) return Promise.resolve(this.session)
    const configuration = {
      'mapred.job.queue.name': 'batch',
      'mapreduce.map.memory.mb': '512',
      'mapreduce.reduce.memory.mb': '512',
      'yarn.app.mapreduce.am.resource.mb': '512',
      'yarn.app.mapreduce.am.command-opts': '-Xmx400M'
    }

    const client = await new HiveClient(thrift.TCLIService, thrift.TCLIService_types).connect(
      {
        host: 'localhost',
        port: 10000
      },
      new connections.TcpConnection(),
      new auth.NoSaslAuthentication()
    )
    const session = await client.openSession({
      client_protocol: thrift.TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10,
      configuration
    })

    this.session = session

    return session
  }
}
