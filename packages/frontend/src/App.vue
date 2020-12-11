<template>
  <div id="container">
    <HistoricData id="historic-data" />
    <LiveTweets id="live-tweets" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LiveTweets from './components/LiveTweets.vue'
import HistoricData from '@/components/HistoricData.vue'

export default defineComponent({
  name: 'App',
  components: {
    HistoricData,
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
</style>
