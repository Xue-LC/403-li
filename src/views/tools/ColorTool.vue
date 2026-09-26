<template>
    <section class="tool-pane">
      <div class="tool-pane-head"><span>🎨 颜色转换</span><span>在线工具</span></div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <div class="color-preview-wrapper">
                <label class="tool-label">当前颜色：</label>
                <div class="color-preview" :style="{ '--current-color': rgbaColor }" @click.stop="togglePicker"></div>
                <div v-if="showPicker" class="color-picker-panel" @click.stop>
                  <div class="sl-gradient" @click="selectSaturationLightness" :style="slGradientStyle">
                    <div class="sl-thumb" :style="{ left: slThumbX + '%', top: slThumbY + '%' }"></div>
                  </div>
                  <div class="hue-slider" @click="selectHue">
                    <div class="hue-thumb" :style="{ left: hueThumbX + '%' }"></div>
                  </div>
                  <div class="alpha-slider-wrapper">
                    <label class="slider-label">透明度：{{ alpha }}%</label>
                    <div class="alpha-slider" @click="selectAlpha">
                      <div class="alpha-gradient"></div>
                      <div class="alpha-thumb" :style="{ left: alphaThumbX + '%' }"></div>
                    </div>
                    <input type="range" v-model.number="alpha" @input="updateColorFromAlpha" min="0" max="100" class="alpha-range-input" />
                  </div>
                </div>
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">HEX：</label>
              <div class="input-with-copy">
                <input type="text" v-model="hexColor" @input="convertFromHex" placeholder="#9dff6b80" class="code-input-sm" />
                <button class="copy-btn" @click="copyHex" title="复制 HEX">📋</button>
              </div>
              <label class="tool-label">RGB：</label>
              <div class="input-with-copy">
                <input type="text" v-model="rgbColor" @input="convertFromRgb" placeholder="rgb(157, 255, 107)" class="code-input-sm" />
                <button class="copy-btn" @click="copyRgb" title="复制 RGB">📋</button>
              </div>
              <label class="tool-label">HSL：</label>
              <div class="input-with-copy">
                <input type="text" v-model="hslColor" @input="convertFromHsl" placeholder="hsl(106, 100%, 71%)" class="code-input-sm" />
                <button class="copy-btn" @click="copyHsl" title="复制 HSL">📋</button>
              </div>
            </div>
          </div>
          
          <div v-if="error" class="status-error">❌ {{ error }}</div>
        </div>
      </div>
    </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'
export default {
  name: 'ColorTool',
    data() {
    return {
      hexColor: '#9dff6b', rgbColor: '', hslColor: '', alpha: 100, error: '', showPicker: false,
      hue: 120, saturation: 100, value: 100, slThumbX: 100, slThumbY: 0, hueThumbX: 33, alphaThumbX: 100
    }
  },
  computed: {
    rgbaColor() {
      const r = parseInt(this.hexColor.slice(1, 3), 16), g = parseInt(this.hexColor.slice(3, 5), 16), b = parseInt(this.hexColor.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${this.alpha / 100})`
    },
    slGradientStyle() {
      const pureColor = this.hsvToHex(this.hue, 100, 100)
      return { backgroundImage: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #808080, ${pureColor})` }
    }
  },
  methods: {
    togglePicker() { this.showPicker = !this.showPicker },
    selectSaturationLightness(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      this.slThumbX = x; this.slThumbY = y; this.saturation = x; this.value = 100 - y
      const [r, g, b] = this.hsvToRgb(this.hue, this.saturation / 100, this.value / 100)
      this.updateAllInputs(r, g, b, this.alpha)
    },
    hsvToRgb(h, s, v) {
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
    hsvToHex(h, s, v) {
      const [r, g, b] = this.hsvToRgb(h, s / 100, v / 100)
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    },
    selectHue(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      this.hueThumbX = x; this.hue = (x / 100) * 360
      const [r, g, b] = this.hsvToRgb(this.hue, this.saturation / 100, this.value / 100)
      this.updateAllInputs(r, g, b, this.alpha)
    },
    selectAlpha(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      this.alpha = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
      this.alphaThumbX = this.alpha
      this.updateColorFromAlpha()
    },
    updateColorFromAlpha() {
      const rgb = this.hexToRgb(this.hexColor)
      this.alphaThumbX = this.alpha
      this.slThumbX = this.saturation; this.slThumbY = 100 - this.value
      this.updateAllInputs(rgb.r, rgb.g, rgb.b, this.alpha)
    },
    updateAllInputs(r, g, b, alpha) {
      if (alpha === 100) this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      else this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('') + Math.round(alpha * 255 / 100).toString(16).padStart(2, '0')
      this.rgbColor = alpha === 100 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(alpha / 100).toFixed(2)})`
      const hsl = this.rgbToHsl(r, g, b)
      this.hslColor = alpha === 100 ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` : `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${(alpha / 100).toFixed(2)})`
    },
    validateColor() {
      if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(this.hexColor)) this.hexColor = this.hsvToHex(this.hue, this.saturation, this.value)
      else {
        const hsv = this.hexToHsv(this.hexColor)
        this.hue = hsv.h; this.saturation = hsv.s; this.value = hsv.v
        this.updateSlThumb(); this.updateHueThumb()
      }
    },
    updateSlThumb() { this.slThumbX = this.saturation; this.slThumbY = 100 - this.value },
    updateHueThumb() { this.hueThumbX = (this.hue / 360) * 100 },
    convertFromHex() {
      try {
        const hex = this.hexColor.trim()
        if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) throw new Error('无效的 HEX 格式')
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
        if (hex.length === 9) { this.alpha = Math.round(parseInt(hex.slice(7, 9), 16) / 255 * 100) } else { this.alpha = 100 }
        this.alphaThumbX = this.alpha
        this.updateAllInputs(r, g, b, this.alpha)
        const hsv = this.rgbToHsv(r, g, b)
        this.hue = hsv.h; this.saturation = hsv.s; this.value = hsv.v
        this.updateSlThumb(); this.updateHueThumb()
        this.error = ''
      } catch (e) { this.error = e.message }
    },
    convertFromRgb() {
      try {
        const rgbaMatch = this.rgbColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
        const rgbMatch = this.rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        let r, g, b, a = 1
        if (rgbaMatch) { r = parseInt(rgbaMatch[1]); g = parseInt(rgbaMatch[2]); b = parseInt(rgbaMatch[3]); a = parseFloat(rgbaMatch[4]); this.alpha = Math.round(a * 100) }
        else if (rgbMatch) { r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]); this.alpha = 100 }
        else throw new Error('无效的 RGB 格式')
        this.alphaThumbX = this.alpha
        if (this.alpha === 100) this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
        else this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('') + Math.round(this.alpha * 255 / 100).toString(16).padStart(2, '0')
        const hsl = this.rgbToHsl(r, g, b)
        this.hslColor = this.alpha === 100 ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` : `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${(this.alpha / 100).toFixed(2)})`
        this.hue = hsl.h; this.saturation = hsl.s; this.lightness = hsl.l
        this.updateSlThumb(); this.updateHueThumb()
        this.error = ''
      } catch (e) { this.error = e.message }
    },
    convertFromHsl() {
      try {
        const hslaMatch = this.hslColor.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%,\s*([\d.]+)\)/)
        const hslMatch = this.hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        let h, s, l, a = 1
        if (hslaMatch) { h = parseInt(hslaMatch[1]); s = parseInt(hslaMatch[2]) / 100; l = parseInt(hslaMatch[3]) / 100; a = parseFloat(hslaMatch[4]); this.alpha = Math.round(a * 100) }
        else if (hslMatch) { h = parseInt(hslMatch[1]); s = parseInt(hslMatch[2]) / 100; l = parseInt(hslMatch[3]) / 100; this.alpha = 100 }
        else throw new Error('无效的 HSL 格式')
        this.alphaThumbX = this.alpha
        const rgb = this.hslToRgb(h, s, l)
        this.rgbColor = this.alpha === 100 ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(this.alpha / 100).toFixed(2)})`
        if (this.alpha === 100) this.hexColor = '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
        else this.hexColor = '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('') + Math.round(this.alpha * 255 / 100).toString(16).padStart(2, '0')
        this.hue = h; this.saturation = s * 100; this.lightness = l * 100
        this.updateSlThumb(); this.updateHueThumb()
        this.error = ''
      } catch (e) { this.error = e.message }
    },
    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) { h = s = 0 }
      else {
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
      const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
      return [Math.round(hue2rgb(p, q, h / 360 + 1/3) * 255), Math.round(hue2rgb(p, q, h / 360) * 255), Math.round(hue2rgb(p, q, h / 360 - 1/3) * 255)]
    },
    hexToRgb(hex) { return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) } },
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
    async copyHex() { await copyText(this.hexColor) },
    async copyRgb() { await copyText(this.rgbColor) },
    async copyHsl() { await copyText(this.hslColor) }
  },
  mounted() {
    this.convertFromHex()
    document.addEventListener('click', () => { this.showPicker = false })
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

.color-preview-wrapper { position: relative; margin-bottom: 1.5rem; }

.color-preview {
  width: 100%; height: 80px;
  border: 2px solid var(--line);
  cursor: pointer;
  transition: transform 0.2s;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.color-preview::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; z-index: 0;
}

.color-preview::after { content: ''; position: absolute; inset: 0; background: var(--current-color); z-index: 1; }
.color-preview:hover { transform: scale(1.05); border-color: var(--green); }

.color-picker-panel {
  position: absolute; top: 100%; left: 0;
  background: var(--panel-2); border: 2px solid var(--line);
  padding: 12px; z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  margin-top: 8px; width: 100%; min-width: 280px;
}

.sl-gradient { width: 100%; height: 150px; border: 2px solid var(--line); position: relative; margin-bottom: 12px; cursor: crosshair; }

.sl-thumb {
  position: absolute; width: 14px; height: 14px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.hue-slider {
  width: 100%; height: 16px;
  background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  border: 2px solid var(--line); position: relative; margin-bottom: 12px; cursor: pointer;
}

.hue-thumb {
  position: absolute; top: 50%; width: 18px; height: 18px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.alpha-slider-wrapper { margin-bottom: 8px; position: relative; }
.alpha-range-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; margin: 0; }

.slider-label { color: var(--green); font-family: var(--mono); font-size: 12px; text-transform: uppercase; display: block; margin-bottom: 6px; }

.alpha-slider {
  width: 100%; height: 20px; border: 2px solid var(--line);
  position: relative; cursor: pointer; overflow: hidden;
  background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.alpha-gradient { position: absolute; inset: 0; background: linear-gradient(to right, transparent, #000); }

.alpha-thumb {
  position: absolute; top: 50%; width: 22px; height: 22px;
  background: #fff; border: 2px solid #000; border-radius: 50%;
  transform: translate(-50%, -50%); pointer-events: none;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
}

.input-with-copy { position: relative; display: flex; align-items: center; }

.copy-btn {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: transparent; border: none;
  color: var(--green); cursor: pointer; font-size: 16px; padding: 4px 8px;
  transition: all 0.2s;
}

.copy-btn:hover { color: var(--text); transform: translateY(-50%) scale(1.1); }

@media (max-width: 640px) {
  .color-picker-panel { position: fixed; inset: auto 0 0 0; width: auto; margin: 0; }
}
</style>