<template>
  <div>
    <h1>Live tweets</h1>
    <ul
      v-for="([country, tweets], i) in Object.entries(countryTweets)"
      :key="i"
      v-text="`${country} - ${tweets}`"
      style="padding: 0"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export interface TweetPayload {
  country: string
  tweets: number
}

export default defineComponent({
  name: 'LiveTweets',
  setup() {
    const countryTweets = ref<Record<string, number>>({})

    onMounted(() => {
      try {
        const connection = new WebSocket('ws://localhost:8000/live')
        connection.onmessage = handleMessage
      } catch (e) {
        console.error('Could not connect to server')
      }
    })

    function handleMessage(message: MessageEvent): void {
      const payload: TweetPayload | TweetPayload[] = JSON.parse(message.data)

      if (Array.isArray(payload)) {
        payload.forEach(({ country, tweets }) => (countryTweets.value[country] = tweets))
      } else countryTweets.value[payload.country] = payload.tweets
    }

    return { countryTweets }
  }
})
</script>
