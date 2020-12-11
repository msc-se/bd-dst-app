<template>
  <h1>Hive</h1>
  <select id="#date-select" v-model="selectedMetric">
    <option v-for="key in functionMap" :value="key[1]" v-text="key[0]" :key="key[0]" />
  </select>
  <div style="margin: auto; width: 640px" v-if="svg.legend" v-html="svg.legend"></div>
  <div v-if="svg.map" v-html="svg.map"></div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

import * as d3 from 'd3'

import world from '../assets/countries-50m.json'
import data from '../assets/data.json'
import * as topojson from 'topojson-client'

interface Metric {
  cases: number
  new_cases: number
  population: number
  tweets: number
  new_cases_per_tweet: number
}

interface graph {
  map?: string
  legend?: string
}

const functionMap = new Map<string, (entry: Metric) => number>([
  ['Cases', (entry) => entry.cases],
  ['New cases', (entry) => entry.new_cases],
  ['Population', (entry) => entry.population],
  ['Tweets', (entry) => entry.tweets],
  ['New cases / tweet', (entry) => entry.new_cases_per_tweet],
  ['Cases / Population', (entry) => entry.cases / entry.population]
])

export default defineComponent({
  name: 'Hive',
  setup() {
    const mapped = new Map<string, Metric>(
      data
        .filter((key) => key.code3 != '-1')
        .map((key) => [
          format(key.code3),
          {
            cases: key.cases,
            new_cases: key.new_cases,
            population: key.population,
            tweets: key.tweets,
            new_cases_per_tweet: key.new_cases_per_tweet
          }
        ])
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const selectedMetric = ref(functionMap.get('Cases / Population')!)

    const svg = computed<graph>(() => {
      const { ll, map } = setupD3(mapped, selectedMetric.value)
      return { map: map?.outerHTML, legend: ll?.outerHTML }
    })

    return { svg, functionMap, selectedMetric }
  }
})

function format(id: string): string {
  while (id.length < 3) {
    id = '0' + id
  }
  return id
}

function setupD3(mapped: Map<string, Metric>, entryMapper: (entry: Metric) => number) {
  let domain = [0]
  for (let entry of mapped.values()) {
    domain.push(entryMapper(entry))
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  console.log(d3.extent(domain))

  const color = d3
    .scaleSequential()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .domain(d3.extent(domain))
    .interpolator(d3.interpolateOrRd)
    .unknown('#ccc')

  const svg = d3.create('svg').style('display', 'block').attr('viewBox', `0 0 ${width} ${height}`)

  const defs = svg.append('defs')

  defs
    .append('path')
    .attr('id', 'outline')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .attr('d', path({ type: 'Sphere' }))

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  defs.append('clipPath').attr('id', 'clip').append('use').attr('xlink:href', new URL('#outline', location))

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const g = svg.append('g').attr('clip-path', `url(${new URL('#clip', location)})`)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  g.append('use').attr('xlink:href', new URL('#outline', location)).attr('fill', 'white')

  let print = function (metric: Metric): string {
    return (
      `Cases: \t\t\t\t${metric.cases.toLocaleString()}\n` +
      `New cases: \t\t${metric.new_cases.toLocaleString()}\n` +
      `Population: \t\t${metric.population.toLocaleString()}\n` +
      `Tweets: \t\t\t${metric.tweets.toLocaleString()}\n` +
      `New Cases/Tweet: \t${metric.new_cases_per_tweet.toLocaleString()}`
    )
  }

  g.append('g')
    .selectAll('path')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .data(countries.features)
    .join('path')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .attr('fill', (d) => color(mapped.has(d.id) ? entryMapper(mapped.get(d.id)) : undefined))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .attr('d', path)
    .append('title')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .text((d) => `${d.properties.name} \n${mapped.has(d.id) ? print(mapped.get(d.id)) : 'N/A'}`)

  g.append('path')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-linejoin', 'round')
    .attr('d', path)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  svg.append('use').attr('xlink:href', new URL('#outline', location)).attr('fill', 'none').attr('stroke', 'black')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ll = legend({ color, title: 'Color' })

  return { map: svg.node(), ll }
}

function legend({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  color,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  title,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  tickSize = 6,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  width = 640,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 128,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  tickFormat,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  tickValues
} = {}) {
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .attr('viewBox', [0, 0, width, height])
    .style('overflow', 'visible')
    .style('display', 'block')

  let x

  // Continuous
  if (color.interpolator) {
    x = Object.assign(color.copy().interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
      range() {
        return [marginLeft, width - marginRight]
      }
    })

    svg
      .append('image')
      .attr('x', marginLeft)
      .attr('y', marginTop)
      .attr('width', width - marginLeft - marginRight)
      .attr('height', height - marginTop - marginBottom)
      .attr('preserveAspectRatio', 'none')
      .attr('xlink:href', ramp(color.interpolator()).toDataURL())

    // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function ramp(color, n = 256) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
