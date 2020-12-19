<template>
  <div id="word-cloud">
    <div id="controls">
      <DateSelect v-model:date="selectedDate" :start-date="startDate" include-today />
      <div v-if="status">
        <p>Status: {{ status.taskState }} - elapsed: {{ status.elapsedTime / 1000 }}</p>
        <p v-text="status.statusMessage" />
      </div>
      <button :disabled="isRunning" @click="fetchWordCount" v-text="'Fetch words'" />
    </div>
    <svg :width="width" :height="height">
      <g :transform="`translate(${width / 2}, ${height / 2})`">
        <Word v-for="word in wordCloud" :word="word" :key="word.text" />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/ban-ts-comment */
import { defineComponent, onMounted, ref, watch, reactive, computed } from 'vue'
import axios from 'axios'
import DateSelect from '@/components/DateSelect.vue'
import Word from '@/components/Word.vue'
import * as d3 from 'd3'
import d3Cloud from 'd3-cloud'
import dayjs from 'dayjs'

interface StatusMessage {
  taskState: string
  statusMessage: string
  elapsedTime: number
}

interface WordCount {
  count: number
  word: string
}

export default defineComponent({
  name: 'WordCloud',
  components: { Word, DateSelect },
  setup() {
    const startDate = dayjs('12-18-2020', 'MM-DD-YYYY')
    const status = ref<StatusMessage | undefined>(undefined)
    const selectedDate = ref(startDate.format('MM-DD-YYYY'))
    const isRunning = ref(false)
    const width = ref(window.innerWidth - 100)
    const height = ref(window.innerHeight - 250)
    const wordCounts = reactive(new Map<string, WordCount[]>())
    const wordCloud = ref<d3Cloud.Word[]>([])

    const selectedWordCount = computed(() => wordCounts.get(selectedDate.value) ?? [])

    onMounted(async () => {
      const connection = new WebSocket('ws://localhost:8000/status')
      connection.onmessage = (message) => (status!.value = JSON.parse(message.data))
      wordCloud.value = await createCloud()
    })

    function calculateFontSize(count: number): number {
      return (
        d3
          .scaleLog()
          // .scaleLinear()
          // @ts-ignore
          .domain(d3.extent(selectedWordCount.value.map(({ count }) => count)))
          .range([10, 75])(count)
      )
    }

    watch(selectedWordCount, async () => {
      wordCloud.value = []
      wordCloud.value = await createCloud()
    })

    function createCloud(): Promise<d3Cloud.Word[]> {
      return new Promise((resolve) => {
        const layout = d3Cloud()
          .size([width.value, height.value - 100])
          .words(selectedWordCount.value.map(({ word: text, count }) => ({ text, count })))
          .padding(5)
          .font('Impact')
          // @ts-ignore
          .fontSize((d) => calculateFontSize(d.count))
          .on('end', resolve)

        layout.start()
      })
    }

    async function fetchWordCount(): Promise<void> {
      const date = selectedDate.value
      try {
        isRunning.value = true
        const response = await axios.get<WordCount[]>(`http://localhost:8000/word-count`, {
          params: { date }
        })
        wordCounts.set(date, response.data)
      } catch (e) {
        console.error(e)
      } finally {
        isRunning.value = false
      }
    }

    return { fetchWordCount, status, isRunning, selectedDate, wordCounts, wordCloud, height, width, startDate }
  }
})
</script>

<style scoped>
#controls *:not(:last-child) {
  margin-bottom: 10px;
}
</style>
