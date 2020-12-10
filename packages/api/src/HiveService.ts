import { auth, connections, HiveClient, thrift, HiveUtils } from 'hive-driver'
import IHiveSession from 'hive-driver/dist/contracts/IHiveSession'

const utils = new HiveUtils(thrift.TCLIService_types)

export class HiveService {
  private session?: IHiveSession

  async getCovidData(): Promise<unknown[]> {
    const session = await this.getSession()

    const data = await session.executeStatement('SELECT * FROM processed', { runAsync: true })

    await utils.waitUntilReady(data, true)
    await utils.fetchAll(data)
    await data.close()

    const result = utils.getResult(data).getValue()
    console.log(result)
    return result
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
