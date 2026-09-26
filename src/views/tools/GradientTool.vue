<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌈 CSS 渐变生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">渐变类型：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="gradientType" value="linear" />
                <span>线性渐变</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gradientType" value="radial" />
                <span>径向渐变</span>
              </label>
            </div>

            <template v-if="gradientType === 'linear'">
              <label class="tool-label">角度：{{ angle }}°</label>
              <input type="range" v-model.number="angle" min="0" max="360" class="range-input" />
              <div class="length-display"><span>{{ angle }}°</span></div>
            </template>

            <template v-else>
              <label class="tool-label">径向形状：</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="radialShape" value="ellipse" />
                  <span>椭圆</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="radialShape" value="circle" />
                  <span>圆形</span>
                </label>
              </div>
              <label class="tool-label">中心位置 X：{{ radialX }}%</label>
              <input type="range" v-model.number="radialX" min="0" max="100" class="range-input" />
              <label class="tool-label">中心位置 Y：{{ radialY }}%</label>
              <input type="range" v-model.number="radialY" min="0" max="100" class="range-input" />
            </template>

            <label class="tool-label">色标（{{ stops.length }} 个）：</label>
            <div class="stops-list">
              <div v-for="(stop, index) in stops" :key="index" class="stop-item">
                <span class="stop-index">{{ index + 1 }}</span>
                <ColorPicker v-model="stop.color" />
                <span class="stop-hex">{{ stop.color }}</span>
                <input
                  type="number"
                  v-model.number="stop.position"
                  min="0"
                  max="100"
                  class="stop-position-input"
                />%
                <button
                  v-if="stops.length > 2"
                  class="stop-remove-btn"
                  @click="removeStop(index)"
                  title="移除此色标"
                >✕</button>
              </div>
            </div>
            <button class="tool-button" style="margin-top:8px" @click="addStop">+ 添加色标</button>
          </div>

          <!-- 右栏：预览 + CSS 代码 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="gradient-preview" :style="{ background: cssValue }"></div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="6"
            ></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="randomGradient">🎲 随机</button>
            </div>
          </div>
        </div>

        <div v-if="copyMsg" class="status-success">{{ copyMsg }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'
import ColorPicker from '../../components/ColorPicker.vue'

export default {
  name: 'GradientTool',
  components: { ColorPicker },
  data() {
    return {
      gradientType: 'linear',
      angle: 90,
      radialShape: 'ellipse',
      radialX: 50,
      radialY: 50,
      stops: [
        { color: '#9dff6b', position: 0 },
        { color: '#0d1117', position: 100 }
      ],
      copyMsg: '',
      error: ''
    }
  },
  computed: {
    cssValue() {
      return this.buildGradient(false)
    },
    generatedCSS() {
      const std = this.buildGradient(false)
      const webkit = this.buildGradient(true)
      return `background: ${webkit};\nbackground: ${std};`
    },
    sortedStops() {
      return [...this.stops].sort((a, b) => a.position - b.position)
    }
  },
  methods: {
    buildGradient(webkit) {
      const sorted = this.sortedStops
      const stopStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ')

      if (this.gradientType === 'linear') {
        const ang = webkit ? ((450 - this.angle) % 360) : this.angle
        return `${webkit ? '-webkit-' : ''}linear-gradient(${ang}deg, ${stopStr})`
      } else {
        const pos = `at ${this.radialX}% ${this.radialY}%`
        return `${webkit ? '-webkit-' : ''}radial-gradient(${this.radialShape} ${pos}, ${stopStr})`
      }
    },
    addStop() {
      // Insert a new color stop at the midpoint of the largest gap
      const sorted = this.sortedStops
      let bestPos = 50
      let bestColor = '#888888'
      let maxGap = 0
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position
        if (gap > maxGap) {
          maxGap = gap
          bestPos = Math.round(sorted[i].position + gap / 2)
          // Interpolate color
          bestColor = this.interpolateColor(sorted[i].color, sorted[i + 1].color, 0.5)
        }
      }
      this.stops.push({ color: bestColor, position: bestPos })
    },
    removeStop(index) {
      if (this.stops.length <= 2) return
      this.stops.splice(index, 1)
    },
    interpolateColor(c1, c2, t) {
      const r1 = parseInt(c1.slice(1, 3), 16)
      const g1 = parseInt(c1.slice(3, 5), 16)
      const b1 = parseInt(c1.slice(5, 7), 16)
      const r2 = parseInt(c2.slice(1, 3), 16)
      const g2 = parseInt(c2.slice(3, 5), 16)
      const b2 = parseInt(c2.slice(5, 7), 16)
      const r = Math.round(r1 + (r2 - r1) * t)
      const g = Math.round(g1 + (g2 - g1) * t)
      const b = Math.round(b1 + (b2 - b1) * t)
      return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    },
    randomGradient() {
      this.gradientType = Math.random() > 0.5 ? 'linear' : 'radial'
      this.angle = Math.floor(Math.random() * 360)
      this.radialShape = Math.random() > 0.5 ? 'circle' : 'ellipse'
      this.radialX = Math.floor(Math.random() * 100)
      this.radialY = Math.floor(Math.random() * 100)
      const count = 2 + Math.floor(Math.random() * 3) // 2-4 stops
      this.stops = []
      for (let i = 0; i < count; i++) {
        this.stops.push({
          color: this.randomColor(),
          position: Math.round((i / (count - 1)) * 100)
        })
      }
    },
    randomColor() {
      const h = Math.floor(Math.random() * 360)
      const s = 60 + Math.floor(Math.random() * 40)
      const l = 40 + Math.floor(Math.random() * 30)
      const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100
      const x = c * (1 - Math.abs((h / 60) % 2 - 1))
      const m = l / 100 - c / 2
      let r, g, b
      if (h < 60) { r = c; g = x; b = 0 }
      else if (h < 120) { r = x; g = c; b = 0 }
      else if (h < 180) { r = 0; g = c; b = x }
      else if (h < 240) { r = 0; g = x; b = c }
      else if (h < 300) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      return '#' + [r, g, b].map(v => {
        return Math.round((v + m) * 255).toString(16).padStart(2, '0')
      }).join('')
    },
    async copyCSS() {
      try {
        await copyText(this.generatedCSS)
        this.copyMsg = '✅ CSS 已复制到剪贴板'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      } catch {
        this.error = '复制失败，请手动复制'
        setTimeout(() => { this.error = '' }, 3000)
      }
    }
  }
}
</script>

<style scoped>
.gradient-preview {
  width: 100%;
  min-height: 180px;
  border: 2px solid var(--green);
  background: var(--panel-2);
  border-radius: 0;
  box-shadow: 0 0 15px var(--green-glow);
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.stop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel-2);
  border: 1px solid var(--green);
  padding: 6px 8px;
  border-radius: 0;
}

.stop-index {
  font-family: inherit;
  color: var(--green);
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.stop-color-picker {
  width: 32px;
  height: 28px;
  border: 1px solid var(--green);
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
}

.stop-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.stop-color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.stop-hex {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  color: var(--text-dim);
  min-width: 60px;
}

.stop-position-input {
  width: 48px;
  background: var(--panel);
  border: 1px solid var(--green);
  color: var(--green);
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  padding: 3px 6px;
  text-align: center;
  border-radius: 0;
}

.stop-remove-btn {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 7px;
  border-radius: 0;
  margin-left: auto;
}

.stop-remove-btn:hover {
  background: var(--red);
  color: var(--bg);
}

.length-display {
  margin-top: 4px;
}

.length-display span {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 13px;
}

/* Mobile: stack stops more tightly */
@media (max-width: 640px) {
  .stop-item {
    flex-wrap: wrap;
    gap: 6px;
  }
  .gradient-preview {
    min-height: 140px;
  }
  .stop-hex {
    min-width: 52px;
    font-size: 11px;
  }
}
</style>
