<template>
  <div class="app">
    <Topbar :toolCount="toolCount" />
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
    <footer class="footer" role="contentinfo">
      <span>403.li // {{ footerName }}</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from './Topbar.vue'
import ErrorBoundary from './ErrorBoundary.vue'
import { tools } from '../config/tools'

export default {
  name: 'ToolLayout',
  components: {
    Topbar,
    ErrorBoundary
  },
  computed: {
    toolCount() {
      return tools.length
    },
    footerName() {
      const meta = this.$route.meta
      return meta.footerName || meta.title || '在线工具'
    }
  }
}
</script>
