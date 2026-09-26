<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📦 CSS Box Shadow 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">阴影图层 ({{ layers.length }})：</label>
            <div class="layers-list">
              <div v-for="(layer, idx) in layers" :key="idx" class="layer-item" :class="{ active: activeLayer === idx }" @click="activeLayer = idx">
                <div class="layer-header">
                  <span class="layer-name">图层 {{ idx + 1 }}</span>
                  <button
                    v-if="layers.length > 1"
                    class="layer-remove-btn"
                    @click.stop="removeLayer(idx)"
                    title="移除此图层"
                  >✕</button>
                </div>
                <div class="layer-preview-mini" :style="{ boxShadow: formatLayer(layer) }"></div>
              </div>
            </div>
            <button class="tool-button" style="margin-top:8px" @click="addLayer">+ 添加图层</button>

            <!-- 当前选中图层的控制 -->
            <template v-if="activeLayer !== null && layers[activeLayer]">
              <label class="tool-label">X 偏移：{{ layers[activeLayer].offsetX }}px</label>
              <input type="range" v-model.number="layers[activeLayer].offsetX" min="-50" max="50" class="range-input" />
              <div class="length-display"><span>{{ layers[activeLayer].offsetX }}px</span></div>

              <label class="tool-label">Y 偏移：{{ layers[activeLayer].offsetY }}px</label>
              <input type="range" v-model.number="layers[activeLayer].offsetY" min="-50" max="50" class="range-input" />
              <div class="length-display"><span>{{ layers[activeLayer].offsetY }}px</span></div>

              <label class="tool-label">模糊半径：{{ layers[activeLayer].blur }}px</label>
              <input type="range" v-model.number="layers[activeLayer].blur" min="0" max="100" class="range-input" />
              <div class="length-display"><span>{{ layers[activeLayer].blur }}px</span></div>

              <label class="tool-label">扩散半径：{{ layers[activeLayer].spread }}px</label>
              <input type="range" v-model.number="layers[activeLayer].spread" min="-50" max="50" class="range-input" />
              <div class="length-display"><span>{{ layers[activeLayer].spread }}px</span></div>

              <label class="tool-label">阴影颜色：</label>
              <div class="color-row">
                <ColorPicker v-model="layers[activeLayer].color" />
                <span class="color-hex">{{ layers[activeLayer].color }}</span>
              </div>

              <label class="checkbox-label" style="margin-top:10px">
                <input type="checkbox" v-model="layers[activeLayer].inset" />
                <span>内阴影 (inset)</span>
              </label>
            </template>
          </div>

          <!-- 右栏：预览 + CSS 代码 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="shadow-preview-wrapper" :class="'bg-' + previewBg">
              <div class="shadow-preview" :style="{ boxShadow: cssValue }"></div>
            </div>

            <label class="tool-label">CSS 代码：</label>
            <textarea
              class="code-input output"
              :value="generatedCSS"
              readonly
              rows="4"
            ></textarea>

            <div class="button-group button-group-2" style="margin-top:8px">
              <button class="tool-button primary" @click="copyCSS">📋 复制 CSS</button>
              <button class="tool-button" @click="randomShadow">🎲 随机</button>
            </div>

            <label class="tool-label">预览元素：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="card" />
                <span>卡片</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="dark" />
                <span>深色</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="previewBg" value="light" />
                <span>亮色</span>
              </label>
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
  name: 'BoxShadowTool',
  components: { ColorPicker },
  data() {
    return {
      activeLayer: 0,
      layers: [
        { offsetX: 4, offsetY: 4, blur: 16, spread: 0, color: '#00000066', inset: false }
      ],
      previewBg: 'card',
      copyMsg: '',
      error: ''
    }
  },
  computed: {
    cssValue() {
      return this.layers.map(l => this.formatLayer(l)).join(', ')
    },
    generatedCSS() {
      if (this.cssValue) {
        return `box-shadow: ${this.cssValue};`
      }
      return `box-shadow: none;`
    }
  },
  methods: {
    formatLayer(layer) {
      const inset = layer.inset ? 'inset ' : ''
      return `${inset}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${layer.color}`
    },
    addLayer() {
      this.layers.push({ offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: '#00000044', inset: false })
      this.activeLayer = this.layers.length - 1
    },
    removeLayer(idx) {
      if (this.layers.length <= 1) return
      this.layers.splice(idx, 1)
      if (this.activeLayer >= this.layers.length) {
        this.activeLayer = this.layers.length - 1
      }
    },
    randomShadow() {
      const count = 1 + Math.floor(Math.random() * 3)
      this.layers = []
      for (let i = 0; i < count; i++) {
        this.layers.push({
          offsetX: Math.floor(Math.random() * 21) - 10,
          offsetY: Math.floor(Math.random() * 21) - 5,
          blur: Math.floor(Math.random() * 50) + 4,
          spread: Math.floor(Math.random() * 21) - 10,
          color: this.randomColor(),
          inset: Math.random() > 0.7
        })
      }
      this.activeLayer = 0
    },
    randomColor() {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      const a = (0.2 + Math.random() * 0.6).toFixed(2)
      return `rgba(${r}, ${g}, ${b}, ${a})`
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
.shadow-preview-wrapper {
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: var(--panel-2);
  border: 2px solid var(--line);
  border-radius: 0;
  transition: background 0.2s;
}

.shadow-preview {
  width: 160px;
  height: 120px;
  background: var(--card-bg);
  border: 1px solid var(--line);
  border-radius: 0;
  transition: box-shadow 0.15s;
}

.layers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layer-item {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.layer-item:hover {
  border-color: var(--green);
}

.layer-item.active {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 12px var(--green-glow);
}

.layer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.layer-name {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 11px;
  color: var(--green);
  text-transform: uppercase;
  white-space: nowrap;
}

.layer-remove-btn {
  background: transparent;
  border: 1px solid var(--red);
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  padding: 0;
  line-height: 1;
}

.layer-remove-btn:hover {
  background: var(--red);
  color: var(--bg);
}

.layer-preview-mini {
  width: 40px;
  height: 20px;
  background: var(--card-bg);
  margin-top: 4px;
  border-radius: 0;
}

.length-display {
  margin-top: 4px;
}

.length-display span {
  font-family: 'MapleMono NF CN', monospace;
  color: var(--green);
  font-size: 13px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.layer-color-picker {
  width: 36px;
  height: 30px;
  border: 1px solid var(--green);
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
}

.layer-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.layer-color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-hex {
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  color: var(--text-dim);
}

/* Preview background themes */
.bg-card {
  background: var(--panel-2);
}
.bg-card .shadow-preview {
  background: var(--card-bg);
}
.bg-dark {
  background: #0a0a0a;
}
.bg-dark .shadow-preview {
  background: #1a1a1a;
}
.bg-light {
  background: #e8e8e8;
}
.bg-light .shadow-preview {
  background: #ffffff;
}

@media (max-width: 900px) {
  .shadow-preview-wrapper {
    min-height: 160px;
    padding: 24px;
  }
  .shadow-preview {
    width: 140px;
    height: 100px;
  }
}

@media (max-width: 640px) {
  .layer-item {
    flex: 0 0 calc(50% - 6px);
  }
}

@media (max-width: 375px) {
  .layer-item {
    flex: 0 0 100%;
  }
}
</style>
