<template>
  <div>
    <select id="#date-select" v-model="selectedMetric">
      <option v-for="(key, i) in functionMap" :value="key[1]" v-text="key[0]" :key="i" />
    </select>
    <div style="justify-content: center; display: flex; margin-bottom: 10px" v-if="svg.legend" v-html="svg.legend" />
    <div v-if="svg.map" v-html="svg.map" />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { computed, defineComponent, ref, toRefs } from 'vue'
import * as d3 from 'd3'
import world from '../assets/countries-50m.json'
import * as topojson from 'topojson-client'
import { Metrics } from '@/components/HistoricalData.vue'

interface Graph {
  map?: string
  legend?: string
}

const functionMap = new Map<string, (entry: Metrics) => number>([
  ['Cases', (entry) => entry.cases],
  ['New cases', (entry) => entry.newCases],
  ['Population', (entry) => entry.population],
  ['Tweets', (entry) => entry.tweets],
  ['New cases / tweet', (entry) => entry.newCasesPerTweet],
  ['Cases / Population', (entry) => entry.cases / entry.population]
])

interface Props {
  metrics: Metrics[]
}

// @ts-ignore
export default defineComponent<Props>({
  name: 'Chart',
  props: {
    metrics: {
      type: Array,
      default: () => []
    }
  },
  setup(props: Props) {
    const metrics = toRefs(props).metrics
    const mapped = computed(
      () =>
        new Map<string, Metrics>(
          metrics.value.filter((metrics) => metrics.code != '-1').map((metrics) => [format(metrics.code), metrics])
        )
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const selectedMetric = ref(functionMap.get('Cases / Population')!)

    const svg = computed<Graph>(() => {
      const { ll, map } = setupD3(mapped.value, selectedMetric.value)
      return { map: map?.outerHTML, legend: ll?.outerHTML }
    })

    return { svg, functionMap, selectedMetric }
  }
})

function format(id: string): string {
  while (id?.length < 3) id = '0' + id

  return id
}

function setupD3(mapped: Map<string, Metrics>, entryMapper: (entry: Metrics) => number) {
  let domain = [0]
  for (let entry of mapped.values()) domain.push(entryMapper(entry))

  // @ts-ignore
  const countries = topojson.feature(world, world.objects.countries)

  const outline: d3.GeoSphere = { type: 'Sphere' }

  const width = 975

  const projection = d3.geoEqualEarth()

  const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, outline)).bounds(outline)
  const height = Math.ceil(y1 - y0)
  const l = Math.min(Math.ceil(x1 - x0), height)
  projection.scale((projection.scale() * (l - 1)) / l).precision(0.2)
  const path = d3.geoPath(projection)

  // @ts-ignore
  const color = d3.scaleSequential().domain(d3.extent(domain)).interpolator(d3.interpolateOrRd).unknown('#ccc')

  const svg = d3.create('svg').style('display', 'block').attr('viewBox', `0 0 ${width} ${height}`)

  const defs = svg.append('defs')

  defs
    .append('path')
    .attr('id', 'outline')
    // @ts-ignore
    .attr('d', path({ type: 'Sphere' }))

  // @ts-ignore
  defs.append('clipPath').attr('id', 'clip').append('use').attr('xlink:href', new URL('#outline', location))

  // @ts-ignore
  const g = svg.append('g').attr('clip-path', `url(${new URL('#clip', location)})`)

  // @ts-ignore
  g.append('use').attr('xlink:href', new URL('#outline', location)).attr('fill', '#3987c9')

  let print = function (metrics: Metrics): string {
    return (
      `Cases: \t\t\t\t${metrics.cases.toLocaleString()}\n` +
      `New cases: \t\t${metrics.newCases.toLocaleString()}\n` +
      `Population: \t\t${metrics.population.toLocaleString()}\n` +
      `Tweets: \t\t\t${metrics.tweets.toLocaleString()}\n` +
      `New Cases/Tweet: \t${metrics.newCasesPerTweet.toLocaleString()}`
    )
  }

  g.append('g')
    .selectAll('path')
    // @ts-ignore
    .data(countries.features)
    .join('path')
    // @ts-ignore
    .attr('fill', (d) => color(mapped.has(d.id) ? entryMapper(mapped.get(d.id)) : undefined))
    // @ts-ignore
    .attr('d', path)
    .append('title')
    // @ts-ignore
    .text((d) => `${d.properties.name} \n${mapped.has(d.id) ? print(mapped.get(d.id)) : 'N/A'}`)

  g.append('path')
    // @ts-ignore
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-linejoin', 'round')
    .attr('d', path)

  // @ts-ignore
  svg.append('use').attr('xlink:href', new URL('#outline', location)).attr('fill', 'none').attr('stroke', 'black')

  // @ts-ignore
  const ll = legend({ color, title: 'Color' })

  return { map: svg.node(), ll }
}

function legend({
  // @ts-ignore
  color,
  // @ts-ignore
  title,
  // @ts-ignore
  tickSize = 6,
  // @ts-ignore
  width = 640,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 128,
  // @ts-ignore
  tickFormat,
  // @ts-ignore
  tickValues
} = {}) {
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)

    // @ts-ignore
    .attr('viewBox', [0, 0, width, height])
    .style('overflow', 'visible')
    .style('display', 'block')

  let x

  // Continuous
  if (color.interpolator) {
    x = Object.assign(color.copy().interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
      range: () => [marginLeft, width - marginRight]
    })

    svg
      .append('image')
      .attr('x', marginLeft)
      .attr('y', marginTop)
      .attr('width', width - marginLeft - marginRight)
      .attr('height', height - marginTop - marginBottom)
      .attr('preserveAspectRatio', 'none')
      .attr('xlink:href', ramp(color.interpolator()).toDataURL())

    // scaleSequentialQuantile doesn't implement ticks or tickFormat.
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1)
        tickValues = d3.range(n).map((i) => d3.quantile(color.domain(), i / (n - 1)))
      }
      if (typeof tickFormat !== 'function') {
        tickFormat = d3.format(tickFormat === undefined ? ',f' : tickFormat)
      }
    }
  }

  svg
    .append('g')
    .attr('transform', `translate(0, ${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(ticks, typeof tickFormat === 'string' ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === 'function' ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues)
    )
    .call((g) => g.selectAll('.tick line').attr('y1', marginTop + marginBottom - height))
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .append('text')
        .attr('y', marginTop + marginBottom - height - 6)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text(title)
    )

  return svg.node()
}

// @ts-ignore
function ramp(color, n = 256) {
  // @ts-ignore
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', n.toString())
  canvas.setAttribute('height', '1')
  const context = canvas.getContext('2d')!
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1))
    context.fillRect(i, 0, 1, 1)
  }
  return canvas
}
</script>

<style scoped></style>
