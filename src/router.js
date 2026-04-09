import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import JsonTool from './views/tools/JsonTool.vue'
import Base64Tool from './views/tools/Base64Tool.vue'
import QrCodeTool from './views/tools/QrCodeTool.vue'
import TimestampTool from './views/tools/TimestampTool.vue'
import UrlTool from './views/tools/UrlTool.vue'
import HashTool from './views/tools/HashTool.vue'
import PasswordTool from './views/tools/PasswordTool.vue'
import ColorTool from './views/tools/ColorTool.vue'
import FontTool from './views/tools/FontTool.vue'
import AvatarTool from './views/tools/AvatarTool.vue'
import AsciiTool from './views/tools/AsciiTool.vue'
import Icons from './views/Icons.vue'
import NotFound from './views/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // /tools 路由已删除，使用主页作为工具列表入口
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
    path: '/tools/avatar',
    name: 'AvatarTool',
    component: AvatarTool
  },
  {
    path: '/tools/ascii',
    name: 'AsciiTool',
    component: AsciiTool
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
