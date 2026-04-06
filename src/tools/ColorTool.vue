<template>
  <div class="color-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🎨 颜色转换</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 颜色预览 -->
          <div class="color-preview-wrapper">
            <label class="input-label">当前颜色：</label>
            <div class="color-preview" :style="{ '--current-color': rgbaColor }" @click.stop="togglePicker"></div>
            <div v-if="showPicker" class="color-picker-panel" @click.stop>
              <!-- 饱和度/亮度区域 -->
              <div class="sl-gradient" @click="selectSaturationLightness" :style="slGradientStyle">
                <div class="sl-thumb" :style="{ left: slThumbX + '%', top: slThumbY + '%' }"></div>
              </div>
              <!-- 色相滑块 -->
              <div class="hue-slider" @click="selectHue">
                <div class="hue-thumb" :style="{ left: hueThumbX + '%' }"></div>
              </div>
              <!-- 透明度滑块 -->
              <div class="alpha-slider-wrapper">
                <label class="slider-label">透明度：{{ alpha }}%</label>
                <div class="alpha-slider" @click="selectAlpha">
                  <div class="alpha-gradient"></div>
                  <div class="alpha-thumb" :style="{ left: alphaThumbX + '%' }"></div>
                </div>
                <input 
                  type="range" 
                  v-model="alpha" 
                  @input="updateColorFromAlpha"
                  min="0" 
                  max="100" 
                  class="alpha-range-input"
                />
              </div>
            </div>
          </div>
          
          <!-- HEX 输入 -->
          <label class="input-label">HEX：</label>
          <div class="input-with-copy">
            <input 
              type="text" 
              v-model="hexColor" 
              @input="convertFromHex"
              placeholder="#9dff6b80"
              class="code-input"
            />
            <button class="copy-btn" @click="copyHex" title="复制 HEX">📋</button>
          </div>
          
          <!-- RGB 输入 -->
          <label class="input-label">RGB：</label>
          <div class="input-with-copy">
            <input 
              type="text" 
              v-model="rgbColor" 
              @input="convertFromRgb"
              placeholder="rgb(157, 255, 107)"
              class="code-input"
            />
            <button class="copy-btn" @click="copyRgb" title="复制 RGB">📋</button>
          </div>
          
          <!-- HSL 输入 -->
          <label class="input-label">HSL：</label>
          <div class="input-with-copy">
            <input 
              type="text" 
              v-model="hslColor" 
              @input="convertFromHsl"
              placeholder="hsl(106, 100%, 71%)"
              class="code-input"
            />
            <button class="copy-btn" @click="copyHsl" title="复制 HSL">📋</button>
          </div>
          
          <div v-if="error" class="status-error">❌ {{ error }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 颜色转换工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'ColorTool',
  components: {
    Topbar
  },
  data() {
    return {
      hexColor: '#9dff6b',
      rgbColor: '',
      hslColor: '',
      alpha: 100,
      error: '',
      showPicker: false,
      // HSL 值
      hue: 120,
      saturation: 100,
      lightness: 50,
      slThumbX: 100,
      slThumbY: 0,
      hueThumbX: 33,
      alphaThumbX: 100
    }
  },
  computed: {
    rgbaColor() {
      const r = parseInt(this.hexColor.slice(1, 3), 16)
      const g = parseInt(this.hexColor.slice(3, 5), 16)
      const b = parseInt(this.hexColor.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${this.alpha / 100})`
    },
    slGradientStyle() {
      // 标准 HSL 饱和度/亮度选择器渐变
      // 底层：从左到右 灰色→纯色（控制饱和度）
      // 中层：从上到下 白色→透明（亮度高光）
      // 顶层：从上到下 透明→黑色（亮度阴影）
      return {
        background: `
          linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1)),
          linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0)),
          linear-gradient(to right, #808080, hsl(${this.hue}, 100%, 50%))
        `
      }
    }
  },
  methods: {
    togglePicker() {
      this.showPicker = !this.showPicker
    },
    selectSaturationLightness(event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      
      // 限制在 0-100 范围内
      // X 轴：从左到右 = 饱和度 0% → 100%
      // Y 轴：从上到下 = 亮度 100% → 0%（上白下黑）
      this.saturation = Math.max(0, Math.min(100, x))
      this.lightness = Math.max(0, Math.min(100, 100 - y))
      
      // 更新圆点位置
      // slThumbX = 饱和度百分比
      // slThumbY = (100 - 亮度) 百分比，因为 CSS top 是向下的
      this.slThumbX = this.saturation
      this.slThumbY = 100 - this.lightness
      
      // 转换为 RGB（hslToRgb 需要 s 和 l 为 0-1 的小数）
      const rgb = this.hslToRgb(this.hue, this.saturation / 100, this.lightness / 100)
      
      // 保持当前透明度
      const alpha = this.alpha
      
      // 更新所有输入框（保持透明度通道）
      this.updateAllInputs(rgb[0], rgb[1], rgb[2], alpha)
    },
    selectHue(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      this.hueThumbX = Math.max(0, Math.min(100, x))
      this.hue = (this.hueThumbX / 100) * 360
      this.hexColor = this.hslToHex(this.hue, this.saturation, this.lightness)
      this.convertFromHex()
    },
    selectAlpha(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      this.alpha = Math.max(0, Math.min(100, Math.round(x)))
      this.alphaThumbX = this.alpha
      this.updateColorFromAlpha()
    },
    updateColorFromAlpha() {
      const rgb = this.hexToRgb(this.hexColor)
      
      // 更新透明度滑块位置
      this.alphaThumbX = this.alpha
      
      // 更新圆点位置
      this.slThumbX = this.saturation
      this.slThumbY = 100 - this.lightness
      
      // 使用统一方法更新所有输入
      this.updateAllInputs(rgb.r, rgb.g, rgb.b, this.alpha)
    },
    updateAllInputs(r, g, b, alpha) {
      // HEX
      if (alpha === 100) {
        this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      } else {
        const alphaHex = Math.round(alpha * 255 / 100).toString(16).padStart(2, '0')
        this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('') + alphaHex
      }
      
      // RGB
      if (alpha === 100) {
        this.rgbColor = `rgb(${r}, ${g}, ${b})`
      } else {
        this.rgbColor = `rgba(${r}, ${g}, ${b}, ${(alpha / 100).toFixed(2)})`
      }
      
      // HSL
      const hsl = this.rgbToHsl(r, g, b)
      if (alpha === 100) {
        this.hslColor = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
      } else {
        this.hslColor = `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${(alpha / 100).toFixed(2)})`
      }
    },
    validateColor() {
      if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(this.hexColor)) {
        this.hexColor = this.hslToHex(this.hue, this.saturation, this.lightness)
      } else {
        const hsl = this.hexToHsl(this.hexColor)
        this.hue = hsl.h
        this.saturation = hsl.s
        this.lightness = hsl.l
        this.updateSlThumb()
        this.updateHueThumb()
      }
    },
    updateSlThumb() {
      this.slThumbX = this.saturation
      this.slThumbY = 100 - this.lightness
    },
    updateHueThumb() {
      this.hueThumbX = (this.hue / 360) * 100
    },
    convertFromHex() {
      try {
        const hex = this.hexColor.trim()
        // 支持 6 位和 8 位 HEX
        if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
          throw new Error('无效的 HEX 格式')
        }
        
        // HEX → RGB
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        
        // 如果是 8 位 HEX，提取透明度
        if (hex.length === 9) {
          const alphaHex = hex.slice(7, 9)
          this.alpha = Math.round(parseInt(alphaHex, 16) / 255 * 100)
          this.alphaThumbX = this.alpha
        }
        
        // RGB 格式：透明度 100% 用 rgb，否则用 rgba
        if (this.alpha === 100) {
          this.rgbColor = `rgb(${r}, ${g}, ${b})`
        } else {
          this.rgbColor = `rgba(${r}, ${g}, ${b}, ${(this.alpha / 100).toFixed(2)})`
        }
        
        // HEX → HSL
        const hsl = this.rgbToHsl(r, g, b)
        
        // HSL 格式：透明度 100% 用 hsl，否则用 hsla
        if (this.alpha === 100) {
          this.hslColor = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
        } else {
          this.hslColor = `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${(this.alpha / 100).toFixed(2)})`
        }
        
        // 更新 HSL 值和滑块位置
        this.hue = hsl.h
        this.saturation = hsl.s
        this.lightness = hsl.l
        this.updateSlThumb()
        this.updateHueThumb()
        
        this.error = ''
      } catch (e) {
        this.error = e.message
      }
    },
    convertFromRgb() {
      try {
        // 支持 rgb 和 rgba 两种格式
        const rgbaMatch = this.rgbColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
        const rgbMatch = this.rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        
        let r, g, b, a = 1
        if (rgbaMatch) {
          r = parseInt(rgbaMatch[1])
          g = parseInt(rgbaMatch[2])
          b = parseInt(rgbaMatch[3])
          a = parseFloat(rgbaMatch[4])
          this.alpha = Math.round(a * 100)
          this.alphaThumbX = this.alpha
        } else if (rgbMatch) {
          r = parseInt(rgbMatch[1])
          g = parseInt(rgbMatch[2])
          b = parseInt(rgbMatch[3])
          this.alpha = 100
          this.alphaThumbX = 100
        } else {
          throw new Error('无效的 RGB 格式')
        }
        
        // RGB → HEX (带透明度)
        if (this.alpha === 100) {
          this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
        } else {
          const alphaHex = Math.round(this.alpha * 255 / 100).toString(16).padStart(2, '0')
          this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('') + alphaHex
        }
        
        // RGB → HSL
        const hsl = this.rgbToHsl(r, g, b)
        
        // HSL 格式：透明度 100% 用 hsl，否则用 hsla
        if (this.alpha === 100) {
          this.hslColor = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
        } else {
          this.hslColor = `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${(this.alpha / 100).toFixed(2)})`
        }
        
        // 更新 HSL 值和滑块位置
        this.hue = hsl.h
        this.saturation = hsl.s
        this.lightness = hsl.l
        this.updateSlThumb()
        this.updateHueThumb()
        
        this.error = ''
      } catch (e) {
        this.error = e.message
      }
    },
    convertFromHsl() {
      try {
        // 支持 hsl 和 hsla 两种格式
        const hslaMatch = this.hslColor.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%,\s*([\d.]+)\)/)
        const hslMatch = this.hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        
        let h, s, l, a = 1
        if (hslaMatch) {
          h = parseInt(hslaMatch[1])
          s = parseInt(hslaMatch[2]) / 100
          l = parseInt(hslaMatch[3]) / 100
          a = parseFloat(hslaMatch[4])
          this.alpha = Math.round(a * 100)
          this.alphaThumbX = this.alpha
        } else if (hslMatch) {
          h = parseInt(hslMatch[1])
          s = parseInt(hslMatch[2]) / 100
          l = parseInt(hslMatch[3]) / 100
          this.alpha = 100
          this.alphaThumbX = 100
        } else {
          throw new Error('无效的 HSL 格式')
        }
        
        // HSL → RGB
        const rgb = this.hslToRgb(h, s, l)
        
        // RGB 格式：透明度 100% 用 rgb，否则用 rgba
        if (this.alpha === 100) {
          this.rgbColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
        } else {
          this.rgbColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(this.alpha / 100).toFixed(2)})`
        }
        
        // HSL → HEX (带透明度)
        if (this.alpha === 100) {
          this.hexColor = '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
        } else {
          const alphaHex = Math.round(this.alpha * 255 / 100).toString(16).padStart(2, '0')
          this.hexColor = '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('') + alphaHex
        }
        
        // 更新 HSL 值和滑块位置
        this.hue = h
        this.saturation = s * 100
        this.lightness = l * 100
        this.updateSlThumb()
        this.updateHueThumb()
        
        this.error = ''
      } catch (e) {
        this.error = e.message
      }
    },
    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) {
        h = s = 0
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 }
    },
    hslToRgb(h, s, l) {
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
      const r = hue2rgb(p, q, h / 360 + 1/3)
      const g = hue2rgb(p, q, h / 360)
      const b = hue2rgb(p, q, h / 360 - 1/3)
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
    },
    hexToRgb(hex) {
      // 支持 6 位和 8 位 HEX
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
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
    copyHex() {
      navigator.clipboard.writeText(this.hexColor)
    },
    copyRgb() {
      navigator.clipboard.writeText(this.rgbColor)
    },
    copyHsl() {
      navigator.clipboard.writeText(this.hslColor)
    }
  },
  mounted() {
    // 初始化时转换一次
    this.convertFromHex()
    
    // 点击外部关闭选择器
    document.addEventListener('click', () => {
      this.showPicker = false
    })
    
    // 初始化滑块位置
    const hsl = this.hexToHsl(this.hexColor)
    this.hue = hsl.h
    this.saturation = hsl.s
    this.lightness = hsl.l
    this.updateSlThumb()
    this.updateHueThumb()
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.color-tool {
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

/* === Color Preview === */
.color-preview-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.color-preview {
  width: 100%;
  height: 80px;
  border: 2px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.color-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  border-radius: 0;
  padding: 12px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  margin-top: 8px;
  width: 100%;
  min-width: 280px;
}

.sl-gradient {
  width: 100%;
  height: 150px;
  border: 2px solid var(--line);
  border-radius: 0;
  position: relative;
  margin-bottom: 12px;
  cursor: crosshair;
  /* 标准的 HSL 饱和度/亮度渐变 */
  background: 
    /* 顶层：从上到下 白→透明 */
    linear-gradient(to bottom, #fff, transparent),
    /* 中层：从左到右 灰色→纯色 */
    linear-gradient(to right, #808080, hsl(var(--hue), 100%, 50%)),
    /* 底层：从上到下 黑→白 */
    linear-gradient(to bottom, #000, #fff);
}

.sl-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
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

.alpha-slider-wrapper {
  margin-bottom: 8px;
  position: relative;
}

.alpha-range-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  border-radius: 0;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, 
    rgba(255,255,255,0), 
    rgba(255,255,255,1));
  background-image: 
    linear-gradient(45deg, #ccc 25%, transparent 25%), 
    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #ccc 75%), 
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
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

/* === Input Label === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

/* === Input with Copy Button === */
.input-with-copy {
  position: relative;
  display: flex;
  align-items: center;
}

.code-input {
  flex: 1;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px 50px 12px 12px;
  border-radius: 0;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.copy-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  transition: all 0.2s;
}

.copy-btn:hover {
  color: var(--text);
  transform: scale(1.1);
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

/* === Responsive === */
@media (max-width: 640px) {
  .color-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .pane-body {
    padding: 10px;
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
}
</style>
