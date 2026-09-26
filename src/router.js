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
    footerName: tool.footerName,
    description: tool.description
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

// SEO：按路由动态更新 canonical / description / OG / JSON-LD
const SITE = 'https://403.li'
const HOME_DESC = '403.li 是一个终端风格的在线工具站，提供 JSON 格式化、Base64 编解码、二维码生成等实用工具。快速、高效、开发者友好。'

function setMeta(attr, name, content) {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setSeo(route) {
  const title = route.meta?.title
  const fullTitle = title ? `${title} - 403.li` : '403.li - 终端风格工具站'
  const url = SITE + (route.path === '/' ? '/' : route.path)
  const desc = route.meta?.description
    ? `${route.meta.description}。403.li 纯前端工具，数据不离开浏览器。`
    : HOME_DESC

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url

  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', url)
  setMeta('property', 'twitter:title', fullTitle)
  setMeta('property', 'twitter:description', desc)
  setMeta('property', 'twitter:url', url)

  // JSON-LD 结构化数据
  const ld = {
    '@context': 'https://schema.org',
    '@type': title ? 'WebApplication' : 'WebSite',
    name: title || '403.li',
    url,
    description: desc,
    inLanguage: 'zh-CN',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }
  }
  let ldEl = document.getElementById('ld-json')
  if (!ldEl) {
    ldEl = document.createElement('script')
    ldEl.type = 'application/ld+json'
    ldEl.id = 'ld-json'
    document.head.appendChild(ldEl)
  }
  ldEl.textContent = JSON.stringify(ld)
}

// 页面标题动态更新
router.beforeEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} - 403.li` : '403.li - 终端风格工具站'
  setSeo(to)
  // 记录工具使用时间（用于置顶排序）
  if (to.path.startsWith('/tools/') && to.meta?.title) {
    recordUsage(to.path)
  }
})

export default router
