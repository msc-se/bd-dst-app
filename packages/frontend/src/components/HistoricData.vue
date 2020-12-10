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
import { defineComponent, ref } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'HistoricData',
  setup() {
    const startDate = dayjs('12-08-2020')
    const dates = ref(generateDates(startDate))
    const selectedDate = ref(dates.value.length - 1)

    return { selectedDate, dates }
  }
})

function generateDates(startDate: dayjs.Dayjs): string[] {
  const daysSinceStart = dayjs().diff(startDate, 'day')
  const _days: dayjs.Dayjs[] = []
  for (let i = 0; i <= daysSinceStart; i++) _days.push(startDate.clone().add(i, 'day'))

  return _days.map((day) => day.format('MMMM D, YYYY'))
}
</script>

<style scoped></style>
