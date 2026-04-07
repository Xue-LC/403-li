import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Tools from './views/Tools.vue'
import JsonTool from './views/tools/JsonTool.vue'
import Base64Tool from './views/tools/Base64Tool.vue'
import QrCodeTool from './views/tools/QrCodeTool.vue'
import TimestampTool from './views/tools/TimestampTool.vue'
import UrlTool from './views/tools/UrlTool.vue'
import HashTool from './views/tools/HashTool.vue'
import PasswordTool from './views/tools/PasswordTool.vue'
import ColorTool from './views/tools/ColorTool.vue'
import FontTool from './views/tools/FontTool.vue'
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
    name: 'JsonTool',
    component: JsonTool
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
    path: '/tools/hash',
    name: 'HashTool',
    component: HashTool
  },
  {
    path: '/tools/password',
    name: 'PasswordTool',
    component: PasswordTool
  },
  {
    path: '/tools/color',
    name: 'ColorTool',
    component: ColorTool
  },
  {
    path: '/tools/font',
    name: 'FontTool',
    component: FontTool
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
