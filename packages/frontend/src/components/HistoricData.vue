<template>
  <div>
    <h1>Historic data</h1>
    <label for="#date-select" v-text="'Select date: '" />
    <select id="#date-select" v-model="selectedDate">
      <option v-for="(date, i) in dates" :value="i" v-text="date" :key="i" />
    </select>
    <h2 v-if="isLoading">Loading...</h2>
    <Chart v-else-if="selectedMetrics.length > 0" :metrics="selectedMetrics" style="margin-top: 20px" />
    <h2 v-else>No data available for selected date</h2>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import Chart from '@/components/Chart.vue'

export interface Metrics {
  code: string
  country: string
  cases: number
  newCases: number
  newCasesPerTweet: number
  population: number
  tweets: number
}

export default defineComponent({
  name: 'HistoricData',
  components: { Chart },
  setup() {
    const startDate = dayjs('12-08-2020', 'MM-DD-YYYY')
    const isLoading = ref(true)
    const dates = ref(generateDates(startDate))
    const selectedDate = ref(0)
    const metrics = ref(new Map<number, Metrics[]>())
    const selectedMetrics = computed(() => metrics.value.get(selectedDate.value) ?? [])

    onMounted(async () => metrics.value.set(selectedDate.value, await getData(selectedDate.value)))
    watch(selectedDate, async (value) => {
      if (!metrics.value.has(value)) metrics.value.set(value, await getData(value))
    })

    async function getData(dateIndex: number): Promise<Metrics[]> {
      const date = startDate.clone().add(dateIndex, 'day').format('MM-DD-YYYY')

      try {
        isLoading.value = true
        const response = await axios.get<Metrics[]>(`http://localhost:8000/historic`, { params: { date } })

        return response.data
      } catch (e) {
        console.error(e)
        return []
      } finally {
        isLoading.value = false
      }
    }

    function generateDates(startDate: dayjs.Dayjs): string[] {
      const daysSinceStart = dayjs().diff(startDate, 'day')
      const days: dayjs.Dayjs[] = []
      for (let i = 0; i <= daysSinceStart; i++) days.push(startDate.clone().add(i, 'day'))

      return days.map((day) => day.format('MMMM D, YYYY'))
    }

    return { selectedDate, dates, selectedMetrics, isLoading }
  }
})
</script>
