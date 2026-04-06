<template>
  <div class="url-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔗 URL 编解码</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 统一输入框 -->
          <label class="input-label">输入：</label>
          <textarea 
            v-model="input" 
            placeholder="输入文本或 URL 编码字符串"
            rows="4"
            class="code-input"
          ></textarea>
          <!-- 操作按钮 -->
          <div class="button-row">
            <button class="button" @click="encodeUrl" :disabled="!input.trim()">🔄 编码</button>
            <button class="button" @click="decodeUrl" :disabled="!input.trim()">🔄 解码</button>
            <button class="button danger" @click="clearAll">🗑️ 清空</button>
          </div>
          
          <div class="result-display" v-if="result">
            {{ result }}
            <button class="copy-btn" @click="copyResult" title="复制结果">📋</button>
          </div>
          
          <div v-if="error" class="status-error">❌ {{ error }}</div>
          
          <div v-if="success" class="status-success">✅ {{ success }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // URL 编解码工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'UrlTool',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      result: '',
      error: '',
      success: '',
      copySuccess: ''
    }
  },
  methods: {
    encodeUrl() {
      this.error = ''
      this.success = ''
      
      if (!this.input.trim()) {
        this.error = '请输入要编码的内容'
        return
      }
      try {
        this.result = encodeURIComponent(this.input.trim())
        this.success = '编码成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '编码失败：' + e.message
      }
    },
    decodeUrl() {
      this.error = ''
      this.success = ''
      
      if (!this.input.trim()) {
        this.error = '请输入要解码的内容'
        return
      }
      try {
        this.result = decodeURIComponent(this.input.trim())
        this.success = '解码成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '解码失败：无效的 URL 编码格式'
      }
    },
    copyResult() {
      navigator.clipboard.writeText(this.result)
      this.copySuccess = '复制成功！'
      setTimeout(() => {
        this.copySuccess = ''
      }, 2000)
    },
    clearAll() {
      this.input = ''
      this.result = ''
      this.error = ''
      this.success = ''
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';

.url-tool {
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

/* === Button Row === */
.button-row {
  display: flex;
  gap: 12px;
  margin: 1rem 0;
}

/* === Result Display === */
.result-display {
  position: relative;
  background: var(--green-soft);
  border: 1px solid var(--green);
  padding: 12px 14px;
  margin: 1rem 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  word-break: break-all;
  border-radius: 0;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: var(--text);
}

.copy-success {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  margin: 8px 0;
  padding: 4px 8px;
  background: var(--green-soft);
  border: 1px solid var(--green);
  border-radius: 0;
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
  .url-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
  
  .button-row {
    flex-direction: column;
  }
}

@media (max-width: 375px) {
  .button-row {
    flex-direction: column;
  }
}
</style>
