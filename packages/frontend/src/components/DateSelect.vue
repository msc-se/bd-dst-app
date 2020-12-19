<template>
  <div>
    <label for="#date-select" v-text="'Select date: '" />
    <select id="#date-select" v-model="selectedDate">
      <option v-for="(date, i) in dates" :value="i" v-text="date" :key="i" />
    </select>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue'
import dayjs from 'dayjs'

interface Props {
  startDate: dayjs.Dayjs
  includeToday: boolean
}

// @ts-ignore
export default defineComponent<Props>({
  name: 'DateSelect',
  props: {
    startDate: {
      type: Object,
      required: false
    },
    includeToday: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:date'],
  // @ts-ignore
  setup(props: Props, { emit }) {
    const startDate = toRefs(props).startDate ?? ref(dayjs('12-08-2020', 'MM-DD-YYYY'))
    const includeToday = toRefs(props).includeToday
    const dates = ref(generateDates(startDate.value))
    const selectedDate = ref(0)

    onMounted(() => emit('update:date', formatDate(startDate.value.clone())))
    watch(selectedDate, (val) => emit('update:date', formatDate(startDate.value.clone().add(val, 'day'))))

    function formatDate(date: dayjs.Dayjs): string {
      return date.format('MM-DD-YYYY')
    }

    function generateDates(startDate: dayjs.Dayjs): string[] {
      let daysSinceStart = dayjs().diff(startDate, 'day')
      if (includeToday.value) daysSinceStart++

      const days: dayjs.Dayjs[] = []
      for (let i = 0; i < daysSinceStart; i++) days.push(startDate.clone().add(i, 'day'))

      return days.map((day) => day.format('MMMM D, YYYY'))
    }

    return { dates, selectedDate }
  }
})
</script>

<style scoped />
