import { auth, connections, HiveClient, thrift, HiveUtils } from 'hive-driver'

const utils = new HiveUtils(thrift.TCLIService_types)

async function createClient(): Promise<HiveClient> {
  return new HiveClient(thrift.TCLIService, thrift.TCLIService_types).connect(
    {
      host: 'localhost',
      port: 10000
    },
    new connections.TcpConnection(),
    new auth.NoSaslAuthentication()
  )
}

async function test() {
  const client = await createClient()
  try {
    const session = await client.openSession({
      // eslint-disable-next-line @typescript-eslint/camelcase
      client_protocol: thrift.TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10
    })
    const data = await session.executeStatement('SELECT * FROM processed', { runAsync: true })

    await utils.waitUntilReady(data, true)
    await utils.fetchAll(data)
    await data.close()

    const result = utils.getResult(data).getValue()
    console.log(result)

    await session.close()
  } catch (e) {
    console.error(e)
  } finally {
    client.close()
  }
}

test().then(() => console.log('done'))
