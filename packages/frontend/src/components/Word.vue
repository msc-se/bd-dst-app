<template>
  <text ref="root" :style="style" :transform="transform" text-anchor="middle">{{ word.text }}</text>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { computed, defineComponent, ref, toRefs } from 'vue'
import d3Cloud from 'd3-cloud'

export default defineComponent({
  name: 'Word',
  props: {
    word: {
      type: Object,
      required: true
    }
  },
  setup(props: { word: d3Cloud.Word }) {
    const root = ref('root')
    const word = toRefs(props).word
    const transform = ref(parseTransform(word.value))

    function parseTransform(word: d3Cloud.Word): string {
      return `translate(${word.x}, ${word.y}) rotate(${word.rotate})`
    }

    const style = computed(() => ({
      fontSize: `${word.value.size}px`,
      // @ts-ignore
      height: `${word.value.height}px`,
      // @ts-ignore
      width: `${word.value.width}px`
    }))

    return { root, style, transform }
  }
})
</script>

<style scoped></style>
