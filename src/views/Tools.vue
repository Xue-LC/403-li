<template>
  <div class="tools">
    <!-- Topbar -->
    <Topbar :toolCount="tools.length" />

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
  name: 'Tools',
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
          status: 'error',
          statusText: '异常', statusColor: '#ff8a8a',
          features: '编码 / 解码',
          category: 'encoding' 
        },
        { 
          id: 3, 
          path: '/tools/qrcode', 
          name: '二维码生成', 
          description: '输入文本或链接，快速生成二维码图片',
          status: 'maintenance',
          statusText: '维护中', statusColor: '#fff3b3',
          features: '生成 / 导出',
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

.tools {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00)), var(--panel);
  box-shadow: var(--shadow);
  position: relative;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--green), var(--cyan), var(--green));
  opacity: 0.4;
}

.pane-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(255,255,255,0.02);
}

.pane-body {
  padding: 12px;
}

/* === Group Tabs === */
.group-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tab {
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--muted);
  padding: 7px 10px;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.tab:hover {
  color: var(--text);
  border-color: var(--line);
}

.tab.active {
  color: var(--text);
  border-color: rgba(157,255,107,0.4);
  background: var(--green-soft);
  box-shadow: 0 0 15px var(--green-glow), inset 0 0 10px var(--green-glow);
}

/* === Tool List === */
.tool-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.tool-card {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  max-width: 100%;
  min-height: 44px; /* 触摸目标最小高度 */
}

.tool-card::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1px;
  background: linear-gradient(135deg, var(--green), transparent, var(--cyan));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.tool-card:hover {
  border-color: transparent;
  background: rgba(157,255,107,0.03);
  box-shadow: 0 0 30px var(--green-glow);
  transform: translateY(-2px);
}

.tool-card:hover::before {
  opacity: 0.5;
}

.tool-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
  text-transform: uppercase;
}

.tool-id { 
  color: var(--green); 
  font-weight: 600;
  text-shadow: 0 0 10px var(--green-glow);
}

.tool-card h3 {
  margin: 0 0 6px;
  font-size: 18px;
  line-height: 1.35;
  color: var(--text);
}

.tool-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  font-size: 15px;
}

.tool-foot {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
  text-transform: uppercase;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid;
  font-size: 11px;
}

/* === Footer === */
.footer {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .tools {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .command {
    padding: 8px 10px;
  }
  
  .prompt {
    font-size: 11px;
  }
  
  .command input {
    font-size: 11px;
  }
  
  .group-tabs {
    gap: 6px;
    margin-bottom: 10px;
  }
  
  .tab {
    padding: 10px 12px; /* 触摸目标至少 44px 高度 */
    font-size: 11px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }
  
  .tool-list {
    grid-template-columns: 1fr; /* 移动端单列 */
    gap: 8px;
  }
  
  .tool-card {
    padding: 12px; /* 移动端 padding */
    min-height: auto;
  }
  
  .tool-card h3 {
    font-size: 16px; /* 移动端标题 16px */
  }
  
  .tool-card p {
    font-size: 14px; /* 移动端描述 14px */
  }
  
  .tool-top, .tool-foot {
    font-size: 11px; /* 移动端标签 11px */
  }
  
  .pane-body {
    padding: 12px;
  }
  
  .footer {
    padding: 8px 10px;
    font-size: 11px;
  }
  
  .tab {
    font-size: 10px;
  }
}

/* 超小屏幕 (iPhone SE 等) */
@media (max-width: 375px) {
  .tools {
    padding: 6px 0 14px;
  }
  
  .tool-card h3 {
    font-size: 16px;
  }
  
  .tool-card p {
    font-size: 14px;
  }
  
  .tab {
    font-size: 10px;
    padding: 10px 10px;
  }
}

/* 命令行搜索框 */
.command {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-family: var(--mono);
}

.prompt {
  color: var(--green);
  font-size: 12px;
  white-space: nowrap;
  font-weight: 600;
}

.command input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
}

.command input::placeholder { color: var(--dim); }
</style>
