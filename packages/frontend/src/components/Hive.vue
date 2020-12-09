<template>
  <h1>Hive</h1>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { HiveClient, thrift, auth, connections } from 'hive-driver'

export default defineComponent({
  name: 'Hive',
  async setup() {
    const client = await new HiveClient(thrift.TCLIService, thrift.TCLIService_types).connect(
      {
        host: 'localhost',
        port: 10000
      },
      new connections.TcpConnection(),
      new auth.NoSaslAuthentication()
    )
  }
})
</script>

<style scoped></style>
