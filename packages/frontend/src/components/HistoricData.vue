<template>
  <div>
    <h1>Historic data</h1>
    <label for="#date-select" v-text="'Select date: '" />
    <select id="#date-select" v-model="selectedDate">
      <option v-for="(date, i) in dates" :value="i" v-text="date" :key="i" />
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import axios from 'axios'

interface HistoricData {
  country: string
  cases: number
  newCases: number
  newCasesPerTweet: number
  population: number
  tweets: number
}

export default defineComponent({
  name: 'HistoricData',
  setup() {
    const startDate = dayjs('12-08-2020')
    const dates = ref(generateDates(startDate))
    const selectedDate = ref(dates.value.length - 1)
    const data = ref<HistoricData[]>([])

    onMounted(async () => (data.value = await getData(selectedDate.value)))
    watch(selectedDate, async (value) => (data.value = await getData(value)))

    async function getData(dateIndex: number): Promise<HistoricData[]> {
      const date = startDate.clone().add(dateIndex, 'day').format('MM-DD-YYYY')

      try {
        return axios
          .get<HistoricData[]>(`http://localhost:8000/historic`, { params: { date } })
          .then((response) => response.data)
      } catch (e) {
        console.error(e)
        return []
      }
    }

    function generateDates(startDate: dayjs.Dayjs): string[] {
      const daysSinceStart = dayjs().diff(startDate, 'day')
      const days: dayjs.Dayjs[] = []
      for (let i = 0; i <= daysSinceStart; i++) days.push(startDate.clone().add(i, 'day'))

      return days.map((day) => day.format('MMMM D, YYYY'))
    }

    return { selectedDate, dates }
  }
})
</script>
