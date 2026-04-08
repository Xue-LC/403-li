<template>
  <div class="ascii-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🎨 ASCII 艺术</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 输入文本 -->
          <label class="input-label">输入文本：</label>
          <input 
            type="text" 
            v-model="inputText" 
            placeholder="输入要转换的文本，例如：hello"
            class="text-input"
            maxlength="20"
          />
          <div class="char-count">
            <span>{{ inputText.length }} / 20</span>
          </div>
          
          <!-- 字体选择 -->
          <label class="input-label">选择字体：</label>
          <div class="select-wrapper">
            <select v-model="selectedFont" class="font-select">
              <option v-for="font in fontOptions" :key="font.name" :value="font.name">
                {{ font.label }}
              </option>
            </select>
          </div>
          <div class="font-note">
            <span>💡 提示：{{ currentFontInfo.description }}</span>
          </div>
          
          <!-- 实时生成 -->
          <div class="ascii-output" v-if="asciiArt">
            <pre class="ascii-pre">{{ asciiArt }}</pre>
          </div>
          
          <!-- 操作按钮 -->
          <div class="action-buttons" v-if="asciiArt">
            <button class="button primary" @click="copyToClipboard">
              📋 复制
            </button>
            <button class="button" @click="downloadArt">
              💾 下载
            </button>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <span class="empty-icon">📝</span>
            <p>输入文字，生成 ASCII 艺术</p>
          </div>
          
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
      <span>403.li // ASCII 艺术生成器</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'
import { AVAILABLE_FONTS, generateAsciiArt } from '../../utils/figletHelper.js'

export default {
  name: 'AsciiTool',
  components: {
    Topbar
  },
  data() {
    return {
      inputText: 'HELLO',
      selectedFont: 'Standard',
      asciiArt: '',
      error: '',
      success: '',
      isGenerating: false,
      fontOptions: AVAILABLE_FONTS
    }
  },
  computed: {
    currentFontInfo() {
      return this.fontOptions.find(f => f.name === this.selectedFont) || this.fontOptions[0]
    }
  },
  watch: {
    inputText() {
      this.generateAscii()
    },
    selectedFont() {
      this.generateAscii()
    }
  },
  mounted() {
    this.generateAscii()
  },
  methods: {
    async generateAscii() {
      this.error = ''
      this.success = ''
      
      if (!this.inputText.trim()) {
        this.asciiArt = ''
        return
      }
      
      this.isGenerating = true
      
      try {
        // 使用 figletHelper 从 CDN 加载字体并生成 ASCII 艺术
        const result = await generateAsciiArt(this.inputText, this.selectedFont)
        this.asciiArt = result
      } catch (err) {
        this.error = '生成失败，请尝试其他文本或字体'
        console.error('ASCII error:', err)
        this.asciiArt = ''
      } finally {
        this.isGenerating = false
      }
    },
    copyToClipboard() {
      if (!this.asciiArt) return
      
      navigator.clipboard.writeText(this.asciiArt)
      this.success = '复制成功！'
      setTimeout(() => {
        this.success = ''
      }, 2000)
    },
    downloadArt() {
      if (!this.asciiArt) return
      
      const blob = new Blob([this.asciiArt], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ascii-art-${this.inputText}-${this.selectedFont}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      this.success = '下载成功！'
      setTimeout(() => {
        this.success = ''
      }, 2000)
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';

.ascii-tool {
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

/* === Text Input === */
.text-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}

.text-input::placeholder {
  color: var(--muted);
}

.char-count {
  text-align: right;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  margin-bottom: 0.5rem;
}

/* === Select Wrapper === */
.select-wrapper {
  position: relative;
}

.select-wrapper::after {
  content: '▼';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--green);
  font-size: 10px;
  pointer-events: none;
}

.font-select {
  width: 100%;
  padding: 12px 14px;
  padding-right: 35px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
}

.font-select:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}

.font-select option {
  background: var(--panel-2);
  color: var(--text);
}

.font-note {
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* === ASCII Output === */
.ascii-output {
  position: relative;
  background: var(--panel-2);
  border: 1px solid var(--line);
  padding: 28px;
  margin: 1.5rem 0 1rem;
  border-radius: 0;
  overflow-x: auto;
}

.ascii-pre {
  margin: 0;
  padding: 0;
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.2;
  color: var(--green);
  white-space: pre;
  overflow-x: auto;
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

/* === Empty State === */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  margin: 1.5rem 0;
  border: 1px dashed var(--line);
  background: rgba(255,255,255,0.02);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-state p {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
}

/* === Action Buttons === */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.button {
  padding: 10px 24px;
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
  .ascii-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
  
  .ascii-output {
    padding: 15px 12px;
  }
  
  .ascii-pre {
    font-size: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .ascii-pre {
    font-size: 10px;
  }
}
</style>