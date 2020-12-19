import { createWebHistory, createRouter } from 'vue-router'
import HistoricalData from '@/views/HistoricalData.vue'
import LiveTweets from '@/views/LiveTweets.vue'
import WordCloud from '@/views/WordCloud.vue'

const routes = [
  {
    path: '/',
    name: 'Historical Data',
    component: HistoricalData
  },
  {
    path: '/live-tweets',
    name: 'Live Tweets',
    component: LiveTweets
  },
  {
    path: '/word-cloud',
    name: 'Word Cloud',
    component: WordCloud
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
