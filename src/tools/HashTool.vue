<template>
  <div class="hash-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔐 哈希计算</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 输入 -->
          <label class="input-label">输入文本：</label>
          <textarea 
            v-model="inputText" 
            placeholder="输入要计算哈希的文本"
            rows="4"
            class="code-input"
          ></textarea>
          
          <!-- 计算按钮 -->
          <button class="button primary full-width" @click="calculateHash">
            🔐 计算哈希
          </button>
          
          <!-- 结果显示 -->
          <div class="hash-results" v-if="hashResults.length">
            <div v-for="item in hashResults" :key="item.algo" class="hash-item">
              <span class="hash-algo">{{ item.algo }}</span>
              <div class="hash-value-wrapper">
                <code class="hash-value">{{ item.hash }}</code>
                <button class="copy-btn" @click="copyHash(item.hash)" title="复制">📋</button>
              </div>
            </div>
          </div>
          
          <div v-if="error" class="status-error">❌ {{ error }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 哈希计算工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'
import { MD5, SHA1, SHA256, SHA512 } from 'crypto-js'

export default {
  name: 'HashTool',
  components: {
    Topbar
  },
  data() {
    return {
      inputText: '',
      hashResults: [],
      error: '',
      success: ''
    }
  },
  methods: {
    calculateHash() {
      this.error = ''
      this.success = ''
      
      if (!this.inputText.trim()) {
        this.error = '请输入要计算的文本'
        return
      }
      
      try {
        this.hashResults = [
          { algo: 'MD5', hash: MD5(this.inputText).toString() },
          { algo: 'SHA1', hash: SHA1(this.inputText).toString() },
          { algo: 'SHA256', hash: SHA256(this.inputText).toString() },
          { algo: 'SHA512', hash: SHA512(this.inputText).toString() }
        ]
        this.success = '计算成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '计算失败：' + e.message
      }
    },
    copyHash(hash) {
      navigator.clipboard.writeText(hash)
      this.success = '已复制到剪贴板！'
      setTimeout(() => {
        this.success = ''
      }, 2000)
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.hash-tool {
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
  margin-top: 1.5rem;
}

/* === Input Label === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.75rem;
  margin-top: 1rem;
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
  border-radius: 0;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === Button === */
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
  border-radius: 0;
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

.button.full-width {
  width: 100%;
  margin-top: 1rem;
}

/* === Hash Results === */
.hash-results {
  margin-top: 1rem;
}

.hash-item {
  margin: 1rem 0;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
}

.hash-algo {
  display: block;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.hash-value-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hash-value {
  flex: 1;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  background: rgba(255,255,255,0.02);
  padding: 8px;
  border: 1px solid var(--line);
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn:hover {
  color: var(--text);
  transform: scale(1.1);
}

/* === Status Messages === */
.status-error {
  color: var(--red);
  margin-top: 1.25rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(255,107,125,.3);
  background: #ff6b7d0d;
  border-radius: 0;
}

.status-success {
  color: var(--green);
  margin-top: 1.25rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(157,255,107,.3);
  background: var(--green-soft);
  border-radius: 0;
}

/* === Responsive === */
@media (max-width: 640px) {
  .hash-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
}

@media (max-width: 375px) {
  .hash-value {
    font-size: 11px;
  }
}
</style>
