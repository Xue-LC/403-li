<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔤 CSS Text Shadow 生成器</span>
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
                <div class="layer-preview-mini" :style="{ textShadow: formatLayer(layer) }">Aa</div>
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
              <input type="range" v-model.number="layers[activeLayer].blur" min="0" max="50" class="range-input" />
              <div class="length-display"><span>{{ layers[activeLayer].blur }}px</span></div>

              <label class="tool-label">阴影颜色：</label>
              <div class="color-row">
                <ColorPicker v-model="layers[activeLayer].color" />
                <span class="color-hex">{{ layers[activeLayer].color }}</span>
              </div>
            </template>
          </div>

          <!-- 右栏：预览 + CSS 代码 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="shadow-preview-wrapper" :class="'bg-' + previewBg">
              <span class="preview-text" :style="{ textShadow: cssValue }">Hello 403.li</span>
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

            <label class="tool-label">预览背景：</label>
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

            <label class="tool-label">文字大小：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="fontSize" value="32" />
                <span>小</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="fontSize" value="48" />
                <span>中</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="fontSize" value="64" />
                <span>大</span>
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
  name: 'TextShadowTool',
  components: { ColorPicker },
  data() {
    return {
      activeLayer: 0,
      layers: [
        { offsetX: 2, offsetY: 2, blur: 4, color: '#00000066' }
      ],
      previewBg: 'card',
      fontSize: 48,
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
        return `text-shadow: ${this.cssValue};`
      }
      return `text-shadow: none;`
    }
  },
  methods: {
    formatLayer(layer) {
      return `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.color}`
    },
    addLayer() {
      this.layers.push({ offsetX: 1, offsetY: 1, blur: 8, color: '#00000044' })
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
          offsetX: Math.floor(Math.random() * 11) - 5,
          offsetY: Math.floor(Math.random() * 11) - 3,
          blur: Math.floor(Math.random() * 20) + 2,
          color: this.randomColor()
        })
      }
      this.activeLayer = 0
    },
    randomColor() {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      const a = (0.3 + Math.random() * 0.6).toFixed(2)
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
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: var(--panel-2);
  border: 2px solid var(--line);
  border-radius: 0;
  transition: background 0.2s;
}

.preview-text {
  font-family: 'MapleMono NF CN', monospace;
  font-weight: 700;
  color: var(--text);
  transition: text-shadow 0.15s, font-size 0.2s;
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
  font-family: 'MapleMono NF CN', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-top: 4px;
  line-height: 1.2;
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
.bg-dark {
  background: #0a0a0a;
}
.bg-dark .preview-text {
  color: #ffffff;
}
.bg-light {
  background: #e8e8e8;
}
.bg-light .preview-text {
  color: #1a1a1a;
}

@media (max-width: 900px) {
  .shadow-preview-wrapper {
    min-height: 140px;
    padding: 24px;
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
