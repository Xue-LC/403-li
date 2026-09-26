<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>📱 二维码生成</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入文本或 URL：</label>
              <textarea
                v-model="input"
                placeholder="输入要生成二维码的内容，例如：https://403.li"
                rows="6"
                class="code-input"
              ></textarea>
            </div>
            <div class="tool-col">
              <label class="tool-label">预览：</label>
              <div class="qr-output">
                <canvas ref="qrCanvas" v-show="qrGenerated"></canvas>
                <div v-if="!qrGenerated" class="qr-placeholder">
                  <p>二维码将显示在这里</p>
                </div>
              </div>
            </div>
          </div>

          <div class="color-picker-group">
            <div class="color-picker">
              <label class="tool-label">前景色：</label>
              <div class="color-preview-wrapper">
                <div class="color-preview" :style="{ '--current-color': fgRgbaColor }" @click.stop="togglePicker('fg')"></div>
                <div v-if="showFgPicker" class="color-picker-panel" @click.stop>
                  <div class="sl-gradient" @click="selectSaturationLightness" :style="fgSlGradientStyle">
                    <div class="sl-thumb" :style="{ left: slThumbX + '%', top: slThumbY + '%' }"></div>
                  </div>
                  <div class="hue-slider" @click="selectHue">
                    <div class="hue-thumb" :style="{ left: hueThumbX + '%' }"></div>
                  </div>
                  <div class="alpha-slider-wrapper">
                    <label class="slider-label">透明度：{{ fgAlpha }}%</label>
                    <div class="alpha-slider" @click="selectAlpha">
                      <div class="alpha-gradient"></div>
                      <div class="alpha-thumb" :style="{ left: fgAlphaThumbX + '%' }"></div>
                    </div>
                    <input 
                      type="range" 
                      v-model.number="fgAlpha" 
                      @input="updateColorFromAlpha('fg')"
                      min="0" 
                      max="100" 
                      class="alpha-range-input"
                    />
                  </div>
                  <div class="hex-input-wrapper">
                    <input 
                      type="text" 
                      v-model="fgColor" 
                      @input="convertFromHex('fg')"
                      class="hex-input"
                      placeholder="#9dff6bff"
                    />
                  </div>
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
              <label class="tool-label">背景色：</label>
              <div class="color-preview-wrapper">
                <div class="color-preview" :style="{ '--current-color': bgRgbaColor }" @click.stop="togglePicker('bg')"></div>
                <div v-if="showBgPicker" class="color-picker-panel" @click.stop>
                  <div class="sl-gradient" @click="selectSaturationLightnessBg" :style="bgSlGradientStyle">
                    <div class="sl-thumb" :style="{ left: slThumbXBg + '%', top: slThumbYBg + '%' }"></div>
                  </div>
                  <div class="hue-slider" @click="selectHueBg">
                    <div class="hue-thumb" :style="{ left: hueThumbXBg + '%' }"></div>
                  </div>
                  <div class="alpha-slider-wrapper">
                    <label class="slider-label">透明度：{{ bgAlpha }}%</label>
                    <div class="alpha-slider" @click="selectAlphaBg">
                      <div class="alpha-gradient"></div>
                      <div class="alpha-thumb" :style="{ left: bgAlphaThumbX + '%' }"></div>
                    </div>
                    <input 
                      type="range" 
                      v-model.number="bgAlpha" 
                      @input="updateColorFromAlpha('bg')"
                      min="0" 
                      max="100" 
                      class="alpha-range-input"
                    />
                  </div>
                  <div class="hex-input-wrapper">
                    <input 
                      type="text" 
                      v-model="bgColor" 
                      @input="convertFromHex('bg')"
                      class="hex-input"
                      placeholder="#0d1117ff"
                    />
                  </div>
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
            <label class="tool-label">二维码样式：</label>
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
          
          <div class="button-group button-group-3">
            <button class="tool-button primary" @click="generate" :disabled="!input.trim()">
              📱 生成二维码
            </button>
            <button class="tool-button" @click="download" :disabled="!qrGenerated">
              💾 下载图片
            </button>
            <button class="tool-button danger full-width" @click="clear">
              🗑️ 清空
            </button>
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
</template>

<script>
import QRCode from 'qrcode-generator'

export default {
  name: 'QrCodeTool',
    data() {
    return {
      input: '',
      fgColor: '#9dff6b',
      bgColor: '#0d1117',
      fgAlpha: 100,
      bgAlpha: 100,
      qrStyle: 'square',
      error: '',
      success: '',
      qrGenerated: false,
      showFgPicker: false,
      showBgPicker: false,
      fgPresetColors: ['#9dff6b', '#000000', '#ffffff', '#ff6b6b', '#ffd93d', '#4d96ff', '#6bcb77', '#c0c0c0'],
      bgPresetColors: ['#0d1117', '#ffffff', '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a8edea'],
      bgGradients: [null, null, ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a8edea', '#fed6e3']],
      bgGradientIndex: -1,
      fgHue: 96, fgSaturation: 100, fgValue: 100,
      slThumbX: 100, slThumbY: 0, hueThumbX: 27, fgAlphaThumbX: 100,
      bgHue: 210, bgSaturation: 18, bgValue: 9,
      slThumbXBg: 18, slThumbYBg: 91, hueThumbXBg: 58, bgAlphaThumbX: 100
    }
  },
  computed: {
    fgSlGradientStyle() {
      const pureColor = this.hsvToHex(this.fgHue, 100, 100)
      return { backgroundImage: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #808080, ${pureColor})` }
    },
    bgSlGradientStyle() {
      const pureColor = this.hsvToHex(this.bgHue, 100, 100)
      return { backgroundImage: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #808080, ${pureColor})` }
    },
    fgRgbaColor() {
      const rgb = this.hexToRgb(this.fgColor)
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.fgAlpha / 100})`
    },
    bgRgbaColor() {
      const rgb = this.hexToRgb(this.bgColor)
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.bgAlpha / 100})`
    }
  },
  methods: {
    togglePicker(type) {
      if (type === 'fg') { this.showFgPicker = !this.showFgPicker; this.showBgPicker = false }
      else { this.showBgPicker = !this.showBgPicker; this.showFgPicker = false }
    },
    selectColor(type, color) {
      if (type === 'fg') {
        this.fgColor = color; this.showFgPicker = false
        const hsv = this.hexToHsv(color)
        this.fgHue = hsv.h; this.fgSaturation = hsv.s; this.fgValue = hsv.v
        this.updateSlThumb('fg'); this.updateHueThumb('fg')
      } else {
        this.bgColor = color; this.showBgPicker = false
        const hsv = this.hexToHsv(color)
        this.bgHue = hsv.h; this.bgSaturation = hsv.s; this.bgValue = hsv.v
        this.updateSlThumb('bg'); this.updateHueThumb('bg')
      }
    },
    selectBgColor(index) {
      this.bgGradientIndex = index
      const color = this.bgPresetColors[index]
      const gradient = this.bgGradients[index]
      this.bgColor = gradient ? gradient[0] : color
      this.showBgPicker = false
      const hsv = this.hexToHsv(this.bgColor)
      this.bgHue = hsv.h; this.bgSaturation = hsv.s; this.bgValue = hsv.v
      this.updateSlThumb('bg'); this.updateHueThumb('bg')
    },
    selectSaturationLightness(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      this.slThumbX = x; this.slThumbY = y
      this.fgSaturation = x; this.fgValue = 100 - y
      this.fgColor = this.hsvToHexWithAlpha(this.fgHue, this.fgSaturation, this.fgValue, this.fgAlpha)
    },
    selectSaturationLightnessBg(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      this.slThumbXBg = x; this.slThumbYBg = y
      this.bgSaturation = x; this.bgValue = 100 - y
      this.bgColor = this.hsvToHexWithAlpha(this.bgHue, this.bgSaturation, this.bgValue, this.bgAlpha)
    },
    selectHue(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      this.hueThumbX = x; this.fgHue = (x / 100) * 360
      this.fgColor = this.hsvToHexWithAlpha(this.fgHue, this.fgSaturation, this.fgValue, this.fgAlpha)
    },
    selectHueBg(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      this.hueThumbXBg = x; this.bgHue = (x / 100) * 360
      this.bgColor = this.hsvToHexWithAlpha(this.bgHue, this.bgSaturation, this.bgValue, this.bgAlpha)
    },
    selectAlpha(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
      this.fgAlpha = x; this.fgAlphaThumbX = x
      this.fgColor = this.hsvToHexWithAlpha(this.fgHue, this.fgSaturation, this.fgValue, this.fgAlpha)
    },
    selectAlphaBg(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
      this.bgAlpha = x; this.bgAlphaThumbX = x
      this.bgColor = this.hsvToHexWithAlpha(this.bgHue, this.bgSaturation, this.bgValue, this.bgAlpha)
    },
    updateColorFromAlpha(type) {
      if (type === 'fg') {
        this.fgAlphaThumbX = this.fgAlpha
        this.fgColor = this.hsvToHexWithAlpha(this.fgHue, this.fgSaturation, this.fgValue, this.fgAlpha)
      } else {
        this.bgAlphaThumbX = this.bgAlpha
        this.bgColor = this.hsvToHexWithAlpha(this.bgHue, this.bgSaturation, this.bgValue, this.bgAlpha)
      }
    },
    convertFromHex(type) {
      const hex = (type === 'fg' ? this.fgColor : this.bgColor).trim()
      if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) return
      const hsv = this.hexToHsv(hex)
      if (type === 'fg') {
        this.fgHue = hsv.h; this.fgSaturation = hsv.s; this.fgValue = hsv.v
        this.updateSlThumb('fg'); this.updateHueThumb('fg')
        if (hex.length === 9) {
          this.fgAlpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100)
          this.fgAlphaThumbX = this.fgAlpha
        } else { this.fgAlpha = 100; this.fgAlphaThumbX = 100 }
      } else {
        this.bgHue = hsv.h; this.bgSaturation = hsv.s; this.bgValue = hsv.v
        this.updateSlThumb('bg'); this.updateHueThumb('bg')
        if (hex.length === 9) {
          this.bgAlpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100)
          this.bgAlphaThumbX = this.bgAlpha
        } else { this.bgAlpha = 100; this.bgAlphaThumbX = 100 }
      }
    },
    hsvToHexWithAlpha(h, s, v, alpha) {
      const hex = this.hsvToHex(h, s, v)
      return alpha === 100 ? hex : hex + Math.round(alpha * 255 / 100).toString(16).padStart(2, '0')
    },
    hexToRgb(hex) {
      return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) }
    },
    hexToHsv(hex) {
      let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255
      let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
      let h = 0, s = max === 0 ? 0 : d / max, v = max
      if (d !== 0) {
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
          case g: h = ((b - r) / d + 2) * 60; break
          case b: h = ((r - g) / d + 4) * 60; break
        }
      }
      return { h, s: s * 100, v: v * 100 }
    },
    hsvToHex(h, s, v) {
      s /= 100; v /= 100
      const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c
      let r, g, b
      if (h < 60) { r = c; g = x; b = 0 }
      else if (h < 120) { r = x; g = c; b = 0 }
      else if (h < 180) { r = 0; g = c; b = x }
      else if (h < 240) { r = 0; g = x; b = c }
      else if (h < 300) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      return '#' + [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)].map(x => x.toString(16).padStart(2, '0')).join('')
    },
    hsvToRgb(h, s, v) {
      s /= 100; v /= 100
      const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c
      let r, g, b
      if (h < 60) { r = c; g = x; b = 0 }
      else if (h < 120) { r = x; g = c; b = 0 }
      else if (h < 180) { r = 0; g = c; b = x }
      else if (h < 240) { r = 0; g = x; b = c }
      else if (h < 300) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
    },
    rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
      let h = 0, s = max === 0 ? 0 : d / max, v = max
      if (d !== 0) {
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
          case g: h = ((b - r) / d + 2) * 60; break
          case b: h = ((r - g) / d + 4) * 60; break
        }
      }
      return { h, s: s * 100, v: v * 100 }
    },
    drawSmartRoundedRect(ctx, x, y, width, height, radius, corners) {
      ctx.beginPath()
      const tl = corners.topLeft ? radius : 0, tr = corners.topRight ? radius : 0
      const br = corners.bottomRight ? radius : 0, bl = corners.bottomLeft ? radius : 0
      ctx.moveTo(x + tl, y)
      ctx.lineTo(x + width - tr, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + tr)
      ctx.lineTo(x + width, y + height - br)
      ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height)
      ctx.lineTo(x + bl, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - bl)
      ctx.lineTo(x, y + tl)
      ctx.quadraticCurveTo(x, y, x + tl, y)
      ctx.closePath()
      ctx.fill()
    },
    async generate() {
      this.error = ''; this.success = ''; this.qrGenerated = false
      this.showFgPicker = false; this.showBgPicker = false
      if (!this.input.trim()) { this.error = '请输入要生成二维码的内容'; return }
      const safeInput = this.input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '')
      try {
        const qr = QRCode(0, 'M')
        qr.addData(unescape(encodeURIComponent(safeInput)))
        qr.make()
        const pixelRatio = 4, displaySize = 400
        const size = displaySize * pixelRatio
        const moduleCount = qr.getModuleCount()
        const margin = 2
        const moduleSize = Math.floor(size / (moduleCount + margin * 2))
        const qrSize = moduleCount * moduleSize
        const offset = Math.round((size - qrSize) / 2)
        const canvas = this.$refs.qrCanvas
        const ctx = canvas.getContext('2d')
        canvas.width = size; canvas.height = size
        canvas.style.width = displaySize + 'px'; canvas.style.height = 'auto'
        ctx.fillStyle = this.bgColor
        ctx.fillRect(0, 0, size, size)
        if (this.bgAlpha < 100) {
          const gridSize = 20 * pixelRatio
          ctx.fillStyle = '#ccc'
          for (let gx = 0; gx < size; gx += gridSize)
            for (let gy = 0; gy < size; gy += gridSize)
              if (((gx / gridSize) + (gy / gridSize)) % 2 === 0) ctx.fillRect(gx, gy, gridSize, gridSize)
          ctx.fillStyle = this.bgRgbaColor
          ctx.fillRect(0, 0, size, size)
        }
        if (this.bgGradientIndex >= 2 && this.bgGradients[this.bgGradientIndex]) {
          const gradient = this.bgGradients[this.bgGradientIndex]
          const grad = ctx.createLinearGradient(0, 0, size, size)
          const rgb1 = this.hexToRgb(gradient[0]), rgb2 = this.hexToRgb(gradient[1])
          const alpha = this.bgAlpha / 100
          grad.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${alpha})`)
          grad.addColorStop(1, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${alpha})`)
          ctx.fillStyle = grad
          ctx.fillRect(0, 0, size, size)
        }
        ctx.fillStyle = this.fgRgbaColor
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              const x = Math.round(offset + col * moduleSize)
              const y = Math.round(offset + row * moduleSize)
              if (this.qrStyle === 'square') ctx.fillRect(x, y, Math.round(moduleSize), Math.round(moduleSize))
              else if (this.qrStyle === 'dots') {
                const radius = Math.round(moduleSize * 0.48)
                ctx.beginPath()
                ctx.arc(Math.round(x + moduleSize / 2), Math.round(y + moduleSize / 2), radius, 0, Math.PI * 2)
                ctx.fill()
              } else if (this.qrStyle === 'rounded') {
                const hasTop = row > 0 && qr.isDark(row - 1, col)
                const hasBottom = row < moduleCount - 1 && qr.isDark(row + 1, col)
                const hasLeft = col > 0 && qr.isDark(row, col - 1)
                const hasRight = col < moduleCount - 1 && qr.isDark(row, col + 1)
                if (hasTop && hasBottom && hasLeft && hasRight) ctx.fillRect(x, y, Math.round(moduleSize), Math.round(moduleSize))
                else {
                  const radius = Math.round(moduleSize * 0.3)
                  this.drawSmartRoundedRect(ctx, x, y, Math.round(moduleSize), Math.round(moduleSize), radius, {
                    topLeft: !hasTop && !hasLeft, topRight: !hasTop && !hasRight,
                    bottomRight: !hasBottom && !hasRight, bottomLeft: !hasBottom && !hasLeft
                  })
                }
              }
            }
          }
        }
        this.qrGenerated = true
        this.success = '二维码生成成功！'
        setTimeout(() => { this.success = '' }, 3000)
      } catch (e) {
        this.error = '生成失败：' + e.message
        this.qrGenerated = false
      }
    },
    download() {
      if (!this.qrGenerated) { this.error = '请先生成二维码'; return }
      try {
        const canvas = this.$refs.qrCanvas
        const link = document.createElement('a')
        link.download = 'qrcode-' + Date.now() + '.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
        this.success = '下载已开始！'
        setTimeout(() => { this.success = '' }, 3000)
      } catch (e) {
        this.error = '下载失败：' + e.message
      }
    },
    clear() {
      this.input = ''; this.error = ''; this.success = ''
      this.qrGenerated = false; this.showFgPicker = false; this.showBgPicker = false
      const canvas = this.$refs.qrCanvas
      if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height) }
    },
    updateSlThumb(type) {
      if (type === 'fg') { this.slThumbX = this.fgSaturation; this.slThumbY = 100 - this.fgValue }
      else { this.slThumbXBg = this.bgSaturation; this.slThumbYBg = 100 - this.bgValue }
    },
    updateHueThumb(type) {
      if (type === 'fg') this.hueThumbX = (this.fgHue / 360) * 100
      else this.hueThumbXBg = (this.bgHue / 360) * 100
    }
  },
  mounted() {
    document.addEventListener('click', () => { this.showFgPicker = false; this.showBgPicker = false })
    const fgHsv = this.hexToHsv(this.fgColor)
    this.fgHue = fgHsv.h; this.fgSaturation = fgHsv.s; this.fgValue = fgHsv.v
    this.updateSlThumb('fg'); this.updateHueThumb('fg')
    const bgHsv = this.hexToHsv(this.bgColor)
    this.bgHue = bgHsv.h; this.bgSaturation = bgHsv.s; this.bgValue = bgHsv.v
    this.updateSlThumb('bg'); this.updateHueThumb('bg')
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

/* 颜色选择器组 */
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
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
  overflow: hidden;
}

.color-preview::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 0;
}

.color-preview::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--current-color);
  z-index: 1;
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
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  margin-top: 8px;
  width: 280px;
}

.sl-gradient {
  width: 100%;
  height: 150px;
  border: 2px solid var(--line);
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
  background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  border: 2px solid var(--line);
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

.alpha-slider-wrapper {
  margin-bottom: 12px;
  position: relative;
}

.alpha-range-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

.slider-label {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 6px;
}

.alpha-slider {
  width: 100%;
  height: 20px;
  border: 2px solid var(--line);
  position: relative;
  cursor: pointer;
  overflow: hidden;
  background: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.alpha-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent, #000);
}

.alpha-thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
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

/* 样式选择器 */
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

/* 二维码输出 */
.qr-output {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255,255,255,0.02);
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

/* 响应式 */
@media (max-width: 640px) {
  .color-picker-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .color-picker-panel {
    position: fixed;
    inset: auto 0 0 0;
    width: auto;
    margin: 0;
  }
  
  .style-buttons {
    flex-direction: column;
  }
  
  .button-group-3 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .qr-output {
    padding: 1rem;
    min-height: 280px;
  }
}

@media (max-width: 375px) {
  .button-group-3 {
    grid-template-columns: 1fr;
  }
  
  .qr-output {
    min-height: 250px;
  }
}
</style>