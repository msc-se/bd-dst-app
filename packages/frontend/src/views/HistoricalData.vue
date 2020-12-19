<template>
  <div>
    <DateSelect v-model:date="selectedDate" />
    <h2 v-if="isLoading">Loading...</h2>
    <div v-else-if="selectedMetrics.length > 0">
      <h2>Global</h2>
      <p>
        <b>Population:</b> {{ globalMetrics.population.toLocaleString() }}, <b>cases:</b>
        {{ globalMetrics.cases.toLocaleString() }}, <b>new cases:</b> {{ globalMetrics.newCases.toLocaleString() }},
        <b>new cases per tweet:</b> {{ globalMetrics.newCasesPerTweet.toLocaleString() }}, <b>tweets:</b>
        {{ globalMetrics.tweets.toLocaleString() }}
      </p>
      <Chart :metrics="selectedMetrics" style="margin-top: 20px" />
    </div>
    <h2 v-else>No data available for selected date</h2>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed, reactive } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'
import Chart from '@/components/Chart.vue'
import DateSelect from '@/components/DateSelect.vue'

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
  name: 'HistoricalData',
  components: { Chart, DateSelect },
  setup() {
    const startDate = dayjs('12-08-2020', 'MM-DD-YYYY')
    const isLoading = ref(true)
    const dates = ref(generateDates(startDate))
    const selectedDate = ref(startDate.format('MM-DD-YYYY'))
    const metrics = reactive(new Map<string, Metrics[]>())
    const selectedMetrics = computed(() => metrics.get(selectedDate.value) ?? [])
    const globalMetrics = computed(() => selectedMetrics.value.find(({ code }) => code === '-1'))

    onMounted(() => {
      if (!metrics.has(selectedDate.value))
        getData(selectedDate.value).then((data) => metrics.set(selectedDate.value, data))
    })

    watch(selectedDate, async (value) => {
      if (!metrics.has(value)) metrics.set(value, await getData(value))
    })

    async function getData(date: string): Promise<Metrics[]> {
      try {
        isLoading.value = true
        const response = await axios.get<Metrics[]>(`http://localhost:8000/historical`, { params: { date } })

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
      for (let i = 0; i < daysSinceStart; i++) days.push(startDate.clone().add(i, 'day'))

      return days.map((day) => day.format('MMMM D, YYYY'))
    }

    return { selectedDate, dates, selectedMetrics, isLoading, globalMetrics }
  }
})
</script>
