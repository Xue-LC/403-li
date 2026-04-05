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
              <input type="color" v-model="fgColor">
              <span class="color-value">{{ fgColor }}</span>
            </div>
            <div class="color-picker">
              <label class="input-label">背景色：</label>
              <input type="color" v-model="bgColor">
              <span class="color-value">{{ bgColor }}</span>
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
import { qrcode } from 'qrcode-generator'

export default {
  name: 'QrCodeTool',
  components: {
    Topbar
  },
  data() {
    return {
      input: '',
      fgColor: '#9dff6b',  // 网站绿色
      bgColor: '#0d1117',  // 网站黑色
      qrStyle: 'square',   // square, dots, rounded
      error: '',
      success: '',
      qrGenerated: false
    }
  },
  methods: {
    // 绘制智能圆角矩形 - 只有指定的角才圆角
    drawSmartRoundedRect(ctx, x, y, w, h, r, corners) {
      ctx.beginPath()
      
      // 从左上角开始
      if (corners.topLeft) {
        ctx.moveTo(x + r, y)
      } else {
        ctx.moveTo(x, y)
      }
      
      // 上边
      if (corners.topRight) {
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      } else {
        ctx.lineTo(x + w, y)
      }
      
      // 右边
      if (corners.bottomRight) {
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      } else {
        ctx.lineTo(x + w, y + h)
      }
      
      // 下边
      if (corners.bottomLeft) {
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      } else {
        ctx.lineTo(x, y + h)
      }
      
      // 左边
      if (corners.topLeft) {
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
      } else {
        ctx.lineTo(x, y)
      }
      
      ctx.closePath()
      ctx.fill()
    },
    async generate() {
      this.error = ''
      this.success = ''
      this.qrGenerated = false
      
      if (!this.input.trim()) {
        this.error = '请输入要生成二维码的内容'
        return
      }
      
      try {
        console.log('[QrCode] generate() called, qrStyle:', this.qrStyle)
        const canvas = this.$refs.qrCanvas
        const ctx = canvas.getContext('2d')
        
        // 使用固定高分辨率，确保清晰
        const size = 400  // 固定 400x400，足够清晰
        
        // 设置 Canvas 尺寸
        canvas.width = size
        canvas.height = size
        
        // CSS 样式让浏览器自适应缩放
        canvas.style.width = ''
        canvas.style.height = ''
        canvas.style.maxWidth = '100%'
        canvas.style.height = 'auto'
        
        // 填充背景
        ctx.fillStyle = this.bgColor
        ctx.fillRect(0, 0, size, size)
        
        // 生成二维码数据
        const qr = qrcode(0, 'M') // 0=自动版本，M=纠错级别
        qr.addData(this.input.trim())
        qr.make()
        
        const moduleCount = qr.getModuleCount()
        const margin = 2 // 边距模块数
        const totalModules = moduleCount + margin * 2
        const moduleSize = Math.floor(size / totalModules)  // 取整，避免小数
        
        // 设置前景色
        ctx.fillStyle = this.fgColor
        
        console.log('[QrCode] moduleCount:', moduleCount, 'moduleSize:', moduleSize, 'qrStyle:', this.qrStyle, 'size:', size)
        
        // 根据样式绘制二维码模块
        let squareCount = 0, dotsCount = 0, roundedCount = 0
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              if (this.qrStyle === 'square') {
                // 方形：使用整数尺寸，确保无缝
                const x = Math.floor((col + margin) * moduleSize)
                const y = Math.floor((row + margin) * moduleSize)
                const w = Math.ceil(moduleSize)  // 向上取整，确保覆盖
                const h = Math.ceil(moduleSize)
                ctx.fillRect(x, y, w, h)
                squareCount++
              } else if (this.qrStyle === 'dots') {
                // 圆点：稍微缩小一点，避免边缘锯齿
                const centerX = (col + margin) * moduleSize + moduleSize / 2
                const centerY = (row + margin) * moduleSize + moduleSize / 2
                const radius = (moduleSize / 2) * 0.85  // 85% 而不是 90%
                ctx.beginPath()
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                ctx.fill()
                dotsCount++
              } else if (this.qrStyle === 'rounded') {
                // 智能圆角：检查上下左右是否有相邻模块
                const hasTop = row > 0 && qr.isDark(row - 1, col)
                const hasBottom = row < moduleCount - 1 && qr.isDark(row + 1, col)
                const hasLeft = col > 0 && qr.isDark(row, col - 1)
                const hasRight = col < moduleCount - 1 && qr.isDark(row, col + 1)
                
                const x = (col + margin) * moduleSize
                const y = (row + margin) * moduleSize
                const borderRadius = moduleSize * 0.3
                
                // 如果四个方向都有模块，绘制完整矩形（无缝）
                if (hasTop && hasBottom && hasLeft && hasRight) {
                  ctx.fillRect(x, y, moduleSize, moduleSize)
                } else {
                  // 否则绘制智能圆角矩形
                  // 只有没有相邻的方向才需要圆角
                  const roundTL = !hasTop && !hasLeft  // 左上角
                  const roundTR = !hasTop && !hasRight // 右上角
                  const roundBR = !hasBottom && !hasRight // 右下角
                  const roundBL = !hasBottom && !hasLeft // 左下角
                  
                  this.drawSmartRoundedRect(ctx, x, y, moduleSize, moduleSize, borderRadius, {
                    topLeft: roundTL,
                    topRight: roundTR,
                    bottomRight: roundBR,
                    bottomLeft: roundBL
                  })
                }
                roundedCount++
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
      
      const canvas = this.$refs.qrCanvas
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
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

/* === Color Picker Group === */
.color-picker-group {
  display: flex;
  gap: 20px;
  margin: 1rem 0;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker input[type="color"] {
  width: 50px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  background: var(--panel-2);
}

.color-value {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-dim);
}

/* === Style Selector === */
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
  border-radius: 4px;
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

/* === Button Group === */
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

/* === QR Output === */
.qr-output {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  margin-top: 1rem;
  min-height: 320px;
  position: relative;
}

.qr-output canvas {
  max-width: 100%;
  width: auto;
  height: auto;
  /* 移除 image-rendering，让浏览器默认处理 */
}

.qr-placeholder {
  position: absolute;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 14px;
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
