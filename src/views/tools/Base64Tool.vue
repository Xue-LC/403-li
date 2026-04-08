<template>
  <div class="base64-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔐 Base64 编解码</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <label class="input-label">输入：</label>
          <textarea 
            v-model="input" 
            placeholder="输入要编码/解码的文本..."
            rows="10"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button class="button primary" @click="encode">
              🔐 编码
            </button>
            <button class="button" @click="decode">
              🔓 解码
            </button>
            <button class="button" @click="copyOutput" :disabled="!output.trim()">
              📋 复制
            </button>
            <button class="button danger full-width" @click="clear">
              🗑️ 清空
            </button>
          </div>
          
          <label class="input-label">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="10"
            class="code-input output"
            placeholder="结果显示在这里..."
          ></textarea>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="success" class="status-success">
            ✅ 成功
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // Base64 工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'Base64Tool',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      output: '',
      error: '',
      success: false
    }
  },
  methods: {
    encode() {
      this.error = ''
      this.success = false
      
      if (!this.input) {
        this.error = '请输入要编码的内容'
        return
      }
      
      try {
        this.output = btoa(unescape(encodeURIComponent(this.input)))
        this.error = ''
        this.success = true
        setTimeout(() => this.success = false, 2000)
      } catch (e) {
        this.error = '编码失败：' + e.message
        this.output = ''
        this.success = false
      }
    },
    decode() {
      this.error = ''
      this.success = false
      
      if (!this.input) {
        this.error = '请输入要解码的 Base64 字符串'
        return
      }
      
      try {
        this.output = decodeURIComponent(escape(atob(this.input)))
        this.error = ''
        this.success = true
        setTimeout(() => this.success = false, 2000)
      } catch (e) {
        this.error = '解码失败：无效的 Base64 字符串'
        this.output = ''
        this.success = false
      }
    },
    copyOutput() {
      if (!this.output.trim()) {
        this.error = '没有可复制的内容'
        return
      }
      
      navigator.clipboard.writeText(this.output).then(() => {
        this.success = true
        setTimeout(() => this.success = false, 2000)
      }).catch(() => {
        this.error = '复制失败，请手动复制'
      })
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.success = false
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';

.base64-tool {
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

.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

.code-input {
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--line);
  background: rgba(18,22,27,0.94);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  transition: all 0.2s;
  border-radius: 0;
  box-sizing: border-box;
  min-height: 200px;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.code-input::placeholder {
  color: var(--dim);
}

.code-input.output {
  background: rgba(157,255,107,0.03);
  border-color: rgba(157,255,107,0.2);
}

.button-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 1rem 0;
}

.button {
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  border-radius: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.button.full-width {
  grid-column: 1 / -1;
}

.button:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 15px var(--green-glow);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.button.primary:hover:not(:disabled) {
  background: rgba(157,255,107,0.2);
  box-shadow: 0 0 20px var(--green-glow);
}

.button.danger {
  border-color: var(--red);
  color: var(--red);
}

.button.danger:hover:not(:disabled) {
  background: rgba(255,107,125,0.1);
  box-shadow: 0 0 15px rgba(255,107,125,0.3);
}

.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,0.3);
  background: rgba(255,107,125,0.05);
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,0.3);
  background: var(--green-soft);
}

/* === Responsive === */
@media (max-width: 640px) {
  .base64-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 12px;
  }
  
  .code-input {
    font-size: 14px;
    padding: 10px;
    min-height: 180px;
  }
  
  .button-group {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 0.75rem 0;
  }
  
  .button {
    height: 48px;
    font-size: 13px;
  }
  
  .input-label {
    font-size: 12px;
    margin-bottom: 0.4rem;
  }
  
  .status-error, .status-success {
    font-size: 12px;
    padding: 8px 10px;
    margin-top: 0.75rem;
  }
  
  .footer {
    padding: 8px 10px;
    font-size: 12px;
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .base64-tool {
    padding: 6px 0 14px;
  }
  
  .pane-body {
    padding: 8px;
  }
  
  .code-input {
    font-size: 14px;
    padding: 8px;
  }
  
  .button {
    height: 48px;
    font-size: 12px;
  }
  
  .footer {
    font-size: 11px;
  }
}
</style>
