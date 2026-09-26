import { createRouter, createWebHistory } from 'vue-router'
import { tools } from './config/tools'
import ToolLayout from './components/ToolLayout.vue'
import { recordUsage } from './utils/prefs'

/**
 * path → 组件名自动推导
 * /tools/json → JsonTool
 * /tools/base64 → Base64Tool
 * /tools/css-unit → CssUnitTool
 */
function pathToComponent(path) {
  const name = path.replace('/tools/', '')
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') + 'Tool'
}

const toolRoutes = tools.map(tool => ({
  path: tool.path.replace('/tools/', ''),
  name: tool.name,
  component: () => import(`./views/tools/${pathToComponent(tool.path)}.vue`),
  meta: {
    title: tool.name,
    footerName: tool.footerName
  }
}))

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/tools',
    component: ToolLayout,
    children: toolRoutes
  },
  {
    path: '/:pathMatch(.*)',
    name: 'NotFound',
    component: () => import('./views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 页面标题动态更新
router.beforeEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} - 403.li` : '403.li - 终端风格工具站'
  // 记录工具使用时间（用于置顶排序）
  if (to.path.startsWith('/tools/') && to.meta?.title) {
    recordUsage(to.path)
  }
})

export default router
