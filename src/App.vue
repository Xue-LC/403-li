<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <header class="topbar">
      <div class="brand">
        <div class="leds">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="brand-text">403.li / 中文工具站</span>
      </div>
      <div class="status">模式：终端像素风 / 低噪音 / 手机优先</div>
    </header>

    <!-- 搜索栏 -->
    <label class="search">
      <span class="search-prefix">搜索&gt;</span>
      <input placeholder="搜索工具，比如：JSON、Base64、二维码、时间戳" v-model="searchQuery" />
    </label>

    <!-- 主内容区 -->
    <div class="layout">
      <!-- 左侧主面板 -->
      <main class="pane">
        <div class="pane-head">
          <span>工作区</span>
          <span>就绪</span>
        </div>
        <div class="pane-body">
          <div class="intro">
            <h1>打开就能找工具，别搞太复杂。</h1>
            <p>
              这版把布局收得更简单：上面搜索，中间常用操作，下面直接是工具列表。
              工具名和说明尽量都用中文，先让人看得懂、点得动、在手机上也不乱。
            </p>
          </div>

          <!-- 命令行输入 -->
          <div class="command">
            <span class="prompt">user@403:~$</span>
            <input placeholder="例如：打开 JSON 工具 / 生成二维码 / 解码 Base64" v-model="command" @keyup.enter="executeCommand" />
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <button class="quick-btn" @click="navigateTo('/tools/json')">打开 JSON 工具</button>
            <button class="quick-btn" @click="navigateTo('/tools/base64')">解码 Base64</button>
            <button class="quick-btn" @click="navigateTo('/tools/qrcode')">生成二维码</button>
            <button class="quick-btn" @click="navigateTo('/tools/timestamp')">时间戳转换</button>
          </div>
        </div>
      </main>

      <!-- 右侧状态面板 -->
      <aside class="pane">
        <div class="pane-head">
          <span>状态</span>
          <span>正常</span>
        </div>
        <div class="pane-body">
          <div class="stats">
            <div class="stat">
              <div class="k">工具数量</div>
              <div class="v">09</div>
            </div>
            <div class="stat">
              <div class="k">常用分类</div>
              <div class="v">编码</div>
            </div>
          </div>

          <div class="simple-list">
            <div class="simple-row"><span>界面风格</span><span class="ok">终端像素风</span></div>
            <div class="simple-row"><span>布局策略</span><span>手机优先</span></div>
            <div class="simple-row"><span>信息密度</span><span>中等</span></div>
          </div>
        </div>
      </aside>

      <!-- 工具列表 -->
      <section class="pane" style="grid-column: 1 / -1;">
        <div class="pane-head">
          <span>工具列表</span>
          <span>精选</span>
        </div>
        <div class="pane-body">
          <div class="group-tabs">
            <span class="tab active" @click="activeTab = 'all'">全部</span>
            <span class="tab" @click="activeTab = 'encoding'">编码</span>
            <span class="tab" @click="activeTab = 'text'">文本</span>
            <span class="tab" @click="activeTab = 'time'">时间</span>
            <span class="tab" @click="activeTab = 'image'">图片</span>
          </div>

          <div class="tool-list">
            <article class="tool-card" v-for="tool in filteredTools" :key="tool.id" @click="navigateTo(tool.path)">
              <div class="tool-top">
                <span class="tool-id">[{{ tool.number }}]</span>
                <span>{{ tool.path }}</span>
              </div>
              <h3>{{ tool.name }}</h3>
              <p>{{ tool.description }}</p>
              <div class="tool-foot">
                <span class="tag">{{ tool.status }}</span>
                <span>{{ tool.features }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <span>403.li</span>
      <span>终端像素风格</span>
      <span>手机优先</span>
    </footer>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    
    const navigateTo = (path) => {
      router.push(path)
    }

    return {
      navigateTo
    }
  },
  data() {
    return {
      searchQuery: '',
      command: '',
      activeTab: 'all',
      tools: [
        { id: 1, number: '01', path: '/tools/json', name: 'JSON 格式化', description: '用于格式化、压缩和校验 JSON。适合放在工具站首页最上面，用户一眼就知道能干什么。', status: '已完成', features: '格式化 / 校验', category: 'encoding' },
        { id: 2, number: '02', path: '/tools/base64', name: 'Base64 编解码', description: 'Base64 编码和解码工具，支持文本和图片。', status: '已完成', features: '编码 / 解码', category: 'encoding' },
        { id: 3, number: '03', path: '/tools/qrcode', name: '二维码生成', description: '生成二维码，支持文本和链接。', status: '已完成', features: '生成 / 扫描', category: 'image' },
        { id: 4, number: '04', path: '/tools/timestamp', name: '时间戳转换', description: '时间戳和日期互相转换。', status: '已完成', features: '转换 / 格式化', category: 'time' },
        { id: 5, number: '05', path: '/tools/url', name: 'URL 编解码', description: 'URL 编码和解码工具。', status: '已完成', features: '编码 / 解码', category: 'encoding' },
        { id: 6, number: '06', path: '/tools/hash', name: '哈希计算', description: '计算 MD5、SHA1、SHA256 等哈希值。', status: '已完成', features: 'MD5 / SHA', category: 'text' },
        { id: 7, number: '07', path: '/tools/compress', name: '文本压缩', description: '压缩和解压缩文本。', status: '已完成', features: '压缩 / 解压', category: 'text' },
        { id: 8, number: '08', path: '/tools/password', name: '密码生成', description: '生成强密码。', status: '已完成', features: '生成 / 复制', category: 'text' },
        { id: 9, number: '09', path: '/tools/color', name: '颜色转换', description: '颜色格式转换工具。', status: '已完成', features: 'HEX / RGB', category: 'image' }
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
    executeCommand() {
      const cmd = this.command.toLowerCase()
      if (cmd.includes('json')) {
        this.navigateTo('/tools/json')
      } else if (cmd.includes('base64')) {
        this.navigateTo('/tools/base64')
      } else if (cmd.includes('二维码')) {
        this.navigateTo('/tools/qrcode')
      } else if (cmd.includes('时间戳')) {
        this.navigateTo('/tools/timestamp')
      }
      this.command = ''
    }
  }
}
</script>

<style scoped>
/* 样式已在全局 styles.css 中定义 */
</style>
