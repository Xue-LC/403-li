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
          <!-- 颜色选择器 -->
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="hexColor" 
              @input="convertFromHex"
              class="color-input" 
            />
            <div class="color-preview" :style="{ backgroundColor: hexColor }"></div>
          </div>
          
          <!-- HEX 输入 -->
          <label class="input-label">HEX：</label>
          <div class="input-with-copy">
            <input 
              type="text" 
              v-model="hexColor" 
              @input="convertFromHex"
              placeholder="#9dff6b"
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
      error: ''
    }
  },
  methods: {
    convertFromHex() {
      try {
        const hex = this.hexColor.trim()
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          throw new Error('无效的 HEX 格式')
        }
        
        // HEX → RGB
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        this.rgbColor = `rgb(${r}, ${g}, ${b})`
        
        // HEX → HSL
        const hsl = this.rgbToHsl(r, g, b)
        this.hslColor = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
        
        this.error = ''
      } catch (e) {
        this.error = e.message
      }
    },
    convertFromRgb() {
      try {
        const match = this.rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!match) throw new Error('无效的 RGB 格式')
        
        const r = parseInt(match[1])
        const g = parseInt(match[2])
        const b = parseInt(match[3])
        
        // RGB → HEX
        this.hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
        
        // RGB → HSL
        const hsl = this.rgbToHsl(r, g, b)
        this.hslColor = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
        
        this.error = ''
      } catch (e) {
        this.error = e.message
      }
    },
    convertFromHsl() {
      try {
        const match = this.hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (!match) throw new Error('无效的 HSL 格式')
        
        const h = parseInt(match[1])
        const s = parseInt(match[2]) / 100
        const l = parseInt(match[3]) / 100
        
        // HSL → RGB
        const rgb = this.hslToRgb(h, s, l)
        this.rgbColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
        
        // HSL → HEX
        this.hexColor = '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
        
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

/* === Color Picker Wrapper === */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 0;
}

.color-input {
  width: 60px;
  height: 60px;
  border: 2px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-input::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

.color-preview {
  flex: 1;
  height: 60px;
  border: 2px solid var(--line);
  border-radius: 0;
  box-shadow: 0 0 20px rgba(157, 255, 107, 0.3);
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
  
  .color-picker-wrapper {
    flex-direction: column;
    gap: 12px;
  }
  
  .color-input {
    width: 100%;
    height: 50px;
  }
  
  .color-preview {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .color-picker-wrapper {
    padding: 0.75rem;
  }
}
</style>
