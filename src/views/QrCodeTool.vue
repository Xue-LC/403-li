<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- Tool Container -->
    <section class="pane">
      <div class="pane-body">
        <div class="tool-container">
          <div class="tool-content">
            <!-- Input -->
            <div class="input-area">
              <label class="input-label">输入文本或 URL：</label>
              <textarea v-model="input" placeholder="输入要生成二维码的内容..." rows="4"></textarea>
            </div>
            
            <!-- Buttons -->
            <div class="button-group">
              <button @click="generate" class="button primary">📱 生成二维码</button>
              <button @click="download" class="button" :disabled="!qrGenerated">💾 下载图片</button>
              <button @click="clear" class="button danger">🗑️ 清空</button>
            </div>
            
            <!-- QR Code Output -->
            <div class="qr-output">
              <div ref="qrContainer" class="qr-container">
                <div v-if="!qrGenerated" class="qr-placeholder">
                  <p>二维码将显示在这里</p>
                </div>
              </div>
            </div>
            
            <!-- Status Messages -->
            <div v-if="error" class="status-error">❌ {{ error }}</div>
            <div v-if="success" class="status-success">✅ 生成成功！</div>
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
      <span>403.li // 中文工具站</span>
      <span>纯前端 · 无追踪 · 开源</span>
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
      success: false,
      qrGenerated: false,
      qrCode: null
    }
  },
  methods: {
    goBack() {
      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.href = '/'
      }
    },
    generate() {
      if (!this.input.trim()) {
        this.error = '请输入内容'
        return
      }
      
      this.error = ''
      this.success = false
      this.qrGenerated = false
      
      // Clear container
      this.$refs.qrContainer.innerHTML = ''
      
      // Generate QR code
      try {
        this.qrCode = new QRCode(this.$refs.qrContainer, {
          text: this.input,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: 2 // QRCode.CorrectLevel.M = 2
        })
        
        this.qrGenerated = true
        this.success = true
        setTimeout(() => this.success = false, 2000)
      } catch (e) {
        this.error = '生成失败：' + e.message
      }
    },
    download() {
      if (!this.qrGenerated) return
      
      const canvas = this.$refs.qrContainer.querySelector('canvas')
      if (!canvas) {
        // Try to get img tag (qrcodejs might generate img instead of canvas)
        const img = this.$refs.qrContainer.querySelector('img')
        if (img && img.src) {
          const link = document.createElement('a')
          link.download = 'qrcode-' + Date.now() + '.png'
          link.href = img.src
          link.click()
        }
        return
      }
      
      const link = document.createElement('a')
      link.download = 'qrcode-' + Date.now() + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    },
    clear() {
      this.input = ''
      this.error = ''
      this.success = false
      this.qrGenerated = false
      this.$refs.qrContainer.innerHTML = ''
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
  height: auto;
  min-height: 400px;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  overscroll-behavior: none;
  contain: layout style paint;
}

/* === Tool Content === */
.tool-content {
  width: 100%;
  padding: 2rem;
}

/* === Input Area === */
.input-area {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

textarea {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  min-height: 100px;
}

textarea:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === Button Group === */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 1rem 0;
}

.button {
  padding: 12px 20px;
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

/* === QR Output === */
.qr-output {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  margin-top: 1rem;
  min-height: 280px;
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-placeholder {
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 14px;
}

.qr-container canvas,
.qr-container img {
  max-width: 100%;
  height: auto;
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
  
  .tool-content {
    padding: 1rem;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .qr-output {
    padding: 1rem;
    min-height: 250px;
  }
}

@media (max-width: 375px) {
  .qr-output {
    min-height: 220px;
  }
}
</style>
