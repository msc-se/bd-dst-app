<template>
  <div id="container">
    <HistoricalData id="historic-data" />
    <LiveTweets id="live-tweets" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LiveTweets from '@/components/LiveTweets.vue'
import HistoricalData from '@/components/HistoricalData.vue'

export default defineComponent({
  name: 'App',
  components: {
    HistoricalData,
    LiveTweets
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0 40px;
}

#container {
  display: flex;
  flex-flow: row;
  justify-content: space-between;
}

#live-tweets {
  width: 200px;
}

#historic-data {
  width: 100%;
  margin-right: 20px;
}
</style>
