<template>
  <div class="qr-code-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>📱 二维码生成</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <label class="input-label">输入文本或 URL：</label>
          <textarea 
            v-model="input" 
            placeholder="输入要生成二维码的内容，例如：https://403.li"
            rows="6"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button @click="generate" class="button primary" :disabled="!input.trim()">
              📱 生成
            </button>
            <button @click="download" class="button" :disabled="!qrGenerated">
              💾 下载
            </button>
            <button @click="clear" class="button danger">
              🗑️ 清空
            </button>
          </div>
          
          <div class="output-area" v-show="qrGenerated">
            <div ref="qrContainer" class="qr-wrapper"></div>
          </div>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="success" class="status-success">
            ✅ 二维码生成成功！
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 二维码工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'
import QRCode from 'qrcodejs'

export default {
  name: 'QrCodeTool',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      error: '',
      success: '',
      qrGenerated: false,
      qrCodeInstance: null
    }
  },
  methods: {
    generate() {
      this.error = ''
      this.success = ''
      this.qrGenerated = false
      
      if (!this.input.trim()) {
        this.error = '请输入要生成二维码的内容'
        return
      }
      
      try {
        // 清空容器
        this.$refs.qrContainer.innerHTML = ''
        
        // 生成二维码
        this.qrCodeInstance = new QRCode(this.$refs.qrContainer, {
          text: this.input.trim(),
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: 2  // M 级别 = 2
        })
        
        this.qrGenerated = true
        this.success = '二维码生成成功！'
        
        // 3 秒后清除成功提示
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '生成失败：' + e.message
        this.qrGenerated = false
      }
    },
    download() {
      if (!this.qrGenerated) {
        this.error = '请先生成二维码'
        return
      }
      
      try {
        // 获取二维码图片
        const qrCanvas = this.$refs.qrContainer.querySelector('canvas')
        const qrImg = this.$refs.qrContainer.querySelector('img')
        
        let dataURL
        if (qrCanvas) {
          dataURL = qrCanvas.toDataURL('image/png')
        } else if (qrImg) {
          dataURL = qrImg.src
        } else {
          this.error = '无法获取二维码图片'
          return
        }
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = dataURL
        link.download = 'qrcode-' + Date.now() + '.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.success = '下载已开始！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '下载失败：' + e.message
      }
    },
    clear() {
      this.input = ''
      this.error = ''
      this.success = ''
      this.qrGenerated = false
      this.qrCodeInstance = null
      
      // 清空容器
      if (this.$refs.qrContainer) {
        this.$refs.qrContainer.innerHTML = ''
      }
    }
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.qr-code-tool {
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
  min-height: 150px;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.code-input::placeholder {
  color: var(--dim);
}

.button-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.output-area {
  margin: 1.5rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-wrapper {
  padding: 20px;
  background: rgba(255,255,255,0.95);
  border: 1px solid var(--line);
  border-radius: 4px;
}

.qr-wrapper :deep(canvas),
.qr-wrapper :deep(img) {
  display: block;
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
  font-size: 13px;
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .qr-code-tool {
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
    min-height: 130px;
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
  
  .button:last-child {
    grid-column: 1 / -1;
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
  
  .qr-wrapper {
    padding: 15px;
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .qr-code-tool {
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
