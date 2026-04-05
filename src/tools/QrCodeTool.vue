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
          
          <div class="color-picker-group">
            <div class="color-picker">
              <label class="input-label">前景色：</label>
              <div class="color-preview" :style="{ backgroundColor: fgColor }" @click="togglePicker('fg')"></div>
              <input 
                type="text" 
                v-model="fgColor" 
                @change="validateColor"
                class="color-input"
                placeholder="#9dff6b"
              />
              <div v-if="showFgPicker" class="color-picker-panel" @click.stop>
                <div class="preset-colors">
                  <div 
                    v-for="color in presetColors" 
                    :key="color"
                    class="preset-color"
                    :style="{ backgroundColor: color }"
                    @click="selectColor('fg', color)"
                  ></div>
                </div>
              </div>
            </div>
            <div class="color-picker">
              <label class="input-label">背景色：</label>
              <div class="color-preview" :style="{ backgroundColor: bgColor }" @click="togglePicker('bg')"></div>
              <input 
                type="text" 
                v-model="bgColor" 
                @change="validateColor"
                class="color-input"
                placeholder="#0d1117"
              />
              <div v-if="showBgPicker" class="color-picker-panel" @click.stop>
                <div class="preset-colors">
                  <div 
                    v-for="color in presetColors" 
                    :key="color"
                    class="preset-color"
                    :style="{ backgroundColor: color }"
                    @click="selectColor('bg', color)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="style-selector">
            <label class="input-label">二维码样式：</label>
            <div class="style-buttons">
              <button 
                class="style-btn" 
                :class="{ active: qrStyle === 'square' }"
                @click="qrStyle = 'square'"
              >
                ⬜ 点阵
              </button>
              <button 
                class="style-btn" 
                :class="{ active: qrStyle === 'dots' }"
                @click="qrStyle = 'dots'"
              >
                ⚫ 圆点
              </button>
              <button 
                class="style-btn" 
                :class="{ active: qrStyle === 'rounded' }"
                @click="qrStyle = 'rounded'"
              >
                🔲 圆角
              </button>
            </div>
          </div>
          
          <div class="button-group">
            <button class="button primary" @click="generate" :disabled="!input.trim()">
              📱 生成二维码
            </button>
            <button class="button" @click="download" :disabled="!qrGenerated">
              💾 下载图片
            </button>
            <button class="button danger full-width" @click="clear">
              🗑️ 清空
            </button>
          </div>
          
          <div class="qr-output">
            <canvas ref="qrCanvas" v-show="qrGenerated"></canvas>
            <div v-if="!qrGenerated" class="qr-placeholder">
              <p>二维码将显示在这里</p>
            </div>
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
      <span>403.li // 二维码工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'
import QRCode from 'qrcode-generator'

export default {
  name: 'QrCodeTool',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      fgColor: '#9dff6b',
      bgColor: '#0d1117',
      qrStyle: 'square',
      error: '',
      success: '',
      qrGenerated: false,
      showFgPicker: false,
      showBgPicker: false,
      presetColors: [
        '#9dff6b', '#0d1117', '#ffffff', '#ff8a8a',
        '#ffd866', '#00f0ff', '#8a9bb8', '#c9d1d9'
      ]
    }
  },
  methods: {
    togglePicker(type) {
      if (type === 'fg') {
        this.showFgPicker = !this.showFgPicker
        this.showBgPicker = false
      } else {
        this.showBgPicker = !this.showBgPicker
        this.showFgPicker = false
      }
    },
    selectColor(type, color) {
      if (type === 'fg') {
        this.fgColor = color
        this.showFgPicker = false
      } else {
        this.bgColor = color
        this.showBgPicker = false
      }
    },
    validateColor() {
      // 简单的 HEX 颜色验证
      const hex = this.fgColor
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        this.fgColor = '#9dff6b'
      }
    },
    drawSmartRoundedRect(ctx, x, y, width, height, radius, corners) {
      ctx.beginPath()
      
      const topLeft = corners.topLeft ? radius : 0
      const topRight = corners.topRight ? radius : 0
      const bottomRight = corners.bottomRight ? radius : 0
      const bottomLeft = corners.bottomLeft ? radius : 0
      
      ctx.moveTo(x + topLeft, y)
      ctx.lineTo(x + width - topRight, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + topRight)
      ctx.lineTo(x + width, y + height - bottomRight)
      ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height)
      ctx.lineTo(x + bottomLeft, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft)
      ctx.lineTo(x, y + topLeft)
      ctx.quadraticCurveTo(x, y, x + topLeft, y)
      ctx.closePath()
      ctx.fill()
    },
    async generate() {
      this.error = ''
      this.success = ''
      this.qrGenerated = false
      this.showFgPicker = false
      this.showBgPicker = false
      
      if (!this.input.trim()) {
        this.error = '请输入要生成二维码的内容'
        return
      }
      
      try {
        const qr = QRCode(0, 'M')
        qr.addData(this.input.trim())
        qr.make()
        
        const pixelRatio = 4
        const displaySize = 400
        const size = displaySize * pixelRatio
        const moduleCount = qr.modules.length
        const margin = 2
        const totalModules = moduleCount + margin * 2
        const moduleSize = Math.floor(size / totalModules)
        const qrSize = moduleCount * moduleSize
        const offset = Math.round((size - qrSize) / 2)
        
        const canvas = this.$refs.qrCanvas
        const ctx = canvas.getContext('2d')
        
        canvas.width = size
        canvas.height = size
        canvas.style.width = displaySize + 'px'
        canvas.style.height = displaySize + 'px'
        canvas.style.maxWidth = '100%'
        canvas.style.height = 'auto'
        
        ctx.fillStyle = this.bgColor
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = this.fgColor
        
        let squareCount = 0, dotsCount = 0, roundedCount = 0
        
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              const x = Math.round(offset + col * moduleSize)
              const y = Math.round(offset + row * moduleSize)
              
              if (this.qrStyle === 'square') {
                const size = Math.round(moduleSize)
                ctx.fillRect(x, y, size, size)
                squareCount++
              } else if (this.qrStyle === 'dots') {
                const radius = Math.round(moduleSize * 0.48)
                ctx.beginPath()
                ctx.arc(
                  Math.round(x + moduleSize / 2),
                  Math.round(y + moduleSize / 2),
                  radius,
                  0,
                  Math.PI * 2
                )
                ctx.fill()
                dotsCount++
              } else if (this.qrStyle === 'rounded') {
                const hasTop = row > 0 && qr.isDark(row - 1, col)
                const hasBottom = row < moduleCount - 1 && qr.isDark(row + 1, col)
                const hasLeft = col > 0 && qr.isDark(row, col - 1)
                const hasRight = col < moduleCount - 1 && qr.isDark(row, col + 1)
                
                if (hasTop && hasBottom && hasLeft && hasRight) {
                  ctx.fillRect(x, y, Math.round(moduleSize), Math.round(moduleSize))
                } else {
                  const radius = Math.round(moduleSize * 0.3)
                  this.drawSmartRoundedRect(ctx, x, y, Math.round(moduleSize), Math.round(moduleSize), radius, {
                    topLeft: !hasTop && !hasLeft,
                    topRight: !hasTop && !hasRight,
                    bottomRight: !hasBottom && !hasRight,
                    bottomLeft: !hasBottom && !hasLeft
                  })
                  roundedCount++
                }
              }
            }
          }
        }
        
        console.log('[QrCode] Drawn:', { square: squareCount, dots: dotsCount, rounded: roundedCount })
        
        this.qrGenerated = true
        this.success = '二维码生成成功！'
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
        const canvas = this.$refs.qrCanvas
        const link = document.createElement('a')
        link.download = 'qrcode-' + Date.now() + '.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
        
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
      this.showFgPicker = false
      this.showBgPicker = false
      
      const canvas = this.$refs.qrCanvas
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  },
  mounted() {
    document.addEventListener('click', () => {
      this.showFgPicker = false
      this.showBgPicker = false
    })
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

.color-picker-group {
  display: flex;
  gap: 20px;
  margin: 1rem 0;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.color-preview {
  width: 50px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-preview:hover {
  transform: scale(1.05);
  border-color: var(--green);
}

.color-input {
  width: 100px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 8px;
}

.color-input:focus {
  outline: 0;
  border-color: var(--green);
}

.color-picker-panel {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 12px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  margin-top: 8px;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.preset-color {
  width: 100%;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.preset-color:hover {
  transform: scale(1.1);
  border-color: var(--green);
}

.style-selector {
  margin: 1rem 0;
}

.style-buttons {
  display: flex;
  gap: 10px;
  margin-top: 0.5rem;
}

.style-btn {
  flex: 1;
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

.style-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.style-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 20px var(--green-glow);
}

.button-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.qr-output {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  margin-top: 1rem;
  min-height: 420px;
  position: relative;
  overflow: hidden;
}

.qr-output canvas {
  max-width: 100%;
  width: auto;
  height: auto;
  image-rendering: auto;
}

.qr-placeholder {
  position: absolute;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 14px;
}

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

@media (max-width: 640px) {
  .qr-code-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
  }
  
  .color-picker-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .style-buttons {
    flex-direction: column;
  }
  
  .button-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .button.full-width {
    grid-column: 1 / -1;
  }
  
  .qr-output {
    padding: 1rem;
    min-height: 280px;
  }
}

@media (max-width: 375px) {
  .button-group {
    grid-template-columns: 1fr;
  }
  
  .qr-output {
    min-height: 250px;
  }
}
</style>
