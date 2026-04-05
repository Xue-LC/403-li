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
              <div class="color-preview-wrapper">
                <div class="color-preview" :style="{ backgroundColor: fgColor }" @click.stop="togglePicker('fg')"></div>
                <div v-if="showFgPicker" class="color-picker-panel" @click.stop>
                  <!-- 饱和度/亮度区域 -->
                  <div class="sl-gradient" @click="selectSaturationLightness">
                    <div class="sl-thumb" :style="{ left: slThumbX + '%', top: slThumbY + '%' }"></div>
                  </div>
                  <!-- 色相滑块 -->
                  <div class="hue-slider" @click="selectHue">
                    <div class="hue-thumb" :style="{ left: hueThumbX + '%' }"></div>
                  </div>
                  <!-- HEX 输入 -->
                  <div class="hex-input-wrapper">
                    <input 
                      type="text" 
                      v-model="fgColor" 
                      @change="validateColor"
                      class="hex-input"
                      placeholder="#9dff6b"
                    />
                  </div>
                  <!-- 预设颜色 -->
                  <div class="preset-colors">
                    <div 
                      v-for="color in fgPresetColors" 
                      :key="color"
                      class="preset-color"
                      :style="{ backgroundColor: color }"
                      @click="selectColor('fg', color)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="color-picker">
              <label class="input-label">背景色：</label>
              <div class="color-preview-wrapper">
                <div class="color-preview" :style="{ backgroundColor: bgColor }" @click.stop="togglePicker('bg')"></div>
                <div v-if="showBgPicker" class="color-picker-panel" @click.stop>
                  <!-- 饱和度/亮度区域 -->
                  <div class="sl-gradient" @click="selectSaturationLightnessBg">
                    <div class="sl-thumb" :style="{ left: slThumbXBg + '%', top: slThumbYBg + '%' }"></div>
                  </div>
                  <!-- 色相滑块 -->
                  <div class="hue-slider" @click="selectHueBg">
                    <div class="hue-thumb" :style="{ left: hueThumbXBg + '%' }"></div>
                  </div>
                  <!-- HEX 输入 -->
                  <div class="hex-input-wrapper">
                    <input 
                      type="text" 
                      v-model="bgColor" 
                      @change="validateColorBg"
                      class="hex-input"
                      placeholder="#0d1117"
                    />
                  </div>
                  <!-- 预设颜色（包含渐变） -->
                  <div class="preset-colors bg-presets">
                    <div 
                      v-for="(color, index) in bgPresetColors" 
                      :key="index"
                      class="preset-color bg-preset"
                      :style="{ background: bgGradients[index] ? `linear-gradient(135deg, ${bgGradients[index][0]}, ${bgGradients[index][1]})` : color }"
                      @click="selectBgColor(index)"
                    ></div>
                  </div>
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
      // 前景色预设（常用颜色）
      fgPresetColors: [
        '#9dff6b',  // 网站绿色（默认）
        '#000000',  // 黑色
        '#ffffff',  // 白色
        '#ff6b6b',  // 红色
        '#ffd93d',  // 黄色
        '#4d96ff',  // 蓝色
        '#6bcb77',  // 绿色
        '#c0c0c0'   // 银色
      ],
      // 背景色预设（纯色）
      bgPresetColors: [
        '#0d1117',  // 黑色（默认）
        '#ffffff',  // 白色
        '#667eea',  // 蓝紫
        '#f093fb',  // 粉紫
        '#4facfe',  // 蓝青
        '#43e97b',  // 绿青
        '#fa709a',  // 粉黄
        '#a8edea'   // 青粉
      ],
      // 背景渐变预设（用于 Canvas 绘制）
      bgGradients: [
        null,  // 黑色（纯色）
        null,  // 白色（纯色）
        ['#667eea', '#764ba2'],  // 蓝紫渐变
        ['#f093fb', '#f5576c'],  // 粉紫渐变
        ['#4facfe', '#00f2fe'],  // 蓝青渐变
        ['#43e97b', '#38f9d7'],  // 绿青渐变
        ['#fa709a', '#fee140'],  // 粉黄渐变
        ['#a8edea', '#fed6e3']   // 青粉渐变
      ],
      bgGradientIndex: -1,  // 当前选择的渐变索引，-1 表示纯色,
      // 前景色 HSL
      fgHue: 120,
      fgSaturation: 100,
      fgLightness: 50,
      slThumbX: 100,
      slThumbY: 0,
      hueThumbX: 33,
      // 背景色 HSL
      bgHue: 210,
      bgSaturation: 20,
      bgLightness: 7,
      slThumbXBg: 20,
      slThumbYBg: 86,
      hueThumbXBg: 70
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
        const hsl = this.hexToHsl(color)
        this.fgHue = hsl.h
        this.fgSaturation = hsl.s
        this.fgLightness = hsl.l
        this.updateSlThumb('fg')
        this.updateHueThumb('fg')
      } else {
        this.bgColor = color
        this.showBgPicker = false
        const hsl = this.hexToHsl(color)
        this.bgHue = hsl.h
        this.bgSaturation = hsl.s
        this.bgLightness = hsl.l
        this.updateSlThumb('bg')
        this.updateHueThumb('bg')
      }
    },
    selectBgColor(index) {
      this.bgGradientIndex = index
      const color = this.bgPresetColors[index]
      const gradient = this.bgGradients[index]
      
      if (gradient) {
        // 使用渐变的第一个颜色作为 bgColor（用于滑块等）
        this.bgColor = gradient[0]
      } else {
        this.bgColor = color
      }
      
      this.showBgPicker = false
      const hsl = this.hexToHsl(this.bgColor)
      this.bgHue = hsl.h
      this.bgSaturation = hsl.s
      this.bgLightness = hsl.l
      this.updateSlThumb('bg')
      this.updateHueThumb('bg')
    },
    validateColor() {
      if (!/^#[0-9A-Fa-f]{6}$/.test(this.fgColor)) {
        this.fgColor = this.hslToHex(this.fgHue, this.fgSaturation, this.fgLightness)
      } else {
        const hsl = this.hexToHsl(this.fgColor)
        this.fgHue = hsl.h
        this.fgSaturation = hsl.s
        this.fgLightness = hsl.l
        this.updateSlThumb('fg')
        this.updateHueThumb('fg')
      }
    },
    validateColorBg() {
      if (!/^#[0-9A-Fa-f]{6}$/.test(this.bgColor)) {
        this.bgColor = this.hslToHex(this.bgHue, this.bgSaturation, this.bgLightness)
      } else {
        const hsl = this.hexToHsl(this.bgColor)
        this.bgHue = hsl.h
        this.bgSaturation = hsl.s
        this.bgLightness = hsl.l
        this.updateSlThumb('bg')
        this.updateHueThumb('bg')
      }
    },
    selectSaturationLightness(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      this.slThumbX = Math.max(0, Math.min(100, x))
      this.slThumbY = Math.max(0, Math.min(100, y))
      this.fgSaturation = this.slThumbX
      this.fgLightness = 100 - this.slThumbY
      this.fgColor = this.hslToHex(this.fgHue, this.fgSaturation, this.fgLightness)
    },
    selectSaturationLightnessBg(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      this.slThumbXBg = Math.max(0, Math.min(100, x))
      this.slThumbYBg = Math.max(0, Math.min(100, y))
      this.bgSaturation = this.slThumbXBg
      this.bgLightness = 100 - this.slThumbYBg
      this.bgColor = this.hslToHex(this.bgHue, this.bgSaturation, this.bgLightness)
    },
    selectHue(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      this.hueThumbX = Math.max(0, Math.min(100, x))
      this.fgHue = (this.hueThumbX / 100) * 360
      this.fgColor = this.hslToHex(this.fgHue, this.fgSaturation, this.fgLightness)
    },
    selectHueBg(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      this.hueThumbXBg = Math.max(0, Math.min(100, x))
      this.bgHue = (this.hueThumbXBg / 100) * 360
      this.bgColor = this.hslToHex(this.bgHue, this.bgSaturation, this.bgLightness)
    },
    updateSlThumb(type) {
      if (type === 'fg') {
        this.slThumbX = this.fgSaturation
        this.slThumbY = 100 - this.fgLightness
      } else {
        this.slThumbXBg = this.bgSaturation
        this.slThumbYBg = 100 - this.bgLightness
      }
    },
    updateHueThumb(type) {
      if (type === 'fg') {
        this.hueThumbX = (this.fgHue / 360) * 100
      } else {
        this.hueThumbXBg = (this.bgHue / 360) * 100
      }
    },
    hexToHsl(hex) {
      let r = parseInt(hex.slice(1, 3), 16) / 255
      let g = parseInt(hex.slice(3, 5), 16) / 255
      let b = parseInt(hex.slice(5, 7), 16) / 255
      let max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) {
        h = s = 0
      } else {
        let d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 }
    },
    hslToHex(h, s, l) {
      h /= 360
      s /= 100
      l /= 100
      let r, g, b
      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
      }
      return '#' + [r, g, b].map(x => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')
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
      
      // 安全过滤：移除可能的 HTML/JS 注入
      const safeInput = this.input.trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
      
      try {
        const qr = QRCode(0, 'M')
        qr.addData(safeInput)
        qr.make()
        
        const pixelRatio = 4
        const displaySize = 400
        const size = displaySize * pixelRatio
        const moduleCount = qr.getModuleCount()
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
        
        // 如果选择了渐变，使用 Canvas 渐变绘制背景
        if (this.bgGradientIndex >= 2 && this.bgGradients[this.bgGradientIndex]) {
          const gradient = this.bgGradients[this.bgGradientIndex]
          const grad = ctx.createLinearGradient(0, 0, size, size)
          grad.addColorStop(0, gradient[0])
          grad.addColorStop(1, gradient[1])
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, size, size)
        }
        
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
    // 初始化滑块位置
    const fgHsl = this.hexToHsl(this.fgColor)
    this.fgHue = fgHsl.h
    this.fgSaturation = fgHsl.s
    this.fgLightness = fgHsl.l
    this.updateSlThumb('fg')
    this.updateHueThumb('fg')
    
    const bgHsl = this.hexToHsl(this.bgColor)
    this.bgHue = bgHsl.h
    this.bgSaturation = bgHsl.s
    this.bgLightness = bgHsl.l
    this.updateSlThumb('bg')
    this.updateHueThumb('bg')
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
  flex: 1;
  position: relative;
}

.color-preview-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 60px;
  height: 40px;
  border: 2px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-preview:hover {
  transform: scale(1.05);
  border-color: var(--green);
}

.color-picker-panel {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--panel-2);
  border: 2px solid var(--line);
  border-radius: 0;
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  margin-top: 8px;
  width: 280px;
}

.sl-gradient {
  width: 100%;
  height: 150px;
  background: linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, transparent);
  border: 2px solid var(--line);
  border-radius: 0;
  position: relative;
  margin-bottom: 12px;
  cursor: crosshair;
}

.sl-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.hue-slider {
  width: 100%;
  height: 16px;
  background: linear-gradient(to right, 
    #ff0000, #ffff00, #00ff00, 
    #00ffff, #0000ff, #ff00ff, #ff0000);
  border: 2px solid var(--line);
  border-radius: 0;
  position: relative;
  margin-bottom: 12px;
  cursor: pointer;
}

.hue-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.hex-input-wrapper {
  margin-bottom: 12px;
}

.hex-input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 8px;
  text-transform: uppercase;
}

.hex-input:focus {
  outline: 0;
  border-color: var(--green);
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

.bg-presets {
  grid-template-columns: repeat(2, 1fr);
}

.bg-preset {
  height: 40px;
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
  
  .color-picker-panel {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    margin: 0;
    border-radius: 0;
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
