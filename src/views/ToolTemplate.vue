<template>
  <div class="tool-template">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🛠️ 工具名称</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 在这里添加你的工具内容 -->
          <label class="input-label">输入：</label>
          <textarea 
            v-model="input" 
            placeholder="输入内容..."
            rows="6"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button class="button primary" @click="process" :disabled="!input.trim()">
              ⚡ 处理
            </button>
            <button class="button danger full-width" @click="clear">
              🗑️ 清空
            </button>
          </div>
          
          <label class="input-label">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="6"
            class="code-input output"
            placeholder="结果将显示在这里..."
          ></textarea>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="success" class="status-success">
            ✅ {{ success }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 工具模板</span>
      <span>纯前端处理 · 数据不会上传</span>
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
  data() {
    return {
      input: '',
      output: '',
      error: '',
      success: ''
    }
  },
  methods: {
    process() {
      // 在这里实现你的工具逻辑
      this.output = this.input
      this.success = '处理成功！'
      setTimeout(() => {
        this.success = ''
      }, 3000)
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.success = ''
    }
  }
}
</script>

<style scoped>
@import '../assets/styles/index.css';

.tool-template {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(18,22,27,0.94);
}

.pane-body {
  padding: 12px;
}

.tool-body {
  margin-top: 1rem;
}

/* === Input Label === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

/* === Input === */
.code-input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  resize: vertical;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.code-input.output {
  background: rgba(157,255,107,0.08);
  border-color: rgba(157,255,107,0.3);
}

/* === Button Group === */
.button-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 1rem 0;
}

.button {
  padding: 10px 16px;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.button:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.button.primary:hover:not(:disabled) {
  background: #9dff6b33;
  box-shadow: 0 0 20px var(--green-glow);
}

.button.danger {
  border-color: var(--red);
  color: var(--red);
}

.button.danger:hover:not(:disabled) {
  background: #ff6b7d1a;
  box-shadow: 0 0 15px #ff6b7d4d;
}

.button.full-width {
  grid-column: 1 / -1;
}

/* === Status Messages === */
.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,.3);
  background: #ff6b7d0d;
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,.3);
  background: var(--green-soft);
}

/* === Responsive === */
@media (max-width: 640px) {
  .tool-template {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
  
  .button-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .button.full-width {
    grid-column: 1 / -1;
  }
}

@media (max-width: 375px) {
  .button-group {
    grid-template-columns: 1fr;
  }
}
</style>
