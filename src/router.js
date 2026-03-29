import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Tools from './views/Tools.vue'
import JsonFormatter from './tools/JsonFormatter.vue'
import Icons from './views/Icons.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tools',
    name: 'Tools',
    component: Tools
  },
  {
    path: '/tools/json',
    name: 'JsonFormatter',
    component: JsonFormatter
  },
  {
    path: '/games',
    name: 'Games',
    component: Icons
  },
  {
    path: '/icons',
    name: 'Icons',
    component: Icons
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
