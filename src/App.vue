<template>
  <div class="app">
    <!-- 顶部导航 -->
    <header class="topbar">
      <a href="/" class="brand">403<span>.</span>li</a>
      <nav class="nav">
        <a href="/" class="nav-link">工具</a>
        <a href="https://github.com" target="_blank" class="nav-link">GitHub</a>
        <button class="theme-toggle" @click="toggleTheme">{{ isDark ? '浅色' : '深色' }}</button>
      </nav>
    </header>

    <!-- 工具面板 -->
    <main class="tool-panel">
      <div class="panel-head">
        <span>工具列表</span>
        <span>{{ filteredTools.length }} / {{ tools.length }}</span>
      </div>
      <div class="panel-body">
        <!-- 分类标签 -->
        <div class="tabs">
          <span class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</span>
          <span class="tab" :class="{ active: activeTab === 'encoding' }" @click="activeTab = 'encoding'">编码</span>
          <span class="tab" :class="{ active: activeTab === 'text' }" @click="activeTab = 'text'">文本</span>
          <span class="tab" :class="{ active: activeTab === 'time' }" @click="activeTab = 'time'">时间</span>
          <span class="tab" :class="{ active: activeTab === 'image' }" @click="activeTab = 'image'">图片</span>
        </div>

        <!-- 工具网格 -->
        <div class="tool-grid">
          <article class="tool-item" v-for="tool in filteredTools" :key="tool.id" @click="navigateTo(tool.path)">
            <div class="tool-header">
              <span class="tool-id">#{{ tool.id.toString().padStart(2, '0') }}</span>
              <span class="tool-path">{{ tool.path }}</span>
            </div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
          </article>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <span>403.li</span>
      <span>纯前端 · 无追踪</span>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isDark: true,
      activeTab: 'all',
      tools: [
        { id: 1, path: '/json', name: 'JSON 格式化', description: '格式化、压缩和校验 JSON 数据', category: 'encoding' },
        { id: 2, path: '/base64', name: 'Base64 编解码', description: 'Base64 编码和解码工具', category: 'encoding' },
        { id: 3, path: '/url', name: 'URL 编解码', description: 'URL 编码和解码工具', category: 'encoding' },
        { id: 4, path: '/hash', name: '哈希计算', description: 'MD5、SHA1、SHA256 哈希计算', category: 'text' },
        { id: 5, path: '/password', name: '密码生成', description: '生成安全随机密码', category: 'text' },
        { id: 6, path: '/qrcode', name: '二维码生成', description: '文本和链接转二维码图片', category: 'image' },
        { id: 7, path: '/color', name: '颜色转换', description: 'HEX、RGB、HSL 颜色格式转换', category: 'image' },
        { id: 8, path: '/timestamp', name: '时间戳转换', description: '时间戳和日期互相转换', category: 'time' }
      ]
    }
  },
  computed: {
    filteredTools() {
      if (this.activeTab === 'all') {
        return this.tools
      }
      return this.tools.filter(tool => tool.category === this.activeTab)
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push('/tools' + path)
    },
    toggleTheme() {
      this.isDark = !this.isDark
      document.documentElement.setAttribute('data-theme', this.isDark ? '' : 'light')
    }
  }
}
</script>

<style scoped>
</style>
