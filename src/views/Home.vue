<template>
  <div class="app">
    <!-- Topbar -->
    <Topbar :toolCount="filteredTools.length" />

    <!-- Search -->
    <div class="command">
      <span class="prompt">user@403:~$</span>
      <input 
        v-model="searchQuery" 
        placeholder="搜索工具，比如：JSON、Base64、二维码、时间戳"
        @keyup.enter="handleSearch"
      />
    </div>

    <!-- 工具列表 -->
    <section class="pane">
      <div class="pane-head">
        <span>工具列表</span>
        <span>{{ filteredTools.length }} / {{ tools.length }}</span>
      </div>
      <div class="pane-body">
        <!-- 分类标签 -->
        <div class="group-tabs">
          <span 
            class="tab" 
            :class="{ active: activeTab === 'all' }" 
            @click="activeTab = 'all'"
          >全部</span>
          <span 
            class="tab" 
            :class="{ active: activeTab === 'encoding' }" 
            @click="activeTab = 'encoding'"
          >编码</span>
          <span 
            class="tab" 
            :class="{ active: activeTab === 'text' }" 
            @click="activeTab = 'text'"
          >文本</span>
          <span 
            class="tab" 
            :class="{ active: activeTab === 'time' }" 
            @click="activeTab = 'time'"
          >时间</span>
          <span 
            class="tab" 
            :class="{ active: activeTab === 'image' }" 
            @click="activeTab = 'image'"
          >图片</span>
        </div>

        <!-- 工具卡片列表 -->
        <div class="tool-list">
          <article 
            class="tool-card" 
            v-for="tool in filteredTools" 
            :key="tool.id"
            @click="navigateTo(tool.path)"
          >
            <div class="tool-top">
              <span class="tool-id">[{{ tool.id.toString().padStart(2, '0') }}]</span>
              <span>{{ tool.path }}</span>
            </div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div class="tool-foot">
              <span class="tag" :style="{ color: tool.statusColor, fontSize: '11px', borderColor: tool.statusColor, backgroundColor: tool.statusColor + '20' }">{{ tool.statusText }}</span>
              <span>{{ tool.features }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 中文终端工具站</span>
      <span>纯前端 · 无追踪 · 开源</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'App',
  components: {
    Topbar
  },
  data() {
    return {
      searchQuery: '',
      activeTab: 'all',
      tools: [
        { 
          id: 1, 
          path: '/tools/json', 
          name: 'JSON 格式化', 
          description: '用于格式化、压缩和校验 JSON 数据',
          status: 'normal',
          statusText: '正常', statusColor: '#9dff6b',
          features: '格式化 / 校验',
          category: 'encoding' 
        },
        { 
          id: 2, 
          path: '/tools/base64', 
          name: 'Base64 编解码', 
          description: '编码解码是高频小工具，适合处理文本和图片',
          status: 'normal',
          statusText: '正常', statusColor: '#9dff6b',
          features: '编码 / 解码',
          category: 'encoding' 
        },
        { 
          id: 3, 
          path: '/tools/qrcode', 
          name: '二维码生成', 
          description: '输入文本或链接，快速生成二维码图片',
          status: 'normal',
          statusText: '正常', statusColor: '#9dff6b',
          features: '生成 / 下载',
          category: 'image' 
        },
        { 
          id: 4, 
          path: '/tools/timestamp', 
          name: '时间戳转换', 
          description: '时间戳和日期格式互相转换，支持 Unix 和 ISO 格式',
          status: 'pending',
          statusText: '待上线', statusColor: '#8a9bb8',
          features: 'Unix / ISO',
          category: 'time' 
        },
        { 
          id: 5, 
          path: '/tools/url', 
          name: 'URL 编解码', 
          description: 'URL 编码和解码，处理特殊字符和中文',
          status: 'normal',
          statusText: '待上线', statusColor: '#8a9bb8',
          features: '编码 / 解码',
          category: 'encoding' 
        },
        { 
          id: 6, 
          path: '/tools/hash', 
          name: '哈希计算', 
          description: '计算 MD5、SHA1、SHA256 等哈希值',
          status: 'normal',
          statusText: '待上线', statusColor: '#8a9bb8',
          features: 'MD5 / SHA',
          category: 'text' 
        },
        { 
          id: 7, 
          path: '/tools/password', 
          name: '密码生成', 
          description: '生成安全随机密码，支持自定义长度和字符集',
          status: 'normal',
          statusText: '待上线', statusColor: '#8a9bb8',
          features: '生成 / 复制',
          category: 'text' 
        },
        { 
          id: 8, 
          path: '/tools/color', 
          name: '颜色转换', 
          description: 'HEX、RGB、HSL 颜色格式互相转换',
          status: 'normal',
          statusText: '正常',
          features: 'HEX / RGB',
          category: 'image' 
        }
      ]
    }
  },
  computed: {
    filteredTools() {
      let result = this.tools
      
      // 按分类筛选
      if (this.activeTab !== 'all') {
        result = result.filter(tool => tool.category === this.activeTab)
      }
      
      // 按搜索词筛选
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(tool => 
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.features.toLowerCase().includes(query)
        )
      }
      
      return result
    }
  },
  methods: {
    navigateTo(path) {
      this.$router.push(path)
    },
    handleSearch() {
      console.log('搜索:', this.searchQuery)
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

/* 状态标签 - 使用 CSS 类管理颜色 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-size: 12px; /* 状态标签 12px */
  font-family: var(--mono);
  border: 1px solid;
  background: rgba(255,255,255,0.05);
}

/* 正常状态 - 绿色 */
.status-badge.normal {
  color: #9dff6b;
  border-color: rgba(157,255,107,0.4);
  background: rgba(157,255,107,0.1);
}

/* 异常状态 - 红色 */
.status-badge.error {
  color: #ff8a8a;
  border-color: rgba(255,107,125,0.4);
  background: rgba(255,107,125,0.1);
}

/* 维护中状态 - 黄色 */
.status-badge.maintenance {
  color: #fff3b3;
  border-color: rgba(255,216,102,0.4);
  background: rgba(255,216,102,0.1);
}

/* 待上线状态 - 灰色 */
.status-badge.pending {
  color: #8a9bb8;
  border-color: rgba(139,148,158,0.4);
  background: rgba(139,148,158,0.1);
}

/* 浅色模式适配 */
@media (prefers-color-scheme: light) {
  .status-badge.normal {
    color: #16a34a;
    border-color: rgba(22,163,74,0.4);
    background: rgba(22,163,74,0.1);
  }
  
  .status-badge.error {
    color: #dc2626;
    border-color: rgba(220,38,38,0.4);
    background: rgba(220,38,38,0.1);
  }
  
  .status-badge.maintenance {
    color: #d97706;
    border-color: rgba(217,119,6,0.4);
    background: rgba(217,119,6,0.1);
  }
  
  .status-badge.pending {
    color: #64748b;
    border-color: rgba(100,116,139,0.4);
    background: rgba(100,116,139,0.1);
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .status-badge {
    padding: 2px 8px;
    font-size: 11px; /* 移动端状态标签 11px */
  }
}
</style>
