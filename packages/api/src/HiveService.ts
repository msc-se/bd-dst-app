import { auth, connections, HiveClient, thrift, HiveUtils } from 'hive-driver'
import IHiveSession from 'hive-driver/dist/contracts/IHiveSession'
import { format } from 'sqlstring'

const utils = new HiveUtils(thrift.TCLIService_types)

export class HiveService {
  private session?: IHiveSession

  async getCovidData(date = '12-08-2020'): Promise<unknown[]> {
    const session = await this.getSession()

    const sql = format(
      `
      select country, cases, new_cases, new_cases_per_tweet, population, tweets
      from processed
      where day = ?
    `,
      [date]
    )
    const data = await session.executeStatement(sql, { runAsync: true })

    await utils.waitUntilReady(data, true)
    await utils.fetchAll(data)
    await data.close()
    const result = utils.getResult(data).getValue()

    return result.map(
      ({ country, cases, new_cases, new_cases_per_tweet, population, tweets }: Record<string, unknown>) => ({
        country,
        cases,
        newCases: new_cases,
        newCasesPerTweet: new_cases_per_tweet,
        population,
        tweets
      })
    )
  }

  private getSession(): Promise<IHiveSession> {
    if (this.session) return Promise.resolve(this.session)

    return new HiveClient(thrift.TCLIService, thrift.TCLIService_types)
      .connect(
        {
          host: 'localhost',
          port: 10000
        },
        new connections.TcpConnection(),
        new auth.NoSaslAuthentication()
      )
      .then(async (client) => {
        const session = await client.openSession({
          client_protocol: thrift.TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10
        })
        this.session = session

        return session
      })
  }
}
