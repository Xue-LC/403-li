<template>
  <div class="json-formatter">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>📦 JSON 格式化</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <label class="input-label">输入 JSON：</label>
          <textarea 
            v-model="input" 
            placeholder='{"name": "test", "value": 123}'
            rows="10"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button class="button primary" @click="format" :disabled="!input.trim()">
              ✨ 格式化
            </button>
            <button class="button" @click="minify" :disabled="!input.trim()">
              📦 压缩
            </button>
            <button class="button" @click="validate" :disabled="!input.trim()">
              ✓ 校验
            </button>
            <button class="button" @click="copyOutput" :disabled="!output.trim()">
              📋 复制
            </button>
            <button class="button danger" @click="clear">
              🗑️ 清空
            </button>
          </div>
          
          <label class="input-label">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="10"
            class="code-input output"
            placeholder="结果将显示在这里..."
          ></textarea>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="valid" class="status-success">
            ✅ JSON 格式正确
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // JSON 工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'JsonFormatter',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      output: '',
      error: '',
      valid: false
    }
  },
  methods: {
    format() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed, null, 2)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    minify() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    validate() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        JSON.parse(this.input)
        this.valid = true
        this.output = this.input
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    copyOutput() {
      if (!this.output.trim()) {
        this.error = '没有可复制的内容'
        return
      }
      
      navigator.clipboard.writeText(this.output).then(() => {
        const originalText = event.target.innerText
        event.target.innerText = '✓ 已复制'
        setTimeout(() => {
          event.target.innerText = originalText
        }, 2000)
      }).catch(() => {
        this.error = '复制失败，请手动复制'
      })
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.valid = false
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.json-formatter {
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
  font-size: 13px; /* 与 styles.css 一致 */
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(18,22,27,0.94); /* 与 Topbar 一致 */
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
  font-size: 13px; /* 输入框标签 13px */
  text-transform: uppercase;
}

.code-input {
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--line);
  background: rgba(18,22,27,0.94); /* 与 Topbar 一致 */
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px; /* 输入框 14px，舒适编辑 */
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
  display: flex;
  gap: 8px;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.button {
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px; /* 按钮 13px */
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  border-radius: 0;
  min-height: 44px;
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
  font-size: 13px; /* 状态提示 13px */
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,0.3);
  background: rgba(255,107,125,0.05);
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px; /* 状态提示 13px */
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,0.3);
  background: var(--green-soft);
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
  font-size: 13px; /* 与 styles.css 一致 */
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .json-formatter {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 12px;
  }
  
  .code-input {
    font-size: 14px; /* 移动端输入框保持 14px */
    padding: 10px;
    min-height: 180px;
  }
  
  .button-group {
    flex-direction: row; /* 移动端水平排列 */
    gap: 6px;
    margin: 0.75rem 0;
    flex-wrap: wrap;
  }
  
  .button {
    flex: 1 1 auto; /* 按钮宽度自适应 */
    min-width: calc(50% - 6px); /* 每行最多 2 个按钮 */
    text-align: center;
    padding: 10px 12px;
    min-height: 44px; /* 触摸目标至少 44px 高度 */
    font-size: 13px; /* 移动端按钮 13px */
  }
  
  .input-label {
    font-size: 12px; /* 移动端输入框标签 12px */
    margin-bottom: 0.4rem;
  }
  
  .status-error, .status-success {
    font-size: 12px; /* 移动端状态提示 12px */
    padding: 8px 10px;
    margin-top: 0.75rem;
  }
  
  .footer {
    padding: 8px 10px;
    font-size: 12px; /* 移动端底栏 12px */
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .json-formatter {
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
    padding: 11px 14px;
    font-size: 12px; /* 超小屏幕按钮 12px */
  }
  
  .footer {
    font-size: 11px; /* 超小屏幕底栏 11px */
  }
}
</style>
