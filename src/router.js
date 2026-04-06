import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Tools from './views/Tools.vue'
import JsonFormatter from './tools/JsonFormatter.vue'
import Base64Tool from './views/Base64Tool.vue'
import QrCodeTool from './tools/QrCodeTool.vue'
import TimestampTool from './tools/TimestampTool.vue'
import UrlTool from './tools/UrlTool.vue'
import PasswordTool from './tools/PasswordTool.vue'
import Icons from './views/Icons.vue'
import NotFound from './views/NotFound.vue'

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
    path: '/tools/base64',
    name: 'Base64Tool',
    component: Base64Tool
  },
  {
    path: '/tools/qrcode',
    name: 'QrCodeTool',
    component: QrCodeTool
  },
  {
    path: '/tools/timestamp',
    name: 'TimestampTool',
    component: TimestampTool
  },
  {
    path: '/tools/url',
    name: 'UrlTool',
    component: UrlTool
  },
  {
    path: '/tools/password',
    name: 'PasswordTool',
    component: PasswordTool
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
  },
  {
    path: '/:pathMatch(.*)',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
