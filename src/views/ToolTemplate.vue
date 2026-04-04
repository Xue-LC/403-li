<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- Tool Container -->
    <section class="pane">
      <div class="pane-body">
        <!-- Game/Tool Container -->
        <div class="tool-container" ref="toolContainer">
          <div class="tool-content">
            <!-- 在这里添加你的工具内容 -->
            <div class="placeholder">
              <h2>🛠️ 工具名称</h2>
              <p>工具描述文字</p>
            </div>
          </div>
          
          <!-- Bottom Info -->
          <div class="bottom-info">
            <p class="error-text">页面不存在</p>
            <button @click="goBack" class="back-btn">← 返回上页</button>
          </div>
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
  name: 'ToolTemplate',
  components: {
    Topbar
  },
  methods: {
    goBack() {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

/* === Pane === */
.pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.pane-body {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  position: relative;
}

/* === Tool Container === */
.tool-container {
  width: 100%;
  height: 400px;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  /* Chrome 优化 */
  overscroll-behavior: none;
  contain: layout style paint;
}

/* === Tool Content === */
.tool-content {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === Placeholder === */
.placeholder {
  text-align: center;
  color: var(--text-dim);
}

.placeholder h2 {
  font-family: var(--mono);
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 1rem;
}

.placeholder p {
  font-family: var(--mono);
  font-size: 0.875rem;
  margin: 0;
}

/* === Bottom Info === */
.bottom-info {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-text {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-dim);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.back-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 13px;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.2s;
  cursor: pointer;
}

.back-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

/* === Responsive === */
@media (max-width: 640px) {
  .pane-body {
    padding: 1rem;
  }
  
  .tool-container {
    height: 300px;
  }
}

@media (max-width: 375px) {
  .tool-container {
    height: 250px;
  }
}
</style>
